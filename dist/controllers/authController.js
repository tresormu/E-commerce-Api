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
            // Don't fail registration if email fails
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
            return res
                .status(400)
                .json({ error: "Email or username already exists" });
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
 *     description: Returns all registered users
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
        const users = await User_1.default.find().select('-password -resetPasswordToken -resetPasswordExpires');
        res.json({
            users,
        });
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
 *     description: Authenticate user and return JWT token
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
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.UserType }, process.env.JWT_SECRET, { expiresIn: "7d" });
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
 *     description: Returns profile of the authenticated user
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
 *     description: Update authenticated user's profile information. All fields are optional - only provided fields will be updated.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Optional - new username
 *                 example: john_doe_updated
 *               email:
 *                 type: string
 *                 description: Optional - new email address
 *                 example: john.updated@gmail.com
 *               profile:
 *                 type: string
 *                 format: binary
 *                 description: Optional - new profile image
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
        // Check if email is being changed and if it already exists
        if (email && email !== user.email) {
            const existingUser = await User_1.default.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: "Email already exists" });
            }
        }
        // Handle profile image upload
        let imageUrl = user.profile;
        if (req.file) {
            imageUrl = req.file.path;
        }
        // Update user fields
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
 *     description: Delete the authenticated user's account permanently
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
 *     description: Sends a password reset token to the user's email address.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Password reset email sent. Check your inbox!
 *       404:
 *         description: No user found with that email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: No user found with that email
 *       500:
 *         description: Server error
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "No user found with that email",
            });
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const hashedToken = crypto_1.default
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        // Save token to user
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();
        // Send email
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
 *     description: Resets the user's password using a valid reset token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: 8f3a9c4d2a1e6b7c9d...
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewStrongPassword123!
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Password reset successful. You can now login.
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: Invalid or expired reset token
 *       500:
 *         description: Server error
 */
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        // Hash the token from URL
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        // Find user with valid token
        const user = await User_1.default.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid or  expired reset token",
            });
        }
        // Update password
        user.password = await bcryptjs_1.default.hash(newPassword, 12);
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
 *     description: Deletes all users from the database
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
