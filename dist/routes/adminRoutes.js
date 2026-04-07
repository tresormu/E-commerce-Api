"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authorize_1 = require("../middleware/authorize");
const adminController_1 = require("../controllers/adminController");
const cloudinary_middleware_1 = require("../middleware/cloudinary.middleware");
const router = (0, express_1.Router)();
// Protected routes (with auth)
router.use(authMiddleware_1.protect);
router.use((0, authorize_1.authorizeRoles)("admin"));
router.get("/stats", adminController_1.getDashboardStats);
router.get("/analytics", adminController_1.getAnalytics);
router.get("/orders", adminController_1.getAdminOrders);
router.get("/products/top", adminController_1.getTopProducts);
router.get("/customers", adminController_1.getCustomers);
router.get("/campaigns", adminController_1.getCampaigns);
router.post("/campaigns", adminController_1.addCampaign);
// Products (no auth for testing)
router.post("/products", cloudinary_middleware_1.upload.array("images", 4), adminController_1.createAdminProduct);
exports.default = router;
