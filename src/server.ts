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
import paymentRoutes from "./routes/paymentRoutes";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import config from "./config/config";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = ["https://full-ecommerce-sigma.vercel.app", "http://localhost:5173"];
      // Allow requests with no Origin (mobile apps, curl, Postman)
      if (!origin || allowed.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Product API Docs",
  }),
);

mongoose
  .connect(config.mongoUrl)
  .then(() => console.log(" Connected to MongoDB Compass"))
  .catch((err) => console.error(" Connection error:", err));

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/upload", UploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendor", vendorRoutes);

app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
});
