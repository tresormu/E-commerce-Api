"use strict";
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & user management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteusers = exports.resetPassword = exports.forgotPassword = exports.deleteAccount = exports.updateUser = exports.getProfile = exports.login = exports.AllUsers = exports.register = void 0;
const emailServices_1 = require("../services/emailServices");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = __importDefault(require("../config/config"));
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a customer or vendor. Admin registration is not allowed via this endpoint.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 example: john@gmail.com
 *               password:
 *                 type: string
 *                 example: password123
 *               UserType:
 *                 type: string
 *                 enum: [customer, vendor]
 *                 example: customer
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or duplicate user
 *       500:
 *         description: Registration failed
 */
const register = async (req, res) => {
    try {
        const { username, email, password, UserType } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                status: "fail",
                message: "User with this email already exists",
            });
        }
        let imageUrl = "";
        if (req.file) {
            imageUrl = req.file.path;
        }
        const user = await User_1.default.create({
            username,
            email,
            password,
            UserType: UserType || "customer",
            profile: imageUrl,
        });
        (0, emailServices_1.sendWelcomeEmail)(email, username).catch((err) => {
            console.error("Failed to send welcome email:", err);
        });
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                profile: user.profile,
                username: user.username,
                email: user.email,
                role: user.UserType,
            },
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "Email or username already exists" });
        }
        res.status(500).json({ error: "Registration failed" });
    }
};
exports.register = register;
/**
 * @swagger
 * /api/auth:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
const AllUsers = async (req, res) => {
    try {
        const users = await User_1.default.find().select("-password -resetPasswordToken -resetPasswordExpires");
        res.json({ users });
    }
    catch (error) {
        res.status(500).json({ error: "invalid endpoint" });
    }
};
exports.AllUsers = AllUsers;
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@gmail.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Login failed
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.UserType }, config_1.default.jwtSecret, { expiresIn: config_1.default.expirationToken });
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                profile: user.profile,
                username: user.username,
                email: user.email,
                role: user.UserType,
            },
        });
    }
    catch (error) {
        console.error("LOGIN ERROR 👉", error);
        return res.status(500).json({ error: "Login failed" });
    }
};
exports.login = login;
/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get logged-in user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
const getProfile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            profile: user.profile,
            role: user.UserType,
            createdAt: user.createdAt,
        });
    }
    catch {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
};
exports.getProfile = getProfile;
/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error or email already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
const updateUser = async (req, res) => {
    try {
        const { username, email } = req.body;
        const user = await User_1.default.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (email && email !== user.email) {
            const existingUser = await User_1.default.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: "Email already exists" });
            }
        }
        let imageUrl = user.profile;
        if (req.file) {
            imageUrl = req.file.path;
        }
        if (username)
            user.username = username;
        if (email)
            user.email = email;
        if (imageUrl)
            user.profile = imageUrl;
        await user.save();
        res.json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profile: user.profile,
                role: user.UserType,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update profile" });
    }
};
exports.updateUser = updateUser;
/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     summary: Delete user account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete account
 */
const deleteAccount = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        await User_1.default.findByIdAndDelete(req.user.id);
        res.json({ message: "Account deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete account" });
    }
};
exports.deleteAccount = deleteAccount;
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *       404:
 *         description: No user found with that email
 *       500:
 *         description: Server error
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ status: "fail", message: "No user found with that email" });
        }
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const hashedToken = crypto_1.default.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000);
        await user.save();
        await (0, emailServices_1.sendPasswordResetEmail)(email, user.username, resetToken);
        return res.status(200).json({
            status: "success",
            message: "Password reset email sent. Check your inbox!",
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "fail",
            message: "Failed to send reset email",
            error: error.message,
        });
    }
};
exports.forgotPassword = forgotPassword;
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const user = await User_1.default.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({ status: "fail", message: "Invalid or expired reset token" });
        }
        user.password = await bcryptjs_1.default.hash(newPassword, config_1.default.saltRounds);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        return res.status(200).json({
            status: "success",
            message: "Password reset successful. You can now login.",
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "fail",
            message: "Password reset failed",
            error: error.message,
        });
    }
};
exports.resetPassword = resetPassword;
/**
 * @swagger
 * /api/auth/users:
 *   delete:
 *     summary: Delete all users (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All users deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to delete users
 */
const deleteusers = async (req, res) => {
    try {
        await User_1.default.deleteMany({});
        res.json({ message: "All users deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete users" });
    }
};
exports.deleteusers = deleteusers;
