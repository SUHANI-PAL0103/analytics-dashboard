import { Router, Request, Response } from "express";
import { prisma } from "../index";

const router = Router();

// GET /vendors/top10 - Returns top 10 vendors by spend
router.get("/top10", async (req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRaw<
      Array<{ vendor_id: string; vendor_name: string; spend: number }>
    >`
      SELECT 
        v.id as vendor_id,
        v.name as vendor_name,
        SUM(i.total)::numeric as spend
      FROM "Invoice" i
      INNER JOIN "Vendor" v ON i."vendorId" = v.id
      GROUP BY v.id, v.name
      ORDER BY spend DESC
      LIMIT 10
    `;

    const formatted = result.map((row) => ({
      vendor_id: row.vendor_id,
      vendor_name: row.vendor_name,
      spend: parseFloat(row.spend.toString()),
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching top vendors:", error);
    res.status(500).json({ error: "Failed to fetch top vendors" });
  }
});

export default router;
