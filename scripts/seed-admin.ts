/**
 * One-time admin bootstrap script.
 * Run once on a fresh deployment: npm run seed:admin
 * After the first admin exists, use POST /api/auth/admin/create (requires admin token) for all future admins.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASS = process.env.ADMIN_PASS;

if (!MONGO_URL || !ADMIN_PASS) {
  console.error("MONGO_URL and ADMIN_PASS must be set in .env");
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGO_URL!);

  const existing = await User.findOne({ $or: [{ email: ADMIN_EMAIL }, { username: ADMIN_USERNAME }] });
  if (existing) {
    console.log(`Admin already exists: ${existing.email} (role: ${existing.UserType})`);
    await mongoose.disconnect();
    return;
  }

  // Password is assigned plain — the pre-save hook hashes it
  const admin = await User.create({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    UserType: "admin",
  });

  console.log(`✅ Admin created: ${admin.email}`);
  console.log(`   Username : ${admin.username}`);
  console.log(`   Password : value from ADMIN_PASS in .env`);
  console.log(`   Login at : POST /api/auth/login`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
