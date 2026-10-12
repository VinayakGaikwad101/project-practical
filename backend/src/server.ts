import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { authRouter } from "./routes/authRoutes.js";
import { documentRouter } from "./routes/documentRoutes.js";
import { aiRouter } from "./routes/aiRoutes.js";
import { exportRouter } from "./routes/exportRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Middleware
app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "AI Document Editor Express Server",
    timestamp: new Date().toISOString(),
  });
});

// App Routes
app.use("/api/auth", authRouter);
app.use("/api/documents", documentRouter);
app.use("/api/ai", aiRouter);
app.use("/api/export", exportRouter);

// Start server
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`[Server] AI Document Editor Express Backend`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Allowed Client: ${CLIENT_URL}`);
    console.log(`======================================================\n`);
  });
}

startServer();
