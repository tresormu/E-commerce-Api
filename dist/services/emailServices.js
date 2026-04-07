"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderPaymentFailedEmail = exports.sendOrderPaymentSuccessEmail = exports.sendOrderCancellationEmail = exports.sendOrderConfirmationEmail = exports.sendPasswordResetEmail = exports.sendWelcomeEmail = exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config/config"));
const emailTemplate_1 = require("../utils/emailTemplate");
exports.transporter = nodemailer_1.default.createTransport({
    host: config_1.default.email.host,
    port: config_1.default.email.port,
    secure: config_1.default.email.port === 465,
    auth: {
        user: config_1.default.email.user,
        pass: config_1.default.email.password,
    },
});
exports.transporter.verify((error) => {
    if (error) {
        console.warn("Email configuration warning:", error.message);
    }
    else {
        console.log("Email server is ready to send messages");
    }
});
const send = (to, subject, html) => exports.transporter.sendMail({ from: config_1.default.email.from, to, subject, html });
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
