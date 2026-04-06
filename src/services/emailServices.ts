import nodemailer from "nodemailer";
import dotenv from "dotenv";
import {
  welcomeEmailTemplate,
  passwordResetTemplate,
  orderConfirmationTemplate,
  orderCancellationTemplate,
  orderPaymentSuccessTemplate,
  orderPaymentFailedTemplate,
} from "../utils/emailTemplate";

dotenv.config();

const getTransporter = () => {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
  const secure =
    process.env.EMAIL_SECURE === "true" || (port !== undefined && port === 465);

  if (host && port) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth:
        process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
          ? {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD,
            }
          : undefined,
    });
  }

  if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  return null;
};

export const transporter = getTransporter();

if (transporter) {
  transporter.verify((error) => {
    if (error) {
      console.warn("Email configuration warning:", error.message);
    } else {
      console.log("Email server is ready to send messages");
    }
  });
} else {
  console.log("Email service disabled - no credentials provided");
}

const send = (to: string, subject: string, html: string) => {
  if (!transporter) return Promise.resolve();
  return transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
};

export const sendWelcomeEmail = (email: string, username: string) =>
  send(email, "Welcome!", welcomeEmailTemplate(username, email));

export const sendPasswordResetEmail = (
  email: string,
  username: string,
  token: string,
) => send(email, "Password Reset Request", passwordResetTemplate(username, token));

export const sendOrderConfirmationEmail = (
  email: string,
  username: string,
  orderId: string,
  totalAmount: number,
) =>
  send(
    email,
    "Order Confirmation",
    orderConfirmationTemplate(username, orderId, totalAmount),
  );

export const sendOrderCancellationEmail = (
  email: string,
  username: string,
  orderId: string,
  cancelledBy: string,
) =>
  send(
    email,
    "Order Cancelled",
    orderCancellationTemplate(username, orderId, cancelledBy),
  );

export const sendOrderPaymentSuccessEmail = (
  email: string,
  username: string,
  orderId: string,
  totalAmount: number,
) =>
  send(
    email,
    "Payment Successful",
    orderPaymentSuccessTemplate(username, orderId, totalAmount),
  );

export const sendOrderPaymentFailedEmail = (
  email: string,
  username: string,
  orderId: string,
  totalAmount: number,
) =>
  send(
    email,
    "Payment Failed",
    orderPaymentFailedTemplate(username, orderId, totalAmount),
  );
