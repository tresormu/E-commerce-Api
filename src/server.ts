import express from "express";
import mongoose from "mongoose";
import productRoutes from "./routes/productsRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.config";
import cartRoutes from "./routes/cartRoutes";
import authRoutes from "./routes/authRoutes";
import orderRoutes from "./routes/ordersRoutes";
import UploadRoutes from "./routes/uploadRoutes";
import adminRoutes from "./routes/adminRoutes";
import vendorRoutes from "./routes/vendorRoutes";
import cors from "cors";
import helmet from "helmet";

import dotenv from "dotenv";
dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const MONGO_URL: string = requireEnv("MONGO_URL");
requireEnv("JWT_SECRET");
requireEnv("CLOUDINARY_CLOUD_NAME");
requireEnv("CLOUDINARY_API_KEY");
requireEnv("CLOUDINARY_API_SECRET");
requireEnv("EMAIL_HOST");
requireEnv("EMAIL_PORT");
requireEnv("EMAIL_USER");
requireEnv("EMAIL_PASSWORD");
requireEnv("EMAIL_FROM");

const app = express();
const PORT = process.env.PORT || 9000;
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(helmet());
app.use(
  cors({
    origin: ["https://full-ecommerce-sigma.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Product API Docs",
  }),
);

mongoose
  .connect(MONGO_URL)
  .then(() => console.log(" Connected to MongoDB Compass"))
  .catch((err) => console.error(" Connection error:", err));
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", UploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendor", vendorRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
