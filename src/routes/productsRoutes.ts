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

// Public routes (no auth for testing)
router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", upload.array("images", 4), createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.delete("/", deleteProducts);

// Protected routes (commented out for testing)
// router.post("/", protect, upload.array("images", 4), authorizeRoles("vendor", "admin"), createProduct);
// router.put("/:id", protect, authorizeRoles("vendor", "admin"), updateProduct);
// router.delete("/:id", protect, authorizeRoles("vendor", "admin"), deleteProduct);
// router.delete("/", protect, authorizeRoles("admin"), deleteProducts);

export default router;
