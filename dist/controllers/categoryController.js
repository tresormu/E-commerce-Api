"use strict";
/**
 * @swagger
 * tags:
 *   name: Category
 *   description: Product categories management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.createCategory = exports.getCategories = void 0;
const Categories_1 = __importDefault(require("../models/Categories"));
/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: List of categories
 */
const getCategories = async (_, res) => {
    const categories = await Categories_1.default.find();
    res.json(categories);
};
exports.getCategories = getCategories;
/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *     responses:
 *       201:
 *         description: Category created successfully
 */
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }
        let imageUrl = "";
        if (req.file) {
            imageUrl = req.file.path;
        }
        const category = await Categories_1.default.create({
            name,
            description,
            image: imageUrl
        });
        res.status(201).json(category);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.createCategory = createCategory;
/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
const deleteCategory = async (req, res) => {
    await Categories_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
};
exports.deleteCategory = deleteCategory;
