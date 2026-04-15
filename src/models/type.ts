import { Request } from "express";
import { Multer } from "multer";

export interface AuthUser {
  username: string;
  id: string;
  role: "admin" | "vendor" | "customer";
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}
