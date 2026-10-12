import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { DocumentDraftModel } from "../models/DocumentDraft.js";
import { generatePdfBuffer, pdfExportQueue, isRedisAvailable } from "../services/queueService.js";

export async function exportPdf(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { documentId } = req.body;
    const userId = req.user?.userId;

    if (!documentId) {
      res.status(400).json({ success: false, error: "documentId is required." });
      return;
    }

    const doc = await DocumentDraftModel.findOne({ _id: documentId, authorId: userId });
    if (!doc) {
      res.status(404).json({ success: false, error: "Document not found or access denied." });
      return;
    }

    // Direct download generation
    const buffer = await generatePdfBuffer(doc.title, doc.content);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.title)}.pdf"`);
    res.send(buffer);
  } catch (error: any) {
    console.error("[Export PDF Error]:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate PDF." });
  }
}

export async function queuePdfExport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { documentId } = req.body;
    const userId = req.user?.userId;

    const doc = await DocumentDraftModel.findOne({ _id: documentId, authorId: userId });
    if (!doc) {
      res.status(404).json({ success: false, error: "Document not found." });
      return;
    }

    if (isRedisAvailable && pdfExportQueue) {
      const job = await pdfExportQueue.add("export-pdf", {
        documentId: doc._id,
        title: doc.title,
        content: doc.content,
        userId,
      });

      res.json({ success: true, queued: true, jobId: job.id, message: "PDF export queued successfully." });
    } else {
      res.json({ success: true, queued: false, message: "Redis queue offline. Use direct download endpoint." });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to enqueue PDF export." });
  }
}
