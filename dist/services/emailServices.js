"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderPaymentFailedEmail = exports.sendOrderPaymentSuccessEmail = exports.sendOrderCancellationEmail = exports.sendOrderConfirmationEmail = exports.sendPasswordResetEmail = exports.sendWelcomeEmail = exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const emailTemplate_1 = require("../utils/emailTemplate");
dotenv_1.default.config();
const getTransporter = () => {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
    const secure = process.env.EMAIL_SECURE === "true" || (port !== undefined && port === 465);
    if (host && port) {
        return nodemailer_1.default.createTransport({
            host,
            port,
            secure,
            auth: process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
                ? {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                }
                : undefined,
        });
    }
    if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        return nodemailer_1.default.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        return nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }
    return null;
};
exports.transporter = getTransporter();
if (exports.transporter) {
    exports.transporter.verify((error) => {
        if (error) {
            console.warn("Email configuration warning:", error.message);
        }
        else {
            console.log("Email server is ready to send messages");
        }
    });
}
else {
    console.log("Email service disabled - no credentials provided");
}
const send = (to, subject, html) => {
    if (!exports.transporter)
        return Promise.resolve();
    return exports.transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
};
const sendWelcomeEmail = (email, username) => send(email, "Welcome!", (0, emailTemplate_1.welcomeEmailTemplate)(username, email));
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendPasswordResetEmail = (email, username, token) => send(email, "Password Reset Request", (0, emailTemplate_1.passwordResetTemplate)(username, token));
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendOrderConfirmationEmail = (email, username, orderId, totalAmount) => send(email, "Order Confirmation", (0, emailTemplate_1.orderConfirmationTemplate)(username, orderId, totalAmount));
exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
const sendOrderCancellationEmail = (email, username, orderId, cancelledBy) => send(email, "Order Cancelled", (0, emailTemplate_1.orderCancellationTemplate)(username, orderId, cancelledBy));
exports.sendOrderCancellationEmail = sendOrderCancellationEmail;
const sendOrderPaymentSuccessEmail = (email, username, orderId, totalAmount) => send(email, "Payment Successful", (0, emailTemplate_1.orderPaymentSuccessTemplate)(username, orderId, totalAmount));
exports.sendOrderPaymentSuccessEmail = sendOrderPaymentSuccessEmail;
const sendOrderPaymentFailedEmail = (email, username, orderId, totalAmount) => send(email, "Payment Failed", (0, emailTemplate_1.orderPaymentFailedTemplate)(username, orderId, totalAmount));
exports.sendOrderPaymentFailedEmail = sendOrderPaymentFailedEmail;
