import { Router } from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  deleteProducts,
} from "../controllers/productController";
import { protect } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/authorize";
import { upload } from "../middleware/cloudinary.middleware";

const router = Router();

// Public routes
router.get("/", getProducts);
router.get("/:id", getProduct);

// Protected routes
router.post("/", protect, upload.array("images", 4), authorizeRoles("vendor", "admin"), createProduct);
router.put("/:id", protect, authorizeRoles("vendor", "admin"), updateProduct);
router.delete("/:id", protect, authorizeRoles("vendor", "admin"), deleteProduct);
router.delete("/", protect, authorizeRoles("admin"), deleteProducts);

export default router;
