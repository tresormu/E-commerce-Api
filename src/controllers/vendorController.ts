import { Request, Response } from "express";
import Product from "../models/Product";
import Order from "../models/orders";
import { AuthRequest } from "../models/type";

// Get vendor dashboard stats
export const getVendorStats = async (req: AuthRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;
    
    // Get vendor products
    const products = await Product.find({ vendorId });
    const totalProducts = products.length;
    
    // Calculate total sales and revenue (mock for now)
    const totalSales = products.reduce((sum, product) => sum + (product.sales || 0), 0);
    const totalRevenue = products.reduce((sum, product) => sum + ((product.sales || 0) * product.price), 0);
    
    // Get low stock products
    const lowStockProducts = products.filter(product => product.stock < 10).length;
    
    res.json({
      totalProducts,
      totalSales,
      totalRevenue,
      lowStockProducts,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch vendor stats", error });
  }
};

// Get vendor products
export const getVendorProducts = async (req: AuthRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;
    const products = await Product.find({ vendorId });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch vendor products", error });
  }
};

// Add new product
export const addVendorProduct = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Add product request:', req.body);
    console.log('Files:', req.files);
    
    const vendorId = req.user?.id;
    const { name, description, price, stock, category } = req.body;
    
    if (!name || !description || !price || !stock || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Handle image uploads
    const Images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: any) => {
        Images.push(file.path);
      });
    }
    
    if (Images.length !== 4) {
      return res.status(400).json({ message: `Exactly 4 images are required, got ${Images.length}` });
    }
    
    // Find category by name to get ObjectId
    const Category = (await import('../models/Categories')).default;
    const categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc) {
      return res.status(400).json({ message: `Category '${category}' not found` });
    }
    
    const productData = {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category: categoryDoc._id,
      Images,
      vendorId,
      createdBy: vendorId,
      sales: 0,
      inStock: true
    };
    
    console.log('Creating product with data:', productData);
    
    const product = await Product.create(productData);
    res.status(201).json({ message: "Product added successfully", product });
  } catch (error: any) {
    console.error('Add product error:', error);
    res.status(500).json({ message: "Failed to add product", error: error.message });
  }
};

// Update vendor product
export const updateVendorProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const vendorId = req.user?.id;
    const { name, description, price, stock, category } = req.body;
    
    // Find category by name to get ObjectId if category is provided
    let categoryId;
    if (category) {
      const Category = (await import('../models/Categories')).default;
      const categoryDoc = await Category.findOne({ name: category });
      if (!categoryDoc) {
        return res.status(400).json({ message: `Category '${category}' not found` });
      }
      categoryId = categoryDoc._id;
    }
    
    const updateData: any = {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
    };
    
    if (categoryId) {
      updateData.category = categoryId;
    }
    
    const product = await Product.findOneAndUpdate(
      { _id: productId, vendorId },
      updateData,
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }
    
    res.json({ message: "Product updated successfully", product });
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ message: "Failed to update product", error: error.message });
  }
};

// Delete vendor product
export const deleteVendorProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const vendorId = req.user?.id;
    
    console.log('Delete request:', { productId, vendorId });
    
    const product = await Product.findOneAndDelete({ _id: productId, vendorId });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }
    
    res.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};
