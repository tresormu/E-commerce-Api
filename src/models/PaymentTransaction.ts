import mongoose, { Schema, Document, Types } from "mongoose";

export type PaymentStatus = "pending" | "completed" | "failed";

export interface IPaymentTransaction extends Document {
  user: Types.ObjectId;
  order: Types.ObjectId;
  txRef: string;
  flwId?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  provider: "flutterwave";
  paymentUrl?: string;
  metadata?: Record<string, any>;
  raw?: Record<string, any>;
  paidAt?: Date;
}

const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: Schema.Types.ObjectId, ref: "orders", required: true },
    txRef: { type: String, required: true, unique: true },
    flwId: { type: String },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "RWF" },
    provider: { type: String, enum: ["flutterwave"], default: "flutterwave" },
    paymentUrl: { type: String },
    metadata: { type: Schema.Types.Mixed },
    raw: { type: Schema.Types.Mixed },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

PaymentTransactionSchema.index({ flwId: 1 }, { sparse: true });
PaymentTransactionSchema.index({ order: 1, createdAt: -1 });
PaymentTransactionSchema.index({ user: 1, status: 1, createdAt: -1 });

export const PaymentTransaction = mongoose.model<IPaymentTransaction>(
  "PaymentTransaction",
  PaymentTransactionSchema,
);
