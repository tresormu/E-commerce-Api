/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management
 */

import { Request, Response } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart";
import Product from "../models/Product";
import dotenv from "dotenv";
import { AuthRequest } from "../models/type";
dotenv.config();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get all cart items
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: List of cart items
 *       500:
 *         description: Failed to fetch cart
 */
export const getCart = async (req: Request, res: Response) => {
  try {
    const items = await Cart.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "failed to fetch" });
  }
};

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add product to cart
 *     tags:
 *       - Cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - CartName
 *               - ProductName
 *             properties:
 *               CartName:
 *                 type: string
 *               ProductName:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Product added to cart
 */

export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const { CartName, ProductName, quantity } = req.body;

    if (!CartName || !ProductName) {
      return res.status(400).json({ error: "CartName and ProductName are required" });
    }

    const productExists = await Product.findOne({ name: ProductName });
    if (!productExists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const cart = await Cart.findOne({ CartName });
    if (!cart) {
      const newCart = await Cart.create({
        CartName,
        productDet: [
          {
            ProductName,
            quantity: quantity || 1,
          },
        ],
        addedAt: new Date(),
      });
      return res.status(201).json(newCart);
    }

    const existing = cart.productDet.find((item) => item.ProductName === ProductName);
    if (existing) {
      existing.quantity += quantity || 1;
    } else {
      cart.productDet.push({ ProductName, quantity: quantity || 1 });
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Remove item from cart
 *     tags:
 *       - Cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - CartName
 *               - ProductName
 *             properties:
 *               CartName:
 *                 type: string
 *               ProductName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item removed
 */

export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const { ProductName, CartName } = req.body;
    if (!ProductName || !CartName) {
      return res
        .status(400)
        .json({ error: "Both CartName and ProductName are required" });
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { CartName },
      { $pull: { productDet: { ProductName } } },
      { new: true },
    );

    if (!updatedCart) {
      return res
        .status(404)
        .json({ error: "Cart not found or product not in cart" });
    }

    if (updatedCart.productDet.length === 0) {
      await Cart.deleteOne({ _id: updatedCart._id });
      return res.status(200).json({ message: "Cart cleared successfully" });
    }

    return res.status(200).json({
      message: "Product removed from cart successfully",
      cart: updatedCart,
    });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Failed to remove product from cart" });
  }
};

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear all items from the cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: All cart items deleted
 *       500:
 *         description: Failed to clear cart
 */
export const clearCart = async (req: Request, res: Response) => {
  try {
    await Cart.deleteMany({});
    res.status(200).json({ message: "cart deleted" });
  } catch (error) {
    res.status(500).json({ error: "failed to delete" });
  }
};

// Get cart by name
export const getCartByName = async (req: Request, res: Response) => {
  try {
    const { cartName } = req.params;
    const cart = await Cart.findOne({ CartName: cartName });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

// Clear specific cart
export const clearSpecificCart = async (req: Request, res: Response) => {
  try {
    const { cartName } = req.body;
    
    if (!cartName) {
      return res.status(400).json({ error: "cartName is required" });
    }
    
    await Cart.deleteOne({ CartName: cartName });
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
};
