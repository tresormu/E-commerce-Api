"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTransactionRef = generateTransactionRef;
const crypto_1 = __importDefault(require("crypto"));
function generateTransactionRef(prefix = "EC") {
    const rand = crypto_1.default.randomBytes(6).toString("hex").toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${timestamp}-${rand}`;
}
