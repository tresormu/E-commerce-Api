import mongoose, { Schema, Document } from "mongoose";
export interface Order extends Document {
  orderId: string;
  userId: string;
  cartName: string;
  totalAmount: number;
  status: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  paymentMethod: string;
  paymentStatus?: 'unpaid' | 'pending' | 'completed' | 'failed';
  paymentProvider?: 'flutterwave';
  paymentTxRef?: string;
  paidAt?: Date;
  timeOrderPlaced: Date;
}
const OrderSchema = new Schema<Order>({
  orderId: { type: String },
  userId: { type: String, required: true },
  cartName: { type: String, required: true },
  totalAmount: { type: Number },
  status: { type: String, default: 'pending', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number
  }],
  customerInfo: {
    name: String,
    email: String,
    phone: String,
    address: String
  },
  paymentMethod: { type: String, default: 'card' },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'completed', 'failed'],
    default: 'unpaid',
  },
  paymentProvider: { type: String, default: 'flutterwave' },
  paymentTxRef: { type: String },
  paidAt: { type: Date },
  timeOrderPlaced: { type: Date, required: false, default: Date.now },
});

OrderSchema.index({ orderId: 1 });
export default mongoose.model<Order>("orders", OrderSchema);
