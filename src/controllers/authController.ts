/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & user management
 */

import { sendWelcomeEmail, sendPasswordResetEmail } from "../services/emailServices";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AuthRequest } from "../models/type";
import crypto from "crypto";
import config from "../config/config";

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
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, UserType } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const existingUser = await User.findOne({ email });
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
    const user = await User.create({
      username,
      email,
      password,
      UserType: UserType || "customer",
      profile: imageUrl,
    });
    sendWelcomeEmail(email, username).catch((err: unknown) => {
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
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email or username already exists" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
};

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
export const AllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password -resetPasswordToken -resetPasswordExpires");
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: "invalid endpoint" });
  }
};

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
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.UserType },
      config.jwtSecret,
      { expiresIn: config.expirationToken },
    );

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
  } catch (error) {
    console.error("LOGIN ERROR ", error);
    return res.status(500).json({ error: "Login failed" });
  }
};

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
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select("-password");
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
  } catch {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

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
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user!.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    let imageUrl = user.profile;
    if (req.file) {
      imageUrl = req.file.path;
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (imageUrl) user.profile = imageUrl;

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
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

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
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await User.findByIdAndDelete(req.user!.id);
    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete account" });
  }
};

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
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: "fail", message: "No user found with that email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    await sendPasswordResetEmail(email, user.username, resetToken);

    return res.status(200).json({
      status: "success",
      message: "Password reset email sent. Check your inbox!",
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "fail",
      message: "Failed to send reset email",
      error: error.message,
    });
  }
};

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
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ status: "fail", message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(newPassword, config.saltRounds);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Password reset successful. You can now login.",
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "fail",
      message: "Password reset failed",
      error: error.message,
    });
  }
};

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
export const deleteusers = async (req: AuthRequest, res: Response) => {
  try {
    await User.deleteMany({});
    res.json({ message: "All users deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete users" });
  }
};
