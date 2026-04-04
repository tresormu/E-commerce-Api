import { Router } from "express";
import { authorizeRoles } from "../middleware/authorize";
import {
  register,
  login,
  getProfile,
  updateUser,
  deleteAccount,
  resetPassword,
  forgotPassword,
  AllUsers,
  deleteusers,
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/cloudinary.middleware";
const router = Router();
router.post("/register",upload.single("image"), register);
router.post("/login", login);
router.get("/",protect,authorizeRoles("admin"),AllUsers)
router.get("/profile", protect, getProfile);
router.put("/profile", protect, upload.single("profile"), updateUser);
router.delete("/account", protect, deleteAccount);
router.delete("/",
  protect,
  authorizeRoles("admin"),
  deleteusers)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
export default router;
