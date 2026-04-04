"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const claudinary_config_1 = __importDefault(require("../config/claudinary.config"));
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: claudinary_config_1.default,
    params: async () => ({
        folder: "uploads",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"],
    }),
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});
