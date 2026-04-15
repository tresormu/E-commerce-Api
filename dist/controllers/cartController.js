"use strict";
/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearSpecificCart = exports.getCartByName = exports.clearCart = exports.removeFromCart = exports.addToCart = exports.getCart = void 0;
const Cart_1 = __importDefault(require("../models/Cart"));
const Product_1 = __importDefault(require("../models/Product"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
const getCart = async (req, res) => {
    try {
        const items = await Cart_1.default.find();
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ error: "failed to fetch" });
    }
};
exports.getCart = getCart;
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
const addToCart = async (req, res) => {
    try {
        const { CartName, ProductName, quantity } = req.body;
        if (!CartName || !ProductName) {
            return res.status(400).json({ error: "CartName and ProductName are required" });
        }
        const productExists = await Product_1.default.findOne({ name: ProductName });
        if (!productExists) {
            return res.status(404).json({ error: "Product not found" });
        }
        const cart = await Cart_1.default.findOne({ CartName });
        if (!cart) {
            const newCart = await Cart_1.default.create({
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
        }
        else {
            cart.productDet.push({ ProductName, quantity: quantity || 1 });
        }
        await cart.save();
        res.status(200).json(cart);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.addToCart = addToCart;
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
const removeFromCart = async (req, res) => {
    try {
        const { ProductName, CartName } = req.body;
        if (!ProductName || !CartName) {
            return res
                .status(400)
                .json({ error: "Both CartName and ProductName are required" });
        }
        const updatedCart = await Cart_1.default.findOneAndUpdate({ CartName }, { $pull: { productDet: { ProductName } } }, { new: true });
        if (!updatedCart) {
            return res
                .status(404)
                .json({ error: "Cart not found or product not in cart" });
        }
        if (updatedCart.productDet.length === 0) {
            await Cart_1.default.deleteOne({ _id: updatedCart._id });
            return res.status(200).json({ message: "Cart cleared successfully" });
        }
        return res.status(200).json({
            message: "Product removed from cart successfully",
            cart: updatedCart,
        });
    }
    catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ error: "Failed to remove product from cart" });
    }
};
exports.removeFromCart = removeFromCart;
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
const clearCart = async (req, res) => {
    try {
        await Cart_1.default.deleteMany({});
        res.status(200).json({ message: "cart deleted" });
    }
    catch (error) {
        res.status(500).json({ error: "failed to delete" });
    }
};
exports.clearCart = clearCart;
// Get cart by name
const getCartByName = async (req, res) => {
    try {
        const { cartName } = req.params;
        const cart = await Cart_1.default.findOne({ CartName: cartName });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        res.json(cart);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch cart" });
    }
};
exports.getCartByName = getCartByName;
// Clear specific cart
const clearSpecificCart = async (req, res) => {
    try {
        const { cartName } = req.body;
        if (!cartName) {
            return res.status(400).json({ error: "cartName is required" });
        }
        await Cart_1.default.deleteOne({ CartName: cartName });
        res.status(200).json({ message: "Cart cleared successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to clear cart" });
    }
};
exports.clearSpecificCart = clearSpecificCart;
