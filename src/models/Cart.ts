import mongoose, { Schema, Document } from "mongoose";

export interface ICart extends Document {
  CartName: string;
  productDet: { ProductName: string; quantity: number }[];
  addedAt: Date;
}

const CartSchema = new Schema<ICart>({
  CartName: { type: String, required: true },
  productDet: [
    {
      ProductName: { type: String, required: true },
      quantity: { type: Number, default: 1 },
    },
  ],
  addedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICart>("Cart", CartSchema);
