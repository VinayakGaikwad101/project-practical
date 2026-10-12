import { Router } from "express";
import { register, login, forgotPassword, resetPasswordWithOTP } from "../controllers/authController.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPasswordWithOTP);
