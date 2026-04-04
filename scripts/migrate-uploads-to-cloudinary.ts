import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cloudinary from "../src/config/claudinary.config";
import Product from "../src/models/Product";
import Category from "../src/models/Categories";
import User from "../src/models/User";

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const looksLikeLocalUpload = (value: string, fileName: string) => {
  const normalized = value.replace(/\\/g, "/");
  const needle = `/uploads/${fileName}`;
  if (normalized === `uploads/${fileName}`) return true;
  if (normalized === needle) return true;
  if (normalized.endsWith(needle)) return true;
  return false;
};

const isRemoteUrl = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

const main = async () => {
  const uploadsDir = path.resolve(process.cwd(), "uploads");

  if (!fs.existsSync(uploadsDir)) {
    console.log(`Uploads directory not found: ${uploadsDir}`);
    return;
  }

  requireEnv("MONGO_URL");
  requireEnv("CLOUDINARY_CLOUD_NAME");
  requireEnv("CLOUDINARY_API_KEY");
  requireEnv("CLOUDINARY_API_SECRET");

  const files = fs
    .readdirSync(uploadsDir)
    .filter((file) => fs.statSync(path.join(uploadsDir, file)).isFile());

  if (files.length === 0) {
    console.log("No files found in uploads directory.");
    return;
  }

  console.log(`Found ${files.length} local files to migrate.`);

  const fileUrlMap = new Map<string, string>();
  for (const file of files) {
    const fullPath = path.join(uploadsDir, file);
    try {
      const result = await cloudinary.uploader.upload(fullPath, {
        folder: "uploads/migrated",
      });
      fileUrlMap.set(file, result.secure_url);
      console.log(`Uploaded ${file} -> ${result.secure_url}`);
    } catch (err) {
      console.error(`Failed to upload ${file}:`, err);
    }
  }

  await mongoose.connect(process.env.MONGO_URL!);

  let productUpdates = 0;
  const products = await Product.find();
  for (const product of products) {
    let changed = false;
    const nextImages = product.Images.map((img) => {
      if (!img || isRemoteUrl(img)) return img;

      for (const [fileName, url] of fileUrlMap.entries()) {
        if (looksLikeLocalUpload(img, fileName)) {
          changed = true;
          return url;
        }
      }
      return img;
    });

    if (changed) {
      product.Images = nextImages;
      await product.save();
      productUpdates += 1;
    }
  }

  let categoryUpdates = 0;
  const categories = await Category.find();
  for (const category of categories) {
    const image = category.image || "";
    if (!image || isRemoteUrl(image)) continue;

    let updated = image;
    for (const [fileName, url] of fileUrlMap.entries()) {
      if (looksLikeLocalUpload(image, fileName)) {
        updated = url;
        break;
      }
    }

    if (updated !== image) {
      category.image = updated;
      await category.save();
      categoryUpdates += 1;
    }
  }

  let userUpdates = 0;
  const users = await User.find();
  for (const user of users) {
    const profile = user.profile || "";
    if (!profile || isRemoteUrl(profile)) continue;

    let updated = profile;
    for (const [fileName, url] of fileUrlMap.entries()) {
      if (looksLikeLocalUpload(profile, fileName)) {
        updated = url;
        break;
      }
    }

    if (updated !== profile) {
      user.profile = updated;
      await user.save();
      userUpdates += 1;
    }
  }

  console.log(
    `Migration complete. Updated products: ${productUpdates}, categories: ${categoryUpdates}, users: ${userUpdates}`,
  );

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
