import { Router, Request, Response } from "express";
import { prisma } from "../index";

const router = Router();

// GET /category-spend - Returns spend grouped by category
router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRaw<
      Array<{ category: string; spend: number }>
    >`
      SELECT 
        COALESCE(li.category, 'Uncategorized') as category,
        SUM(li.total)::numeric as spend
      FROM "LineItem" li
      GROUP BY li.category
      ORDER BY spend DESC
    `;

    const formatted = result.map((row) => ({
      category: row.category,
      spend: parseFloat(row.spend.toString()),
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching category spend:", error);
    res.status(500).json({ error: "Failed to fetch category spend" });
  }
});

export default router;
