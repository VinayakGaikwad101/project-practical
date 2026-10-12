import mongoose, { Schema, Document } from "mongoose";

export interface IDocumentDraft extends Document {
  title: string;
  content: string; // Preserves complete semantic HTML structure
  plainText: string;
  status: "draft" | "published" | "archived";
  authorId: mongoose.Types.ObjectId;
  tags: string[];
  lastAutoSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentDraftSchema = new Schema<IDocumentDraft>(
  {
    title: { type: String, default: "Untitled Document", trim: true },
    content: {
      type: String,
      default: "<h2>Introduction</h2><p>Start writing your document here or ask the embedded AI Copilot to generate content...</p>",
    },
    plainText: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tags: [{ type: String, trim: true }],
    lastAutoSavedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const DocumentDraftModel =
  mongoose.models.DocumentDraft || mongoose.model<IDocumentDraft>("DocumentDraft", DocumentDraftSchema);
