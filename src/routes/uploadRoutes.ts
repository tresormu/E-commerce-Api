import { Router } from "express";
import { upload } from "../middleware/cloudinary.middleware";
import {
  uploadSingleFile,
  uploadMultipleFiles,
} from "../controllers/upload.controller";
import { protect } from "../middleware/authMiddleware";
const router = Router();
router.post("/single", protect, upload.single("image"), uploadSingleFile);
router.post(
  "/multiple",
  protect,
  upload.array("images", 4),
  uploadMultipleFiles,
);
export default router;
