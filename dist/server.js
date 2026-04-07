"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const productsRoutes_1 = __importDefault(require("./routes/productsRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_config_1 = __importDefault(require("./config/swagger.config"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const ordersRoutes_1 = __importDefault(require("./routes/ordersRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const vendorRoutes_1 = __importDefault(require("./routes/vendorRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = __importDefault(require("./config/config"));
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: ["https://full-ecommerce-sigma.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_config_1.default, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Product API Docs",
}));
mongoose_1.default
    .connect(config_1.default.mongoUrl)
    .then(() => console.log(" Connected to MongoDB Compass"))
    .catch((err) => console.error(" Connection error:", err));
app.use("/api/products", productsRoutes_1.default);
app.use("/api/categories", categoryRoutes_1.default);
app.use("/api/cart", cartRoutes_1.default);
app.use("/api/auth", authRoutes_1.default);
app.use("/api/orders", ordersRoutes_1.default);
app.use("/api/payment", paymentRoutes_1.default);
app.use("/api/upload", uploadRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
app.use("/api/vendor", vendorRoutes_1.default);
app.listen(config_1.default.port, () => {
    console.log(`Server is running on http://localhost:${config_1.default.port}`);
});
