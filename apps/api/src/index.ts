import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import statsRouter from "./routes/stats";
import invoicesRouter from "./routes/invoices";
import vendorsRouter from "./routes/vendors";
import categoryRouter from "./routes/category";
import trendsRouter from "./routes/trends";
import cashOutflowRouter from "./routes/cash-outflow";
import chatRouter from "./routes/chat";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Routes
app.use("/stats", statsRouter);
app.use("/invoices", invoicesRouter);
app.use("/vendors", vendorsRouter);
app.use("/category-spend", categoryRouter);
app.use("/invoice-trends", trendsRouter);
app.use("/cash-outflow", cashOutflowRouter);
app.use("/chat-with-data", chatRouter);

// Error handling
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});

export { prisma };
