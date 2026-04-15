// middleware/productOwnership.ts
import Product from "../models/Product";
import { AuthRequest } from "../models/type";
import { Response, NextFunction } from "express";

export const productOwnerOrAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  if (
    req.user!.role === "admin" ||
    product.createdBy.toString() === req.user!.id
  ) {
    return next();
  }

  return res.status(403).json({ error: "Not allowed" });
};
