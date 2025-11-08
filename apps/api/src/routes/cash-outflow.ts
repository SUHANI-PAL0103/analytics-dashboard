import { Router, Request, Response } from "express";
import { prisma } from "../index";

const router = Router();

// GET /cash-outflow - Returns expected cash outflow by date
router.get("/", async (req: Request, res: Response) => {
  try {
    const start = req.query.start
      ? new Date(req.query.start as string)
      : new Date();
    const end = req.query.end
      ? new Date(req.query.end as string)
      : new Date(new Date().setMonth(new Date().getMonth() + 3));

    const result = await prisma.$queryRaw<
      Array<{ date: Date; expected_outflow: number }>
    >`
      SELECT 
        DATE(i."dueDate") as date,
        SUM(i.total - COALESCE(p.paid_amount, 0))::numeric as expected_outflow
      FROM "Invoice" i
      LEFT JOIN (
        SELECT 
          "invoiceId",
          SUM(amount) as paid_amount
        FROM "Payment"
        GROUP BY "invoiceId"
      ) p ON i.id = p."invoiceId"
      WHERE i."dueDate" >= ${start} 
        AND i."dueDate" <= ${end}
        AND i.status != 'paid'
      GROUP BY DATE(i."dueDate")
      ORDER BY date ASC
    `;

    const formatted = result.map((row) => ({
      date: row.date,
      expected_outflow: parseFloat(row.expected_outflow.toString()),
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching cash outflow:", error);
    res.status(500).json({ error: "Failed to fetch cash outflow" });
  }
});

export default router;
