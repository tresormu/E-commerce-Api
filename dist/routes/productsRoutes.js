"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const cloudinary_middleware_1 = require("../middleware/cloudinary.middleware");
const router = (0, express_1.Router)();
// Public routes (no auth for testing)
router.get("/", productController_1.getProducts);
router.get("/:id", productController_1.getProduct);
router.post("/", cloudinary_middleware_1.upload.array("images", 4), productController_1.createProduct);
router.put("/:id", productController_1.updateProduct);
router.delete("/:id", productController_1.deleteProduct);
router.delete("/", productController_1.deleteProducts);
// Protected routes (commented out for testing)
// router.post("/", protect, upload.array("images", 4), authorizeRoles("vendor", "admin"), createProduct);
// router.put("/:id", protect, authorizeRoles("vendor", "admin"), updateProduct);
// router.delete("/:id", protect, authorizeRoles("vendor", "admin"), deleteProduct);
// router.delete("/", protect, authorizeRoles("admin"), deleteProducts);
exports.default = router;
