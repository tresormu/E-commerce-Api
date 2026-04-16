"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requireEnv = (key) => {
    const value = process.env[key];
    if (!value)
        throw new Error(`Missing required environment variable: ${key}`);
    return value;
};
const parseDnsServers = () => {
    const raw = process.env.DNS_SERVERS;
    if (!raw)
        return undefined;
    const servers = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return servers.length > 0 ? servers : undefined;
};
const config = {
    // Server
    port: Number(requireEnv("PORT")),
    dnsServers: parseDnsServers(),
    // Database
    mongoUrl: requireEnv("MONGO_URL"),
    // Auth
    jwtSecret: requireEnv("JWT_SECRET"),
    adminPass: requireEnv("ADMIN_PASS"),
    expirationToken: (process.env.EXPIRATION_TOKEN),
    saltRounds: Number(process.env.SALT_ROUNDS),
    // Cloudinary
    cloudinary: {
        cloudName: requireEnv("CLOUDINARY_CLOUD_NAME"),
        apiKey: requireEnv("CLOUDINARY_API_KEY"),
        apiSecret: requireEnv("CLOUDINARY_API_SECRET"),
    },
    // Email
    email: {
        apiKey: requireEnv("RESEND_API_KEY"),
        from: requireEnv("EMAIL_FROM"),
    },
    // Flutterwave
    flutterwave: {
        publicKey: requireEnv("FLW_PUBLIC_KEY"),
        secretKey: requireEnv("FLW_SECRET_KEY"),
        secretHash: requireEnv("FLW_SECRET_HASH"),
        baseUrl: requireEnv("FLW_BASE_URL"),
        redirectUrl: requireEnv("FLW_REDIRECT_URL"),
    },
};
exports.default = config;
