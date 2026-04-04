import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter =
  process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      })
    : null;

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
  send(
    email,
    "Welcome!",
    `<p>Hi <strong>${username}</strong>, welcome to our platform!</p>`
  );

export const sendPasswordResetEmail = (email: string, username: string, token: string) =>
  send(
    email,
    "Password Reset Request",
    `<p>Hi <strong>${username}</strong>,</p>
     <p>Use this token to reset your password: <strong>${token}</strong></p>
     <p>This token expires in 1 hour.</p>`
  );

export const sendOrderConfirmationEmail = (
  email: string,
  username: string,
  orderId: string,
  totalAmount: number
) =>
  send(
    email,
    "Order Confirmation",
    `<p>Hi <strong>${username}</strong>,</p>
     <p>Your order <strong>${orderId}</strong> has been placed successfully.</p>
     <p>Total: <strong>$${totalAmount.toFixed(2)}</strong></p>`
  );

export const sendOrderCancellationEmail = (
  email: string,
  username: string,
  orderId: string,
  cancelledBy: string
) =>
  send(
    email,
    "Order Cancelled",
    `<p>Hi <strong>${username}</strong>,</p>
     <p>Your order <strong>${orderId}</strong> has been cancelled by <strong>${cancelledBy}</strong>.</p>`
  );
