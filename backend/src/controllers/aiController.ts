import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { geminiLangChainService } from "../services/geminiService.js";
import { ChatMessageModel } from "../models/ChatMessage.js";
import mongoose from "mongoose";

export async function handleEditorChat(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const userName = req.user?.name;
    const { messages, documentTitle, documentContent, selectedText, documentId } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ success: false, error: "Messages array is required." });
      return;
    }

    const lastMsg = messages[messages.length - 1];

    // Save user chat message if documentId provided
    if (documentId && mongoose.Types.ObjectId.isValid(documentId)) {
      await ChatMessageModel.create({
        documentId,
        userId,
        role: "user",
        content: lastMsg.content,
      }).catch((e) => console.warn("Failed to persist user chat:", e.message));
    }

    const aiResult = await geminiLangChainService.processEditorInstruction({
      messages,
      documentTitle: documentTitle || "Document",
      documentContent: documentContent || "",
      selectedText,
      userName,
    });

    // Save AI chat response
    if (documentId && mongoose.Types.ObjectId.isValid(documentId)) {
      await ChatMessageModel.create({
        documentId,
        userId,
        role: "ai",
        content: aiResult.message,
        proposedContent: aiResult.proposedContent,
      }).catch((e) => console.warn("Failed to persist AI chat:", e.message));
    }

    res.json({
      success: true,
      message: aiResult.message,
      proposedContent: aiResult.proposedContent,
      retryAttempt: aiResult.retryAttempt,
      activeKeyMasked: aiResult.activeKeyMasked,
    });
  } catch (error: any) {
    console.error("[Editor Chat Error]:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to process AI chat." });
  }
}

export async function getDocumentChatHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { documentId } = req.params;
    const userId = req.user?.userId;

    const docId = Array.isArray(documentId) ? documentId[0] : documentId;
    if (!docId || !mongoose.Types.ObjectId.isValid(docId)) {
      res.status(400).json({ success: false, error: "Invalid document ID." });
      return;
    }

    const history = await ChatMessageModel.find({ documentId: docId, userId })
      .sort({ createdAt: 1 })
      .limit(50);

    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch chat history." });
  }
}
