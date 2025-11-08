import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface RawInvoiceData {
  _id: string;
  name: string;
  status: string;
  createdAt: { $date: string };
  updatedAt: { $date: string };
  extractedData: {
    llmData: {
      invoice: {
        value: {
          invoiceId?: { value: string };
          invoiceDate?: { value: string };
          deliveryDate?: { value: string };
        };
      };
      vendor: {
        value: {
          vendorName?: { value: string };
          vendorPartyNumber?: { value: string };
          vendorAddress?: { value: string };
          vendorTaxId?: { value: string };
        };
      };
      customer: {
        value: {
          customerName?: { value: string };
          customerAddress?: { value: string };
          customerEmail?: { value: string };
        };
      };
      payment: {
        value: {
          dueDate?: { value: string };
          paymentTerms?: { value: string };
          bankAccountNumber?: { value: string };
        };
      };
      summary: {
        value: {
          subTotal?: { value: number };
          totalTax?: { value: number };
          invoiceTotal?: { value: number };
          currencySymbol?: { value: string };
        };
      };
      lineItems?: {
        value: Array<{
          description?: { value: string };
          quantity?: { value: number };
          unitPrice?: { value: number };
          total?: { value: number };
          category?: { value: string };
        }>;
      };
    };
  };
}

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Read the JSON file
    const dataPath = path.join(__dirname, "../../../data/Analytics_Test_Data.json");
    const rawData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    console.log(`📄 Found ${rawData.length} records to process`);

    let processedCount = 0;
    let skippedCount = 0;

    for (const record of rawData as RawInvoiceData[]) {
      try {
        const llmData = record.extractedData?.llmData;
        if (!llmData) {
          skippedCount++;
          continue;
        }

        // Extract vendor data
        const vendorData = llmData.vendor?.value;
        const vendorName = vendorData?.vendorName?.value || "Unknown Vendor";
        const vendorTaxId = vendorData?.vendorTaxId?.value;
        const vendorAddress = vendorData?.vendorAddress?.value;

        // Upsert vendor
        const vendor = await prisma.vendor.upsert({
          where: {
            id: vendorTaxId || `vendor-${vendorName.replace(/\s+/g, "-").toLowerCase()}`,
          },
          update: {},
          create: {
            id: vendorTaxId || `vendor-${vendorName.replace(/\s+/g, "-").toLowerCase()}`,
            name: vendorName,
            taxId: vendorTaxId,
            address: vendorAddress ? { raw: vendorAddress } : null,
          },
        });

        // Extract customer data
        const customerData = llmData.customer?.value;
        const customerName = customerData?.customerName?.value || "Unknown Customer";
        const customerEmail = customerData?.customerEmail?.value;
        const customerAddress = customerData?.customerAddress?.value;

        // Upsert customer
        const customer = await prisma.customer.upsert({
          where: {
            id: `customer-${customerName.replace(/\s+/g, "-").toLowerCase()}`,
          },
          update: {},
          create: {
            id: `customer-${customerName.replace(/\s+/g, "-").toLowerCase()}`,
            name: customerName,
            email: customerEmail,
            address: customerAddress ? { raw: customerAddress } : null,
          },
        });

        // Extract invoice data
        const invoiceData = llmData.invoice?.value;
        const invoiceId = invoiceData?.invoiceId?.value || record._id;
        const invoiceDate = invoiceData?.invoiceDate?.value;
        const paymentData = llmData.payment?.value;
        const dueDate = paymentData?.dueDate?.value;

        // Extract summary data
        const summaryData = llmData.summary?.value;
        const subtotal = summaryData?.subTotal?.value || 0;
        const tax = summaryData?.totalTax?.value || 0;
        const total = summaryData?.invoiceTotal?.value || 0;
        const currency = summaryData?.currencySymbol?.value || "EUR";

        // Determine status (paid, pending, overdue)
        let status = "pending";
        if (record.status === "processed") {
          const today = new Date();
          const due = dueDate ? new Date(dueDate) : null;
          if (due && due < today) {
            status = "overdue";
          } else {
            status = "paid";
          }
        }

        // Create invoice
        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber: invoiceId,
            vendorId: vendor.id,
            customerId: customer.id,
            issueDate: invoiceDate ? new Date(invoiceDate) : new Date(record.createdAt.$date),
            dueDate: dueDate ? new Date(dueDate) : null,
            status,
            subtotal: Math.abs(subtotal),
            tax: tax ? Math.abs(tax) : null,
            total: Math.abs(total),
            currency: currency || "EUR",
            description: record.name,
            rawJson: record as any,
          },
        });

        // Create line items if available
        const lineItemsData = llmData.lineItems?.value;
        if (lineItemsData && Array.isArray(lineItemsData)) {
          for (const item of lineItemsData) {
            const description = item.description?.value || "Unknown Item";
            const quantity = item.quantity?.value || 1;
            const unitPrice = item.unitPrice?.value || 0;
            const itemTotal = item.total?.value || unitPrice * quantity;
            const category = item.category?.value || "General";

            await prisma.lineItem.create({
              data: {
                invoiceId: invoice.id,
                description,
                quantity,
                unitPrice: Math.abs(unitPrice),
                total: Math.abs(itemTotal),
                category,
              },
            });
          }
        } else {
          // Create a default line item from invoice total
          await prisma.lineItem.create({
            data: {
              invoiceId: invoice.id,
              description: record.name || "Invoice Item",
              quantity: 1,
              unitPrice: Math.abs(subtotal),
              total: Math.abs(subtotal),
              category: "General",
            },
          });
        }

        // Create payment record if status is paid
        if (status === "paid" && total > 0) {
          await prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: Math.abs(total),
              paidAt: new Date(record.updatedAt.$date),
              method: "bank_transfer",
              transactionId: paymentData?.bankAccountNumber?.value || null,
            },
          });
        }

        processedCount++;
        if (processedCount % 10 === 0) {
          console.log(`  ✓ Processed ${processedCount} invoices...`);
        }
      } catch (error: any) {
        console.error(`  ✗ Error processing record ${record._id}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n✅ Seed completed!`);
    console.log(`   - Processed: ${processedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);

    // Print summary stats
    const stats = await prisma.invoice.aggregate({
      _count: true,
      _sum: { total: true },
      _avg: { total: true },
    });

    console.log(`\n📊 Database Summary:`);
    console.log(`   - Total Invoices: ${stats._count}`);
    console.log(`   - Total Spend: $${stats._sum.total?.toFixed(2) || 0}`);
    console.log(`   - Average Invoice: $${stats._avg.total?.toFixed(2) || 0}`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
