import nodemailer from "nodemailer";
import config from "./config";

export const transporter = nodemailer.createTransport({
  service: "gmail",
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