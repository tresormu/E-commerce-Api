"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVendorProduct = exports.updateVendorProduct = exports.addVendorProduct = exports.getVendorProducts = exports.getVendorStats = void 0;
const Product_1 = __importDefault(require("../models/Product"));
// Get vendor dashboard stats
const getVendorStats = async (req, res) => {
    try {
        const vendorId = req.user?.id;
        // Get vendor products
        const products = await Product_1.default.find({ vendorId });
        const totalProducts = products.length;
        // Calculate total sales and revenue (mock for now)
        const totalSales = products.reduce((sum, product) => sum + (product.sales || 0), 0);
        const totalRevenue = products.reduce((sum, product) => sum + ((product.sales || 0) * product.price), 0);
        // Get low stock products
        const lowStockProducts = products.filter(product => product.stock < 10).length;
        res.json({
            totalProducts,
            totalSales,
            totalRevenue,
            lowStockProducts,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch vendor stats", error });
    }
};
exports.getVendorStats = getVendorStats;
// Get vendor products
const getVendorProducts = async (req, res) => {
    try {
        const vendorId = req.user?.id;
        const products = await Product_1.default.find({ vendorId });
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch vendor products", error });
    }
};
exports.getVendorProducts = getVendorProducts;
// Add new product
const addVendorProduct = async (req, res) => {
    try {
        console.log('Add product request:', req.body);
        console.log('Files:', req.files);
        const vendorId = req.user?.id;
        const { name, description, price, stock, category } = req.body;
        if (!name || !description || !price || !stock || !category) {
            return res.status(400).json({ message: "All fields are required" });
        }
        // Handle image uploads
        const Images = [];
        if (req.files && Array.isArray(req.files)) {
            req.files.forEach((file) => {
                Images.push(file.path);
            });
        }
        if (Images.length !== 4) {
            return res.status(400).json({ message: `Exactly 4 images are required, got ${Images.length}` });
        }
        // Find category by name to get ObjectId
        const Category = (await Promise.resolve().then(() => __importStar(require('../models/Categories')))).default;
        const categoryDoc = await Category.findOne({ name: category });
        if (!categoryDoc) {
            return res.status(400).json({ message: `Category '${category}' not found` });
        }
        const productData = {
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock),
            category: categoryDoc._id,
            Images,
            vendorId,
            createdBy: vendorId,
            sales: 0,
            inStock: true
        };
        console.log('Creating product with data:', productData);
        const product = await Product_1.default.create(productData);
        res.status(201).json({ message: "Product added successfully", product });
    }
    catch (error) {
        console.error('Add product error:', error);
        res.status(500).json({ message: "Failed to add product", error: error.message });
    }
};
exports.addVendorProduct = addVendorProduct;
// Update vendor product
const updateVendorProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const vendorId = req.user?.id;
        const { name, description, price, stock, category } = req.body;
        // Find category by name to get ObjectId if category is provided
        let categoryId;
        if (category) {
            const Category = (await Promise.resolve().then(() => __importStar(require('../models/Categories')))).default;
            const categoryDoc = await Category.findOne({ name: category });
            if (!categoryDoc) {
                return res.status(400).json({ message: `Category '${category}' not found` });
            }
            categoryId = categoryDoc._id;
        }
        const updateData = {
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock),
        };
        if (categoryId) {
            updateData.category = categoryId;
        }
        const product = await Product_1.default.findOneAndUpdate({ _id: productId, vendorId }, updateData, { new: true });
        if (!product) {
            return res.status(404).json({ message: "Product not found or unauthorized" });
        }
        res.json({ message: "Product updated successfully", product });
    }
    catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: "Failed to update product", error: error.message });
    }
};
exports.updateVendorProduct = updateVendorProduct;
// Delete vendor product
const deleteVendorProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const vendorId = req.user?.id;
        console.log('Delete request:', { productId, vendorId });
        const product = await Product_1.default.findOneAndDelete({ _id: productId, vendorId });
        if (!product) {
            return res.status(404).json({ message: "Product not found or unauthorized" });
        }
        res.json({ message: "Product deleted successfully" });
    }
    catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: "Failed to delete product", error: error.message });
    }
};
exports.deleteVendorProduct = deleteVendorProduct;
