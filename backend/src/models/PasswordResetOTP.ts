import mongoose, { Schema, Document } from "mongoose";

export interface IPasswordResetOTP extends Document {
  email: string;
  otpHash: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const PasswordResetOTPSchema = new Schema<IPasswordResetOTP>(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-expires in MongoDB
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PasswordResetOTPModel =
  mongoose.models.PasswordResetOTP ||
  mongoose.model<IPasswordResetOTP>("PasswordResetOTP", PasswordResetOTPSchema);
