import { Router, Request, Response } from "express";
import { prisma } from "../index";

const router = Router();

// GET /stats - Returns overview statistics
router.get("/", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Total spend YTD
    const totalSpendResult = await prisma.invoice.aggregate({
      where: {
        issueDate: {
          gte: yearStart,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Total invoices
    const totalInvoices = await prisma.invoice.count();

    // Documents uploaded (same as invoices for this use case)
    const documentsUploaded = totalInvoices;

    // Average invoice value
    const avgInvoiceResult = await prisma.invoice.aggregate({
      _avg: {
        total: true,
      },
    });

    res.json({
      total_spend_ytd: totalSpendResult._sum.total?.toNumber() || 0,
      total_invoices: totalInvoices,
      documents_uploaded: documentsUploaded,
      average_invoice_value: avgInvoiceResult._avg.total?.toNumber() || 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
