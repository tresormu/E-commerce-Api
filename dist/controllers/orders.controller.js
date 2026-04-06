"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = exports.updateOrderStatus = exports.cancelOrder = exports.getUserOrders = exports.DeleteOrder = exports.updateOrder = exports.NewOrder = void 0;
const uuid_1 = require("uuid");
const orders_1 = __importDefault(require("../models/orders"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Product_1 = __importDefault(require("../models/Product"));
const User_1 = __importDefault(require("../models/User"));
const emailServices_1 = require("../services/emailServices");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order from a cart
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartName
 *             properties:
 *               cartName:
 *                 type: string
 *                 example: "myCart1"
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       400:
 *         description: cartName missing
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Internal server error
 */
const NewOrder = async (req, res) => {
    try {
        const { cartName, customerInfo } = req.body;
        const orderId = (0, uuid_1.v4)();
        if (!cartName) {
            return res.status(400).json({ message: "cartName is required" });
        }
        const cart = await Cart_1.default.findOne({ CartName: cartName });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        // Batch-fetch all products in one query — avoids N+1
        const productNames = cart.productDet.map((item) => item.ProductName);
        const products = await Product_1.default.find({ name: { $in: productNames } });
        const productMap = new Map(products.map((p) => [p.name, p]));
        let totalAmount = 0;
        const items = [];
        for (const item of cart.productDet) {
            const product = productMap.get(item.ProductName);
            if (!product) {
                return res.status(400).json({ message: `Product ${item.ProductName} not found` });
            }
            totalAmount += item.quantity * product.price;
            items.push({
                productId: product._id.toString(),
                name: product.name,
                price: product.price,
                quantity: item.quantity,
            });
        }
        const user = await User_1.default.findOne({ username: cart.CartName.replace("_cart", "") });
        const order = await orders_1.default.create({
            orderId,
            cartName: cart.CartName,
            totalAmount,
            items,
            customerInfo: customerInfo || {
                name: user?.username || "Customer",
                email: user?.email || "",
                phone: "",
                address: "",
            },
            userId: user?._id?.toString() || cart.CartName,
        });
        try {
            const email = customerInfo?.email || user?.email;
            if (email) {
                await (0, emailServices_1.sendOrderConfirmationEmail)(email, customerInfo?.name || user?.username || "Customer", orderId, totalAmount);
            }
        }
        catch (emailError) {
            console.error("Failed to send order confirmation email:", emailError);
        }
        res.status(201).json({ message: "Order placed successfully", order });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create order", error: error.message });
    }
};
exports.NewOrder = NewOrder;
/**
 * @swagger
 * /api/orders/{orderId}:
 *   put:
 *     summary: Update an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
const updateOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await orders_1.default.findOneAndUpdate({ orderId }, req.body, { new: true });
        if (!order)
            return res.status(404).json({ message: "Order not found" });
        res.status(200).json({ message: "Order updated successfully", order });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to update order", error });
    }
};
exports.updateOrder = updateOrder;
/**
 * @swagger
 * /api/orders/{orderId}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
const DeleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const deleted = await orders_1.default.findOneAndDelete({ orderId });
        if (!deleted)
            return res.status(404).json({ message: "Order not found" });
        res.status(200).json({ message: "Order deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to delete order", error });
    }
};
exports.DeleteOrder = DeleteOrder;
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "User not authenticated" });
        const user = await User_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const orders = await orders_1.default.find({ cartName: `${user.username}_cart` }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch orders", error });
    }
};
exports.getUserOrders = getUserOrders;
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.id;
        const user = await User_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const order = await orders_1.default.findOneAndUpdate({ _id: orderId, cartName: `${user.username}_cart` }, { status: "cancelled" }, { new: true });
        if (!order)
            return res.status(404).json({ message: "Order not found or access denied" });
        try {
            await (0, emailServices_1.sendOrderCancellationEmail)(user.email, user.username, order.orderId || order._id.toString(), "customer");
        }
        catch (emailError) {
            console.error("Failed to send cancellation email:", emailError);
        }
        res.status(200).json({ message: "Order cancelled successfully", order });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to cancel order", error });
    }
};
exports.cancelOrder = cancelOrder;
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
        const order = await orders_1.default.findByIdAndUpdate(orderId, { status }, { new: true });
        if (!order)
            return res.status(404).json({ message: "Order not found" });
        if (status === "cancelled") {
            try {
                const user = await User_1.default.findOne({ username: order.cartName.replace("_cart", "") });
                if (user) {
                    await (0, emailServices_1.sendOrderCancellationEmail)(user.email, user.username, order.orderId || order._id.toString(), "admin");
                }
            }
            catch (emailError) {
                console.error("Failed to send admin cancellation email:", emailError);
            }
        }
        res.status(200).json({ message: "Order status updated successfully", order });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to update order status", error });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const getAllOrders = async (req, res) => {
    try {
        const orders = await orders_1.default.find().sort({ timeOrderPlaced: -1 });
        res.status(200).json(orders);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch orders", error });
    }
};
exports.getAllOrders = getAllOrders;
