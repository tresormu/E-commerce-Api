"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("./config"));
exports.transporter = nodemailer_1.default.createTransport({
    service: "gmail",
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
