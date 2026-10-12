import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../services/authService.js";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Access denied. Bearer token missing." });
    return;
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ success: false, error: "Invalid or expired session token." });
    return;
  }

  req.user = decoded;
  next();
}
