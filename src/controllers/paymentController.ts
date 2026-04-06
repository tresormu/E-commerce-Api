import { Request, Response } from "express";
import { AuthRequest } from "../models/type";
import Order from "../models/orders";
import User from "../models/User";
import { PaymentTransaction } from "../models/PaymentTransaction";
import {
  sendOrderPaymentFailedEmail,
  sendOrderPaymentSuccessEmail,
} from "../services/emailServices";
import {
  createFlutterwavePayment,
  getFlutterwaveConfig,
  PaymentError,
  verifyFlutterwaveTransaction,
} from "../utils/flutterwave";
import { generateTransactionRef } from "../utils/transactionRef";

const resolveOrder = async (orderId: string) => {
  let order = await Order.findOne({ orderId });
  if (!order && /^[a-f0-9]{24}$/i.test(orderId)) {
    order = await Order.findById(orderId);
  }
  return order;
};

const updateOrderAfterPayment = async (
  orderId: string,
  txRef: string,
  status: "completed" | "failed",
  paidAt?: Date,
) => {
  if (status === "completed") {
    await Order.updateOne(
      { _id: orderId, paymentTxRef: txRef, paymentStatus: { $ne: "completed" } },
      { $set: { paymentStatus: "completed", paidAt } },
    );
    await Order.updateOne(
      { _id: orderId, paymentTxRef: txRef, status: "pending" },
      { $set: { status: "processing" } },
    );
    return;
  }

  await Order.updateOne(
    { _id: orderId, paymentTxRef: txRef, paymentStatus: { $ne: "completed" } },
    { $set: { paymentStatus: "failed" }, $unset: { paidAt: "" } },
  );
};

