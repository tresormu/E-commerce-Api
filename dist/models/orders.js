"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const OrderSchema = new mongoose_1.Schema({
    orderId: { type: String },
    userId: { type: String, required: true },
    cartName: { type: String, required: true },
    totalAmount: { type: Number },
    status: { type: String, default: 'pending', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
    items: [{
            productId: String,
            name: String,
            price: Number,
            quantity: Number
        }],
    customerInfo: {
        name: String,
        email: String,
        phone: String,
        address: String
    },
    paymentMethod: { type: String, default: 'card' },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'pending', 'completed', 'failed'],
        default: 'unpaid',
    },
    paymentProvider: { type: String, default: 'flutterwave' },
    paymentTxRef: { type: String },
    paidAt: { type: Date },
    timeOrderPlaced: { type: Date, required: false, default: Date.now },
});
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ timeOrderPlaced: -1 });
exports.default = mongoose_1.default.model("orders", OrderSchema);
