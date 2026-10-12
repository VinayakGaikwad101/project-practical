import { Router } from "express";
import { exportPdf, queuePdfExport } from "../controllers/exportController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const exportRouter = Router();

exportRouter.use(requireAuth);

exportRouter.post("/pdf", exportPdf);
exportRouter.post("/pdf/queue", queuePdfExport);