const finalizeTransaction = async (
  txRef: string,
  flwId: string,
  verifiedData: Record<string, any>,
  isSuccess: boolean,
) => {
  const status = isSuccess ? "completed" : "failed";
  const update: Record<string, any> = {
    status,
    flwId: String(flwId),
    raw: verifiedData,
  };
  if (isSuccess) {
    update.paidAt = new Date();
  }

  const updated = await PaymentTransaction.findOneAndUpdate(
    { txRef, status: "pending" },
    { $set: update },
    { new: true },
  );

  const transaction = updated || (await PaymentTransaction.findOne({ txRef }));
  if (transaction) {
    if (updated) {
      await updateOrderAfterPayment(
        transaction.order.toString(),
        txRef,
        status,
        update.paidAt,
      );

      const [order, user] = await Promise.all([
        Order.findById(transaction.order),
        User.findById(transaction.user),
      ]);

      if (order) {
        const email = order.customerInfo?.email || user?.email;
        const name = order.customerInfo?.name || user?.username || "Customer";
        const totalAmount = Number(order.totalAmount || transaction.amount || 0);
        const orderId = order.orderId || order._id.toString();

        try {
          if (email) {
            if (status === "completed") {
              await sendOrderPaymentSuccessEmail(
                email,
                name,
                orderId,
                totalAmount,
              );
            } else {
              await sendOrderPaymentFailedEmail(
                email,
                name,
                orderId,
                totalAmount,
              );
            }
          }
        } catch (emailError) {
          console.error("Failed to send payment email:", emailError);
        }
      }
    } else if (transaction.status === "completed") {
      await updateOrderAfterPayment(
        transaction.order.toString(),
        txRef,
        "completed",
        transaction.paidAt,
      );
    } else if (transaction.status === "failed") {
      await updateOrderAfterPayment(transaction.order.toString(), txRef, "failed");
    }
  }

  return transaction;
};

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  let claimedOrderId: string | null = null;
  let claimedTxRef: string | null = null;
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { orderId, callbackUrl, customerName, customerEmail, customerPhone } =
      req.body || {};

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

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      req.user.role !== "admin" &&
      order.cartName &&
      order.cartName !== `${user.username}_cart`
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const amount = Number(order.totalAmount || 0);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid order amount" });
    }

    const txRef = generateTransactionRef("EC-ORDER");
    claimedTxRef = txRef;
    const config = getFlutterwaveConfig();
    const redirectUrl = callbackUrl || config.redirectUrl;
    if (!redirectUrl) {
      return res
        .status(500)
        .json({ message: "Missing Flutterwave redirect URL" });
    }

    const claimedOrder = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $in: ["unpaid", "failed"] } },
      {
        $set: {
          paymentStatus: "pending",
          paymentTxRef: txRef,
          paymentProvider: "flutterwave",
        },
      },
      { new: true },
    );

    if (!claimedOrder) {
      const freshOrder = await Order.findById(order._id);
      if (freshOrder?.paymentStatus === "completed") {
        return res.status(409).json({ message: "Order is already paid" });
      }

      if (freshOrder?.paymentStatus === "pending" && freshOrder.paymentTxRef) {
        const existingTx = await PaymentTransaction.findOne({
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

    const response = await createFlutterwavePayment(payload);
    const link = response?.data?.link;
    if (!link) {
      return res.status(502).json({ message: "Failed to create payment link" });
    }

    const transaction = await PaymentTransaction.findOneAndUpdate(
      { txRef },
      {
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
      },
      { upsert: true, new: true },
    );

    res.status(201).json({
      paymentUrl: link,
      txRef,
      transactionId: transaction._id,
    });
  } catch (error: any) {
    if (claimedOrderId && claimedTxRef) {
      await Order.updateOne(
        {
          _id: claimedOrderId,
          paymentTxRef: claimedTxRef,
          paymentStatus: "pending",
        },
        { $set: { paymentStatus: "unpaid" }, $unset: { paymentTxRef: "" } },
      );
    }
    const status = error instanceof PaymentError ? error.status : 500;
    res.status(status).json({
      message: error?.message || "Failed to create checkout session",
    });
  }
};

export const listTransactions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const status = req.query.status as string | undefined;
    if (status && !["pending", "completed", "failed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status filter" });
    }

    const filter: Record<string, any> =
      req.user.role === "admin" ? {} : { user: req.user.id };
    if (status) filter.status = status;

    const transactions = await PaymentTransaction.find(filter)
      .sort({ createdAt: -1 })
      .populate("order", "orderId totalAmount status paymentStatus cartName");

    res.status(200).json(transactions);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || "Failed to fetch transactions",
    });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const txRef = req.params.txRef as string;
    const rawFlwId = req.query.flwId;
    const flwIdParam: string | undefined = Array.isArray(rawFlwId) ? String(rawFlwId[0]) : rawFlwId ? String(rawFlwId) : undefined;

    const transaction = await PaymentTransaction.findOne({ txRef });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (
      req.user.role !== "admin" &&
      transaction.user.toString() !== req.user.id
    ) {
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

    const response = await verifyFlutterwaveTransaction(flwId);
    const data = response?.data;

    const dataTxRef = Array.isArray(data?.tx_ref) ? data.tx_ref[0] : data?.tx_ref as string;
    if (dataTxRef && dataTxRef !== txRef) {
      return res.status(400).json({ message: "Transaction reference mismatch" });
    }

    const isTerminal =
      data?.status === "successful" || data?.status === "failed";
    const isSuccess =
      data?.status === "successful" &&
      Number(data.amount) === transaction.amount &&
      data.currency === transaction.currency;

    const updatedTransaction = isTerminal
      ? await finalizeTransaction(
          txRef,
          String(data?.id || flwId || ""),
          data,
          isSuccess,
        )
      : transaction;

    const finalTx = updatedTransaction || transaction;
    const order = await Order.findById(finalTx.order);

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
  } catch (error: any) {
    const status = error instanceof PaymentError ? error.status : 500;
    res.status(status).json({
      message: error?.message || "Failed to verify payment",
    });
  }
};

export const flutterwaveWebhook = async (req: Request, res: Response) => {
  try {
    const config = getFlutterwaveConfig();
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

    const txRef = Array.isArray(data?.tx_ref) ? data.tx_ref[0] : data?.tx_ref as string;
    const flwId = data?.id;
    if (!txRef || !flwId) {
      return res
        .status(400)
        .json({ message: "Missing transaction reference or id" });
    }

    const transaction = await PaymentTransaction.findOne({ txRef });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status === "completed") {
      return res.status(200).json({ received: true });
    }

    const verified = await verifyFlutterwaveTransaction(String(flwId));
    const verifiedData = verified?.data;
    const verifiedTxRef = Array.isArray(verifiedData?.tx_ref) ? verifiedData.tx_ref[0] : verifiedData?.tx_ref as string;

    if (verifiedTxRef !== txRef) {
      return res.status(400).json({ message: "Transaction reference mismatch" });
    }

    const isSuccess =
      verifiedData?.status === "successful" &&
      Number(verifiedData.amount) === transaction.amount &&
      verifiedData.currency === transaction.currency;

    await finalizeTransaction(
      txRef,
      String(flwId),
      verifiedData,
      isSuccess,
    );

    res.status(200).json({ received: true });
  } catch (error: any) {
    const status = error instanceof PaymentError ? error.status : 500;
    res.status(status).json({
      message: error?.message || "Failed to process webhook",
    });
  }
};
