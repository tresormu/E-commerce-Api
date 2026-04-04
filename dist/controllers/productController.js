"use strict";
/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Product management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProducts = exports.getProduct = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProducts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Product_1 = __importDefault(require("../models/Product"));
const Categories_1 = __importDefault(require("../models/Categories"));
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: List of products
 */
const getProducts = async (_, res) => {
    const products = await Product_1.default.find().populate("category");
    res.json(products);
};
exports.getProducts = getProducts;
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: iPhone 15
 *               price:
 *                 type: number
 *                 example: 1200
 *               category:
 *                 type: string
 *                 example: 64f1c2a9c1b2a123456789ab
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid category ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
const createProduct = async (req, res) => {
    try {
        const { name, price, category, oldPrice, description, stock } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(category)) {
            return res.status(400).json({ error: "Invalid category ID" });
        }
        const Images = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                Images.push(file.path);
            }
        }
        const exists = await Categories_1.default.findById(category);
        if (!exists)
            return res.status(404).json({ error: "Category not found" });
        const product = await Product_1.default.create({
            name,
            price,
            oldPrice,
            description,
            inStock: stock ? stock > 0 : true,
            Images: Images,
            category,
            createdBy: req.user?.id || new mongoose_1.default.Types.ObjectId(),
        });
        res.status(201).json(product);
    }
    catch (error) {
        console.error('Error creating product:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: 'Failed to create product', details: errorMessage });
    }
};
exports.createProduct = createProduct;
/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed
 *       404:
 *         description: Product not found
 */
const updateProduct = async (req, res) => {
    const product = await Product_1.default.findById(req.params.id);
    if (!product)
        return res.status(404).json({ error: "Product not found" });
    if (req.user.role !== "admin" &&
        product.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ error: "Not allowed" });
    }
    Object.assign(product, req.body);
    await product.save();
    res.json(product);
};
exports.updateProduct = updateProduct;
/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed
 *       404:
 *         description: Product not found
 */
const deleteProduct = async (req, res) => {
    const product = await Product_1.default.findById(req.params.id);
    if (!product)
        return res.status(404).json({ error: "Product not found" });
    if (req.user.role !== "admin" &&
        product.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ error: "Not allowed" });
    }
    await product.deleteOne();
    res.json({ message: "Product deleted" });
};
exports.deleteProduct = deleteProduct;
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         description: Product not found
 */
const getProduct = async (req, res) => {
    const product = await Product_1.default.findById(req.params.id).populate("category");
    if (!product)
        return res.status(404).json({ error: "Product not found" });
    res.json(product);
};
exports.getProduct = getProduct;
/**
 * @swagger
 * /api/products:
 *   delete:
 *     summary: Delete all products (Admin only)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All products deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to delete products
 */
const deleteProducts = async (req, res) => {
    try {
        await Product_1.default.deleteMany({});
        res.json({ message: "All products deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete products" });
    }
};
exports.deleteProducts = deleteProducts;
