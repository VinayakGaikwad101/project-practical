import { Router } from "express";
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/documentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const documentRouter = Router();

documentRouter.use(requireAuth);

documentRouter.get("/", getDocuments);
documentRouter.get("/:id", getDocumentById);
documentRouter.post("/", createDocument);
documentRouter.put("/:id", updateDocument);
documentRouter.delete("/:id", deleteDocument);
