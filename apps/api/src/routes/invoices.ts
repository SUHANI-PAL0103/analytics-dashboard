import { Router, Request, Response } from "express";
import { prisma } from "../index";

const router = Router();

// GET /invoices - Returns paginated invoices with search and filters
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const sortField = (req.query.sort as string)?.split("_")[0] || "issueDate";
    const sortOrder = (req.query.sort as string)?.split("_")[1] || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { vendor: { name: { contains: search, mode: "insensitive" } } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.invoice.count({ where });

    // Get paginated data
    const invoices = await prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortField]: sortOrder,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Format response
    const data = invoices.map((invoice) => ({
      id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      vendor_name: invoice.vendor.name,
      customer_name: invoice.customer.name,
      issue_date: invoice.issueDate,
      due_date: invoice.dueDate,
      status: invoice.status,
      subtotal: invoice.subtotal.toNumber(),
      tax: invoice.tax?.toNumber() || 0,
      total: invoice.total.toNumber(),
      currency: invoice.currency,
    }));

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

export default router;
