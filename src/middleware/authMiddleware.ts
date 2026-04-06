import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../models/type";
import dotenv from "dotenv";
dotenv.config();

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    req.user = {
      username:decoded.username,
      id: decoded.id,
      role: decoded.role,
    }
    

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
