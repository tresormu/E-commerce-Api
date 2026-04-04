"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderCancellationEmail = exports.sendOrderConfirmationEmail = exports.sendPasswordResetEmail = exports.sendWelcomeEmail = exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.transporter = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
    ? nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    })
    : null;
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
const sendWelcomeEmail = (email, username) => send(email, "Welcome!", `<p>Hi <strong>${username}</strong>, welcome to our platform!</p>`);
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendPasswordResetEmail = (email, username, token) => send(email, "Password Reset Request", `<p>Hi <strong>${username}</strong>,</p>
     <p>Use this token to reset your password: <strong>${token}</strong></p>
     <p>This token expires in 1 hour.</p>`);
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendOrderConfirmationEmail = (email, username, orderId, totalAmount) => send(email, "Order Confirmation", `<p>Hi <strong>${username}</strong>,</p>
     <p>Your order <strong>${orderId}</strong> has been placed successfully.</p>
     <p>Total: <strong>$${totalAmount.toFixed(2)}</strong></p>`);
exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
const sendOrderCancellationEmail = (email, username, orderId, cancelledBy) => send(email, "Order Cancelled", `<p>Hi <strong>${username}</strong>,</p>
     <p>Your order <strong>${orderId}</strong> has been cancelled by <strong>${cancelledBy}</strong>.</p>`);
exports.sendOrderCancellationEmail = sendOrderCancellationEmail;
