"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminProduct = exports.addCampaign = exports.getCampaigns = exports.getCustomers = exports.getTopProducts = exports.getAdminOrders = exports.getAnalytics = exports.getDashboardStats = void 0;
const Product_1 = __importDefault(require("../models/Product"));
const User_1 = __importDefault(require("../models/User"));
const orders_1 = __importDefault(require("../models/orders"));
const Categories_1 = __importDefault(require("../models/Categories"));
const mongoose_1 = __importDefault(require("mongoose"));
const getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await Product_1.default.countDocuments();
        const totalUsers = await User_1.default.countDocuments({ UserType: "customer" });
        const totalOrders = await orders_1.default.countDocuments();
        const totalRevenue = await orders_1.default.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        res.json({
            revenue: `$${totalRevenue[0]?.total || 0}`,
            orders: totalOrders.toString(),
            customers: totalUsers.toString(),
            products: totalProducts.toString(),
            target: "85%"
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
};
exports.getDashboardStats = getDashboardStats;
const getAnalytics = async (req, res) => {
    try {
        const { range = "7d" } = req.query;
        // Mock analytics data - replace with real calculations
        const analytics = {
            revenue: { current: 75000, previous: 68000, change: 10.3 },
            orders: { current: 1250, previous: 1180, change: 5.9 },
            customers: { current: 890, previous: 820, change: 8.5 },
            pageViews: { current: 15420, previous: 14200, change: 8.6 },
            topProducts: await Product_1.default.find().limit(5).populate("category"),
            salesChart: []
        };
        res.json(analytics);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
};
exports.getAnalytics = getAnalytics;
const getAdminOrders = async (req, res) => {
    try {
        const orders = await orders_1.default.find().sort({ timeOrderPlaced: -1 });
        // Transform orders to match frontend expectations
        const transformedOrders = orders.map(order => ({
            _id: order._id,
            orderNumber: order.orderId || `ORD-${order._id.toString().slice(-6)}`,
            customer: {
                name: order.cartName,
                email: "customer@example.com" // Add email field to Order model later
            },
            products: [{ name: "Product", quantity: 1, price: order.totalAmount }],
            total: order.totalAmount,
            status: "pending",
            createdAt: order.timeOrderPlaced
        }));
        res.json({ orders: transformedOrders });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
};
exports.getAdminOrders = getAdminOrders;
const getTopProducts = async (req, res) => {
    try {
        const products = await Product_1.default.find()
            .populate("category")
            .sort({ createdAt: -1 })
            .limit(10);
        const topProducts = products.map(product => ({
            _id: product._id,
            name: product.name,
            price: product.price,
            sales: Math.floor(Math.random() * 100) + 10, // Mock sales data
            image: product.Images[0]
        }));
        res.json({ products: topProducts });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch top products" });
    }
};
exports.getTopProducts = getTopProducts;
const getCustomers = async (req, res) => {
    try {
        const customers = await User_1.default.find({ UserType: "customer" })
            .select("-password")
            .sort({ createdAt: -1 });
        // Get order statistics for each customer
        const customersWithStats = await Promise.all(customers.map(async (customer) => {
            const orders = await orders_1.default.find({ cartName: customer.username });
            const totalOrders = orders.length;
            const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            const lastOrder = orders.sort((a, b) => new Date(b.timeOrderPlaced).getTime() - new Date(a.timeOrderPlaced).getTime())[0];
            return {
                _id: customer._id,
                name: customer.username,
                email: customer.email,
                phone: "", // Add phone field to User model later if needed
                totalOrders,
                totalSpent,
                lastOrderDate: lastOrder?.timeOrderPlaced || null,
                createdAt: customer.createdAt,
                status: "active" // Default status
            };
        }));
        // Calculate stats
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newThisMonth = customersWithStats.filter(c => new Date(c.createdAt) >= thisMonth).length;
        const activeThisMonth = customersWithStats.filter(c => c.lastOrderDate && new Date(c.lastOrderDate) >= thisMonth).length;
        const stats = {
            total: customersWithStats.length,
            active: activeThisMonth,
            newThisMonth
        };
        res.json({
            customers: customersWithStats,
            stats
        });
    }
    catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: "Failed to fetch customers" });
    }
};
exports.getCustomers = getCustomers;
const getCampaigns = async (req, res) => {
    try {
        // Mock campaigns data - implement Campaign model later
        const campaigns = [
            {
                _id: "1",
                name: "Summer Sale",
                type: "Email",
                status: "Active",
                reach: "5,420",
                clicks: "1,230",
                conversion: "8.5%"
            }
        ];
        res.json({ campaigns });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch campaigns" });
    }
};
exports.getCampaigns = getCampaigns;
const addCampaign = async (req, res) => {
    try {
        const campaignData = req.body;
        // Mock campaign creation - implement Campaign model later
        const campaign = {
            _id: Date.now().toString(),
            ...campaignData,
            createdAt: new Date()
        };
        res.status(201).json({ campaign });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create campaign" });
    }
};
exports.addCampaign = addCampaign;
const createAdminProduct = async (req, res) => {
    try {
        const { name, price, category, oldPrice, description } = req.body;
        // Validate category ID
        if (!mongoose_1.default.Types.ObjectId.isValid(category)) {
            return res.status(400).json({ error: "Invalid category ID" });
        }
        // Check if category exists
        const categoryExists = await Categories_1.default.findById(category);
        if (!categoryExists) {
            return res.status(404).json({ error: "Category not found" });
        }
        // Handle image uploads
        const Images = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                Images.push(file.path);
            }
        }
        // Create product with default admin user (you may want to modify this)
        const product = await Product_1.default.create({
            name,
            price: Number(price),
            oldPrice: oldPrice ? Number(oldPrice) : undefined,
            description,
            Images,
            category,
            createdBy: new mongoose_1.default.Types.ObjectId() // Default admin ID - modify as needed
        });
        const populatedProduct = await Product_1.default.findById(product._id).populate('category');
        res.status(201).json(populatedProduct);
    }
    catch (error) {
        console.error('Error creating admin product:', error);
        res.status(500).json({ error: "Failed to create product" });
    }
};
exports.createAdminProduct = createAdminProduct;
