import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/authorize";
import {
  getDashboardStats,
  getAdminOrders,
  getTopProducts,
  getCustomers,
  getCampaigns,
  addCampaign,
  getAnalytics,
  createAdminProduct
} from "../controllers/adminController";
import { upload } from "../middleware/cloudinary.middleware";

const router = Router();
// Protected routes (with auth)
router.use(protect);
router.use(authorizeRoles("admin"));
router.get("/stats", getDashboardStats);
router.get("/analytics", getAnalytics);
router.get("/orders", getAdminOrders);
router.get("/products/top", getTopProducts);
router.get("/customers", getCustomers);

router.get("/campaigns", getCampaigns);
router.post("/campaigns", addCampaign);

// Products (no auth for testing)
router.post("/products", upload.array("images", 4), createAdminProduct);
export default router;
