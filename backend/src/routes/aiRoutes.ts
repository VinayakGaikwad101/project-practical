import { Router } from "express";
import { handleEditorChat, getDocumentChatHistory } from "../controllers/aiController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.post("/chat", handleEditorChat);
aiRouter.get("/history/:documentId", getDocumentChatHistory);
