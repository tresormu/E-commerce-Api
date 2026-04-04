import { Router } from "express";
import {
  getVendorStats,
  getVendorProducts,
  addVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
} from "../controllers/vendorController";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/cloudinary.middleware";

const router = Router();

// All vendor routes require authentication
router.use(protect);

router.get("/stats", getVendorStats);
router.get("/products", getVendorProducts);
router.post("/products", upload.array('images', 4), addVendorProduct);
router.put("/products/:productId", updateVendorProduct);
router.delete("/products/:productId", deleteVendorProduct);

export default router;
