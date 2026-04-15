import { Request } from "express";

export interface AuthUser {
  username: string;
  id: string;
  role: "admin" | "vendor" | "customer";
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
