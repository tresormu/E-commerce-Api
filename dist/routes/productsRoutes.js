"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authorize_1 = require("../middleware/authorize");
const cloudinary_middleware_1 = require("../middleware/cloudinary.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get("/", productController_1.getProducts);
router.get("/:id", productController_1.getProduct);
// Protected routes
router.post("/", authMiddleware_1.protect, cloudinary_middleware_1.upload.array("images", 4), (0, authorize_1.authorizeRoles)("vendor", "admin"), productController_1.createProduct);
router.put("/:id", authMiddleware_1.protect, (0, authorize_1.authorizeRoles)("vendor", "admin"), productController_1.updateProduct);
router.delete("/:id", authMiddleware_1.protect, (0, authorize_1.authorizeRoles)("vendor", "admin"), productController_1.deleteProduct);
router.delete("/", authMiddleware_1.protect, (0, authorize_1.authorizeRoles)("admin"), productController_1.deleteProducts);
exports.default = router;
