import { Response } from "express";
import { AuthRequest } from "../models/type";
export const uploadSingleFile = (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }
    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: req.file.path,
    };

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      file: fileInfo,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "File upload failed",
      error: error.message,
    });
  }
};
export const uploadMultipleFiles = (req: AuthRequest, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }
  res.status(200).json({
    message: "Files uploaded successfully",
    files: files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: file.path,
    })),
  });
};
