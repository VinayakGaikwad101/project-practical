import { Request, Response } from "express";
import { UserModel } from "../models/User.js";
import { PasswordResetOTPModel } from "../models/PasswordResetOTP.js";
import {
  generateToken,
  hashPassword,
  comparePassword,
  generate6DigitOTP,
  hashOTP,
} from "../services/authService.js";
import { mailService } from "../services/mailService.js";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: "Name, email, and password are required." });
      return;
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ success: false, error: "An account with this email already exists." });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("[Auth Error - Register]:", error);
    res.status(500).json({ success: false, error: error.message || "Registration failed." });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password are required." });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user || !user.passwordHash) {
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("[Auth Error - Login]:", error);
    res.status(500).json({ success: false, error: error.message || "Login failed." });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: "Email is required." });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success anyway to avoid email enumeration
      res.json({ success: true, message: "If this email exists, an OTP has been dispatched." });
      return;
    }

    // Invalidate previous OTPs for this email
    await PasswordResetOTPModel.deleteMany({ email: user.email });

    const rawOTP = generate6DigitOTP();
    const otpHash = hashOTP(rawOTP);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await PasswordResetOTPModel.create({
      email: user.email,
      otpHash,
      expiresAt,
    });

    await mailService.sendPasswordResetOTP(user.email, rawOTP, user.name);

    res.json({
      success: true,
      message: "If this email exists, an OTP has been dispatched.",
    });
  } catch (error: any) {
    console.error("[Auth Error - Forgot Password]:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to process request." });
  }
}

export async function resetPasswordWithOTP(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      res.status(400).json({ success: false, error: "Email, OTP, and new password are required." });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: "Password must be at least 6 characters long." });
      return;
    }

    const hashedInput = hashOTP(otp.trim());
    const record = await PasswordResetOTPModel.findOne({
      email: email.toLowerCase(),
      otpHash: hashedInput,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      res.status(400).json({ success: false, error: "Invalid or expired OTP code." });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await UserModel.updateOne({ email: email.toLowerCase() }, { passwordHash: newHash });

    // Mark OTP as used
    record.used = true;
    await record.save();

    res.json({ success: true, message: "Password updated successfully. You can now log in." });
  } catch (error: any) {
    console.error("[Auth Error - Reset Password]:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to reset password." });
  }
}
