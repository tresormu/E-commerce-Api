"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vendorController_1 = require("../controllers/vendorController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const cloudinary_middleware_1 = require("../middleware/cloudinary.middleware");
const router = (0, express_1.Router)();
// All vendor routes require authentication
router.use(authMiddleware_1.protect);
router.get("/stats", vendorController_1.getVendorStats);
router.get("/products", vendorController_1.getVendorProducts);
router.post("/products", cloudinary_middleware_1.upload.array('images', 4), vendorController_1.addVendorProduct);
router.put("/products/:productId", vendorController_1.updateVendorProduct);
router.delete("/products/:productId", vendorController_1.deleteVendorProduct);
exports.default = router;
