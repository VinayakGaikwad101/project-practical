import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage extends Document {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: "user" | "ai";
  content: string;
  proposedContent?: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "DocumentDraft", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "ai"], required: true },
    content: { type: String, required: true },
    proposedContent: { type: String },
  },
  { timestamps: true }
);

export const ChatMessageModel =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
