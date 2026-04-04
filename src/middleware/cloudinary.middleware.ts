import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/claudinary.config";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "uploads",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"],
  }),
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
