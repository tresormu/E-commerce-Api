import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  price: number;
  priceUSD: number;
  priceEUR: number;
  priceRWF: number;
  oldPrice?: number;
  description?: string;
  size?: "X" | "S" | "M" | "L" | "XL" | "XXL";
  Images: string[];
  category: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  stock: number;
  sales?: number;
  inStock: boolean;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  priceUSD: { type: Number, required: true },
  priceEUR: { type: Number, required: true },
  priceRWF: { type: Number, required: true },
  size: { type: String, enum: ["X", "S", "M", "L", "XL", "XXL"] },
  oldPrice: { type: Number },
  description: { type: String },
  Images: [{ type: String }],
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: "User" },
  stock: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
});

export default mongoose.model<IProduct>("Product", ProductSchema);
