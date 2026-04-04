"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleFiles = exports.uploadSingleFile = void 0;
const uploadSingleFile = (req, res) => {
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "File upload failed",
            error: error.message,
        });
    }
};
exports.uploadSingleFile = uploadSingleFile;
const uploadMultipleFiles = (req, res) => {
    const files = req.files;
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
exports.uploadMultipleFiles = uploadMultipleFiles;
