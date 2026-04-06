"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/payment/checkout-session:
 *   post:
 *     summary: Create Flutterwave checkout session for an order
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *               callbackUrl:
 *                 type: string
 *               customerName:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Checkout session created
 */
router.post("/checkout-session", authMiddleware_1.protect, paymentController_1.createCheckoutSession);
/**
 * @swagger
 * /api/payment/transactions:
 *   get:
 *     summary: List payment transactions
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed]
 *     responses:
 *       200:
 *         description: Transactions retrieved
 */
router.get("/transactions", authMiddleware_1.protect, paymentController_1.listTransactions);
/**
 * @swagger
 * /api/payment/verify/{txRef}:
 *   get:
 *     summary: Verify a Flutterwave payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: txRef
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: flwId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verification result
 */
router.get("/verify/:txRef", authMiddleware_1.protect, paymentController_1.verifyPayment);
/**
 * @swagger
 * /api/payment/flutterwave/webhook:
 *   post:
 *     summary: Flutterwave webhook
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post("/flutterwave/webhook", paymentController_1.flutterwaveWebhook);
exports.default = router;
