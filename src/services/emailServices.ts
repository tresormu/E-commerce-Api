import { Resend } from "resend";
import config from "../config/config";
import {
  welcomeEmailTemplate,
  passwordResetTemplate,
  orderConfirmationTemplate,
  orderCancellationTemplate,
  orderPaymentSuccessTemplate,
  orderPaymentFailedTemplate,
} from "../utils/emailTemplate";

const resend = new Resend(config.email.apiKey);

const send = (to: string, subject: string, html: string) =>
  resend.emails.send({ from: config.email.from, to, subject, html });

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
