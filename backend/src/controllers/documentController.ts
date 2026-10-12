import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { DocumentDraftModel } from "../models/DocumentDraft.js";
import mongoose from "mongoose";

export async function getDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const documents = await DocumentDraftModel.find({ authorId: userId })
      .sort({ updatedAt: -1 })
      .select("title status tags lastAutoSavedAt createdAt updatedAt");

    res.json({ success: true, documents });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch documents." });
  }
}

export async function getDocumentById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const docId = Array.isArray(id) ? id[0] : id;
    if (!docId || !mongoose.Types.ObjectId.isValid(docId)) {
      res.status(400).json({ success: false, error: "Invalid document ID." });
      return;
    }

    const doc = await DocumentDraftModel.findOne({ _id: docId, authorId: userId });
    if (!doc) {
      res.status(404).json({ success: false, error: "Document not found or access denied." });
      return;
    }

    res.json({ success: true, document: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch document." });
  }
}

export async function createDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { title, content, tags } = req.body;

    const doc = await DocumentDraftModel.create({
      title: title || "Untitled Document",
      content: content || "<h2>New Document</h2><p>Start drafting your content here or use the AI Copilot...</p>",
      tags: tags || [],
      authorId: userId,
      status: "draft",
    });

    res.status(201).json({ success: true, document: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to create document." });
  }
}

export async function updateDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { title, content, plainText, status, tags } = req.body;

    const updatePayload: any = { lastAutoSavedAt: new Date() };
    if (title !== undefined) updatePayload.title = title;
    if (content !== undefined) updatePayload.content = content;
    if (plainText !== undefined) updatePayload.plainText = plainText;
    if (status !== undefined) updatePayload.status = status;
    if (tags !== undefined) updatePayload.tags = tags;

    const doc = await DocumentDraftModel.findOneAndUpdate(
      { _id: id, authorId: userId },
      { $set: updatePayload },
      { new: true }
    );

    if (!doc) {
      res.status(404).json({ success: false, error: "Document not found or access denied." });
      return;
    }

    res.json({ success: true, document: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to update document." });
  }
}

export async function deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const doc = await DocumentDraftModel.findOneAndDelete({ _id: id, authorId: userId });
    if (!doc) {
      res.status(404).json({ success: false, error: "Document not found or access denied." });
      return;
    }

    res.json({ success: true, message: "Document deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to delete document." });
  }
}
