"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentError = void 0;
exports.getFlutterwaveConfig = getFlutterwaveConfig;
exports.createFlutterwavePayment = createFlutterwavePayment;
exports.verifyFlutterwaveTransaction = verifyFlutterwaveTransaction;
class PaymentError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.status = status;
    }
}
exports.PaymentError = PaymentError;
function getFlutterwaveConfig() {
    return {
        publicKey: process.env.FLW_PUBLIC_KEY,
        secretKey: process.env.FLW_SECRET_KEY,
        secretHash: process.env.FLW_SECRET_HASH,
        baseUrl: process.env.FLW_BASE_URL || "https://api.flutterwave.com/v3",
        redirectUrl: process.env.FLW_REDIRECT_URL,
        currency: process.env.FLW_CURRENCY || "RWF",
    };
}
async function createFlutterwavePayment(payload) {
    const config = getFlutterwaveConfig();
    if (!config.secretKey) {
        throw new PaymentError("Flutterwave secret key not configured", 500);
    }
    const response = await fetch(`${config.baseUrl}/payments`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.secretKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new PaymentError(data?.message || "Failed to create Flutterwave payment", response.status);
    }
    return data;
}
async function verifyFlutterwaveTransaction(flwId) {
    const config = getFlutterwaveConfig();
    if (!config.secretKey) {
        throw new PaymentError("Flutterwave secret key not configured", 500);
    }
    const response = await fetch(`${config.baseUrl}/transactions/${flwId}/verify`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${config.secretKey}`,
            "Content-Type": "application/json",
        },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new PaymentError(data?.message || "Failed to verify Flutterwave transaction", response.status);
    }
    return data;
}
