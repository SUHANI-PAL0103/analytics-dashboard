import { Router, Request, Response } from "express";
import { prisma } from "../index";

const router = Router();

// GET /invoice-trends - Returns monthly invoice count and spend
router.get("/", async (req: Request, res: Response) => {
  try {
    const start = req.query.start
      ? new Date(req.query.start as string)
      : new Date(new Date().getFullYear(), 0, 1);
    const end = req.query.end ? new Date(req.query.end as string) : new Date();

    const result = await prisma.$queryRaw<
      Array<{ month: string; invoice_count: number; spend: number }>
    >`
      SELECT 
        TO_CHAR(i."issueDate", 'YYYY-MM') as month,
        COUNT(*)::int as invoice_count,
        SUM(i.total)::numeric as spend
      FROM "Invoice" i
      WHERE i."issueDate" >= ${start} AND i."issueDate" <= ${end}
      GROUP BY TO_CHAR(i."issueDate", 'YYYY-MM')
      ORDER BY month ASC
    `;

    const formatted = result.map((row) => ({
      month: row.month,
      invoice_count: row.invoice_count,
      spend: parseFloat(row.spend.toString()),
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching invoice trends:", error);
    res.status(500).json({ error: "Failed to fetch invoice trends" });
  }
});

export default router;
