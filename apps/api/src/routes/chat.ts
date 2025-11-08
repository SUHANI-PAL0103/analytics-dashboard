import { Router, Request, Response } from "express";
import fetch from "node-fetch";

const router = Router();

// POST /chat-with-data - Forwards query to Vanna AI service
router.post("/", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const vannaUrl = process.env.VANNA_API_BASE_URL || "http://localhost:8000";
    const apiKey = process.env.VANNA_API_KEY || "";

    // Forward request to Vanna AI service
    const response = await fetch(`${vannaUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Vanna API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Error in chat-with-data:", error);
    res.status(500).json({
      error: "Failed to process query",
      message: error.message,
    });
  }
});

export default router;
