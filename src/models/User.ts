import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "vendor" | "customer" | "admin" | "manager" | "support";

export interface IUser extends Document {
  username: string;
  profile?: string;
  email: string;
  phone?: string;
  password: string;
  UserType: UserRole;
  resetPasswordToken?: String;
  resetPasswordExpires?: Date;
  notificationPrefs?: { orders: boolean; promotions: boolean; updates: boolean };
  theme?: 'light' | 'dark' | 'system';
  createdAt: Date;
}
const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    profile: { type: String, default: "" },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true },
    UserType: {
      type: String,
      enum: ["vendor", "customer", "admin", "manager", "support"],
      default: "customer",
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    notificationPrefs: {
      type: { orders: Boolean, promotions: Boolean, updates: Boolean },
      default: { orders: true, promotions: true, updates: true },
    },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model<IUser>("User", UserSchema);
