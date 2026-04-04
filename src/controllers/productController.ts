/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Product management
 */

import { Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Product";
import Category from "../models/Categories";
import { AuthRequest } from "../models/type";

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
export const getProducts = async (_: any, res: Response) => {
  const products = await Product.find().populate("category");
  res.json(products);
};

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
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, price, category, oldPrice, description, stock } = req.body;

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    
    const Images: any[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as any[]) {
        Images.push(file.path);
      }
    }
    
    const exists = await Category.findById(category);
    if (!exists) return res.status(404).json({ error: "Category not found" });
    
    const product = await Product.create({
      name,
      price,
      oldPrice,
      description,
      inStock: stock ? stock > 0 : true,
      Images: Images,
      category,
      createdBy: req.user?.id || new mongoose.Types.ObjectId(),
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create product', details: errorMessage });
  }
};

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
export const updateProduct = async (req: AuthRequest, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  if (
    req.user!.role !== "admin" &&
    product.createdBy.toString() !== req.user!.id
  ) {
    return res.status(403).json({ error: "Not allowed" });
  }

  Object.assign(product, req.body);
  await product.save();

  res.json(product);
};

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
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  if (
    req.user!.role !== "admin" &&
    product.createdBy.toString() !== req.user!.id
  ) {
    return res.status(403).json({ error: "Not allowed" });
  }

  await product.deleteOne();
  res.json({ message: "Product deleted" });
};
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
export const getProduct = async (req: AuthRequest, res: Response) => {
  const product = await Product.findById(req.params.id).populate("category");
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
};
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
export const deleteProducts = async (req: AuthRequest, res: Response) => {
  try {
    await Product.deleteMany({});
    res.json({ message: "All products deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete products" });
  }
};
