import nodemailer from "nodemailer";
import config from "../config/config";
import {
  welcomeEmailTemplate,
  passwordResetTemplate,
  orderConfirmationTemplate,
  orderCancellationTemplate,
  orderPaymentSuccessTemplate,
  orderPaymentFailedTemplate,
} from "../utils/emailTemplate";

export const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

transporter.verify((error) => {
  if (error) {
    console.warn("Email configuration warning:", error.message);
  } else {
    console.log("Email server is ready to send messages");
  }
});

const send = (to: string, subject: string, html: string) =>
  transporter.sendMail({ from: config.email.from, to, subject, html });

export const sendWelcomeEmail = (email: string, username: string) =>
  send(email, "Welcome!", welcomeEmailTemplate(username, email));

export const sendPasswordResetEmail = (email: string, username: string, token: string) =>
  send(email, "Password Reset Request", passwordResetTemplate(username, token));

export const sendOrderConfirmationEmail = (
  email: string, username: string, orderId: string, totalAmount: number,
) => send(email, "Order Confirmation", orderConfirmationTemplate(username, orderId, totalAmount));

export const sendOrderCancellationEmail = (
  email: string, username: string, orderId: string, cancelledBy: string,
) => send(email, "Order Cancelled", orderCancellationTemplate(username, orderId, cancelledBy));

export const sendOrderPaymentSuccessEmail = (
  email: string, username: string, orderId: string, totalAmount: number,
) => send(email, "Payment Successful", orderPaymentSuccessTemplate(username, orderId, totalAmount));

export const sendOrderPaymentFailedEmail = (
  email: string, username: string, orderId: string, totalAmount: number,
) => send(email, "Payment Failed", orderPaymentFailedTemplate(username, orderId, totalAmount));
