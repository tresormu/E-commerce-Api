/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API for managing customer orders
 */
import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import Order from "../models/orders";
import Cart from "../models/Cart";
import Product from "../models/Product";
import User from "../models/User";
import { sendOrderConfirmationEmail, sendOrderCancellationEmail } from "../services/emailServices";
import dotenv from "dotenv";
dotenv.config();

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
export const NewOrder = async (req: Request, res: Response) => {
  try {
    const { cartName, customerInfo } = req.body;
    const orderId = uuid();

    if (!cartName) {
      return res.status(400).json({ message: "cartName is required" });
    }

    const cart = await Cart.findOne({ CartName: cartName });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Batch-fetch all products in one query — avoids N+1
    const productNames = cart.productDet.map((item: any) => item.ProductName);
    const products = await Product.find({ name: { $in: productNames } });
    const productMap = new Map(products.map((p) => [p.name, p]));

    let totalAmount = 0;
    const items: Array<{ productId: string; name: string; price: number; quantity: number }> = [];

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

    const user = await User.findOne({ username: cart.CartName.replace("_cart", "") });

    const order = await Order.create({
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
        await sendOrderConfirmationEmail(
          email,
          customerInfo?.name || user?.username || "Customer",
          orderId,
          totalAmount,
        );
      }
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
    }

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

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
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOneAndUpdate({ orderId }, req.body, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Order updated successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order", error });
  }
};

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
export const DeleteOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const deleted = await Order.findOneAndDelete({ orderId });
    if (!deleted) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete order", error });
  }
};

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "User not authenticated" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const orders = await Order.find({ cartName: `${user.username}_cart` }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = (req as any).user?.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const order = await Order.findOneAndUpdate(
      { _id: orderId, cartName: `${user.username}_cart` },
      { status: "cancelled" },
      { new: true },
    );
    if (!order) return res.status(404).json({ message: "Order not found or access denied" });

    try {
      await sendOrderCancellationEmail(user.email, user.username, order.orderId || order._id.toString(), "customer");
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
    }

    res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel order", error });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (status === "cancelled") {
      try {
        const user = await User.findOne({ username: order.cartName.replace("_cart", "") });
        if (user) {
          await sendOrderCancellationEmail(user.email, user.username, order.orderId || order._id.toString(), "admin");
        }
      } catch (emailError) {
        console.error("Failed to send admin cancellation email:", emailError);
      }
    }

    res.status(200).json({ message: "Order status updated successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status", error });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().sort({ timeOrderPlaced: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error });
  }
};
