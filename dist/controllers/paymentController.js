"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flutterwaveWebhook = exports.verifyPayment = exports.listTransactions = exports.createCheckoutSession = void 0;
const orders_1 = __importDefault(require("../models/orders"));
const User_1 = __importDefault(require("../models/User"));
const PaymentTransaction_1 = require("../models/PaymentTransaction");
const emailServices_1 = require("../services/emailServices");
const flutterwave_1 = require("../utils/flutterwave");
const transactionRef_1 = require("../utils/transactionRef");
const resolveOrder = async (orderId) => {
    let order = await orders_1.default.findOne({ orderId });
    if (!order && /^[a-f0-9]{24}$/i.test(orderId)) {
        order = await orders_1.default.findById(orderId);
    }
    return order;
};
const updateOrderAfterPayment = async (orderId, txRef, status, paidAt) => {
    if (status === "completed") {
        await orders_1.default.updateOne({ _id: orderId, paymentTxRef: txRef, paymentStatus: { $ne: "completed" } }, { $set: { paymentStatus: "completed", paidAt } });
        await orders_1.default.updateOne({ _id: orderId, paymentTxRef: txRef, status: "pending" }, { $set: { status: "processing" } });
        return;
    }
    await orders_1.default.updateOne({ _id: orderId, paymentTxRef: txRef, paymentStatus: { $ne: "completed" } }, { $set: { paymentStatus: "failed" }, $unset: { paidAt: "" } });
};
const finalizeTransaction = async (txRef, flwId, verifiedData, isSuccess) => {
    const status = isSuccess ? "completed" : "failed";
    const update = {
        status,
        flwId: String(flwId),
        raw: verifiedData,
    };
    if (isSuccess) {
        update.paidAt = new Date();
    }
    const updated = await PaymentTransaction_1.PaymentTransaction.findOneAndUpdate({ txRef, status: "pending" }, { $set: update }, { new: true });
    const transaction = updated || (await PaymentTransaction_1.PaymentTransaction.findOne({ txRef }));
    if (transaction) {
        if (updated) {
            await updateOrderAfterPayment(transaction.order.toString(), txRef, status, update.paidAt);
            const [order, user] = await Promise.all([
                orders_1.default.findById(transaction.order),
                User_1.default.findById(transaction.user),
            ]);
            if (order) {
                const email = order.customerInfo?.email || user?.email;
                const name = order.customerInfo?.name || user?.username || "Customer";
                const totalAmount = Number(order.totalAmount || transaction.amount || 0);
                const orderId = order.orderId || order._id.toString();
                try {
                    if (email) {
                        if (status === "completed") {
                            await (0, emailServices_1.sendOrderPaymentSuccessEmail)(email, name, orderId, totalAmount);
                        }
                        else {
                            await (0, emailServices_1.sendOrderPaymentFailedEmail)(email, name, orderId, totalAmount);
                        }
                    }
                }
                catch (emailError) {
                    console.error("Failed to send payment email:", emailError);
                }
            }
        }
        else if (transaction.status === "completed") {
            await updateOrderAfterPayment(transaction.order.toString(), txRef, "completed", transaction.paidAt);
        }
        else if (transaction.status === "failed") {
            await updateOrderAfterPayment(transaction.order.toString(), txRef, "failed");
        }
    }
    return transaction;
};
const createCheckoutSession = async (req, res) => {
    let claimedOrderId = null;
    let claimedTxRef = null;
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { orderId, callbackUrl, customerName, customerEmail, customerPhone } = req.body || {};
        if (!orderId) {
            return res.status(400).json({ message: "orderId is required" });
        }
        const order = await resolveOrder(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.paymentStatus === "completed") {
            return res.status(409).json({ message: "Order is already paid" });
        }
        const user = await User_1.default.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (req.user.role !== "admin" &&
            order.cartName &&
            order.cartName !== `${user.username}_cart`) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const amount = Number(order.totalAmount || 0);
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid order amount" });
        }
        const txRef = (0, transactionRef_1.generateTransactionRef)("EC-ORDER");
        claimedTxRef = txRef;
        const config = (0, flutterwave_1.getFlutterwaveConfig)();
        const redirectUrl = callbackUrl || config.redirectUrl;
        if (!redirectUrl) {
            return res
                .status(500)
                .json({ message: "Missing Flutterwave redirect URL" });
        }
        const claimedOrder = await orders_1.default.findOneAndUpdate({ _id: order._id, paymentStatus: { $in: ["unpaid", "failed"] } }, {
            $set: {
                paymentStatus: "pending",
                paymentTxRef: txRef,
                paymentProvider: "flutterwave",
            },
        }, { new: true });
        if (!claimedOrder) {
            const freshOrder = await orders_1.default.findById(order._id);
            if (freshOrder?.paymentStatus === "completed") {
                return res.status(409).json({ message: "Order is already paid" });
            }
            if (freshOrder?.paymentStatus === "pending" && freshOrder.paymentTxRef) {
                const existingTx = await PaymentTransaction_1.PaymentTransaction.findOne({
                    txRef: freshOrder.paymentTxRef,
                });
                if (existingTx?.paymentUrl) {
                    return res.status(200).json({
                        paymentUrl: existingTx.paymentUrl,
                        txRef: existingTx.txRef,
                        transactionId: existingTx._id,
                    });
                }
                return res.status(202).json({
                    message: "Payment session is being prepared. Please retry shortly.",
                    txRef: freshOrder.paymentTxRef,
                });
            }
            return res
                .status(409)
                .json({ message: "Order payment is already in progress" });
        }
        claimedOrderId = claimedOrder._id.toString();
        const payload = {
            tx_ref: txRef,
            amount,
            currency: config.currency || "RWF",
            redirect_url: redirectUrl,
            customer: {
                email: customerEmail || order.customerInfo?.email || user.email,
                name: customerName || order.customerInfo?.name || user.username,
                phonenumber: customerPhone || order.customerInfo?.phone,
            },
            meta: {
                orderId: order.orderId || order._id.toString(),
                orderDbId: order._id.toString(),
                userId: user._id.toString(),
                cartName: order.cartName,
            },
            customizations: {
                title: "E-commerce Order Payment",
                description: `Payment for order ${order.orderId || order._id.toString()}`,
            },
        };
        const response = await (0, flutterwave_1.createFlutterwavePayment)(payload);
        const link = response?.data?.link;
        if (!link) {
            return res.status(502).json({ message: "Failed to create payment link" });
        }
        const transaction = await PaymentTransaction_1.PaymentTransaction.findOneAndUpdate({ txRef }, {
            $setOnInsert: {
                user: user._id,
                order: order._id,
                txRef,
                status: "pending",
                amount,
                currency: payload.currency,
                provider: "flutterwave",
                metadata: payload.meta,
            },
            $set: {
                raw: response,
                paymentUrl: link,
            },
        }, { upsert: true, new: true });
        res.status(201).json({
            paymentUrl: link,
            txRef,
            transactionId: transaction._id,
        });
    }
    catch (error) {
        if (claimedOrderId && claimedTxRef) {
            await orders_1.default.updateOne({
                _id: claimedOrderId,
                paymentTxRef: claimedTxRef,
                paymentStatus: "pending",
            }, { $set: { paymentStatus: "unpaid" }, $unset: { paymentTxRef: "" } });
        }
        const status = error instanceof flutterwave_1.PaymentError ? error.status : 500;
        res.status(status).json({
            message: error?.message || "Failed to create checkout session",
        });
    }
};
exports.createCheckoutSession = createCheckoutSession;
const listTransactions = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const status = req.query.status;
        if (status && !["pending", "completed", "failed"].includes(status)) {
            return res.status(400).json({ message: "Invalid status filter" });
        }
        const filter = req.user.role === "admin" ? {} : { user: req.user.id };
        if (status)
            filter.status = status;
        const transactions = await PaymentTransaction_1.PaymentTransaction.find(filter)
            .sort({ createdAt: -1 })
            .populate("order", "orderId totalAmount status paymentStatus cartName");
        res.status(200).json(transactions);
    }
    catch (error) {
        res.status(500).json({
            message: error?.message || "Failed to fetch transactions",
        });
    }
};
exports.listTransactions = listTransactions;
const verifyPayment = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const txRef = req.params.txRef;
        const flwIdParam = req.query.flwId;
        const transaction = await PaymentTransaction_1.PaymentTransaction.findOne({ txRef });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        if (req.user.role !== "admin" &&
            transaction.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }
        if (transaction.status === "completed") {
            return res.status(200).json({
                status: transaction.status,
                amount: transaction.amount,
                currency: transaction.currency,
                flwId: transaction.flwId,
                txRef: transaction.txRef,
                providerStatus: "successful",
            });
        }
        const flwId = flwIdParam || transaction.flwId;
        if (!flwId) {
            return res
                .status(400)
                .json({ message: "Flutterwave transaction id required" });
        }
        const response = await (0, flutterwave_1.verifyFlutterwaveTransaction)(flwId);
        const data = response?.data;
        const dataTxRef = Array.isArray(data?.tx_ref) ? data.tx_ref[0] : data?.tx_ref;
        if (dataTxRef && dataTxRef !== txRef) {
            return res.status(400).json({ message: "Transaction reference mismatch" });
        }
        const isTerminal = data?.status === "successful" || data?.status === "failed";
        const isSuccess = data?.status === "successful" &&
            Number(data.amount) === transaction.amount &&
            data.currency === transaction.currency;
        const updatedTransaction = isTerminal
            ? await finalizeTransaction(txRef, String(data?.id || flwId || ""), data, isSuccess)
            : transaction;
        const finalTx = updatedTransaction || transaction;
        const order = await orders_1.default.findById(finalTx.order);
        res.status(200).json({
            status: finalTx.status,
            amount: finalTx.amount,
            currency: finalTx.currency,
            flwId: finalTx.flwId,
            txRef: finalTx.txRef,
            providerStatus: data?.status,
            orderId: order?.orderId || order?._id?.toString(),
            orderDbId: order?._id?.toString(),
            paymentStatus: order?.paymentStatus,
            orderStatus: order?.status,
        });
    }
    catch (error) {
        const status = error instanceof flutterwave_1.PaymentError ? error.status : 500;
        res.status(status).json({
            message: error?.message || "Failed to verify payment",
        });
    }
};
exports.verifyPayment = verifyPayment;
const flutterwaveWebhook = async (req, res) => {
    try {
        const config = (0, flutterwave_1.getFlutterwaveConfig)();
        const rawSignature = req.headers["verif-hash"];
        const signature = Array.isArray(rawSignature)
            ? rawSignature[0]
            : rawSignature;
        if (!config.secretHash || signature !== config.secretHash) {
            return res.status(400).json({ message: "Invalid Flutterwave signature" });
        }
        const { event, data } = req.body || {};
        if (event !== "charge.completed") {
            return res.status(200).json({ received: true });
        }
        const txRef = Array.isArray(data?.tx_ref) ? data.tx_ref[0] : data?.tx_ref;
        const flwId = data?.id;
        if (!txRef || !flwId) {
            return res
                .status(400)
                .json({ message: "Missing transaction reference or id" });
        }
        const transaction = await PaymentTransaction_1.PaymentTransaction.findOne({ txRef });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        if (transaction.status === "completed") {
            return res.status(200).json({ received: true });
        }
        const verified = await (0, flutterwave_1.verifyFlutterwaveTransaction)(String(flwId));
        const verifiedData = verified?.data;
        const verifiedTxRef = Array.isArray(verifiedData?.tx_ref) ? verifiedData.tx_ref[0] : verifiedData?.tx_ref;
        if (verifiedTxRef !== txRef) {
            return res.status(400).json({ message: "Transaction reference mismatch" });
        }
        const isSuccess = verifiedData?.status === "successful" &&
            Number(verifiedData.amount) === transaction.amount &&
            verifiedData.currency === transaction.currency;
        await finalizeTransaction(txRef, String(flwId), verifiedData, isSuccess);
        res.status(200).json({ received: true });
    }
    catch (error) {
        const status = error instanceof flutterwave_1.PaymentError ? error.status : 500;
        res.status(status).json({
            message: error?.message || "Failed to process webhook",
        });
    }
};
exports.flutterwaveWebhook = flutterwaveWebhook;
