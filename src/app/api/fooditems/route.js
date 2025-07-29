import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import FoodItem from "@/app/models/FoodItem";
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Category from "@/app/models/Category";
import Subcategory from "@/app/models/Subcategory";
import Branch from "@/app/models/Branch";

const uploadDir = path.join(process.cwd(), 'public/food-items');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

async function processFileUpload(formData, fieldName) {
  const file = formData.get(fieldName);
  
  if (!file || file.size === 0) {
    return null;
  }
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `item-${uuidv4()}${path.extname(file.name)}`;
  const filepath = path.join(uploadDir, filename);
  
  fs.writeFileSync(filepath, buffer);
  
  return `/food-items/${filename}`;
}

export async function POST(request) {
  try {
    await connectDB();
    const formData = await request.formData();
    
    const title = formData.get("title");
    const description = formData.get("description");
    const price = formData.get("price");
    const category = formData.get("category");
    const subcategory = formData.get("subcategory");
    const branch = formData.get("branch");
    
    let variationsParsed = [];
    const variations = formData.get("variations");
    if (variations) {
      try {
        variationsParsed = JSON.parse(variations);
      } catch (err) {
        console.error("Error parsing variations:", err);
      }
    }
    
    let imageUrl = null;
    const file = formData.get("foodImage");
    if (file && file.size > 0) {
      imageUrl = await processFileUpload(formData, "foodImage");
    }
    
    const foodItemData = {
      title,
      description,
      imageUrl,
      category,
      branch,
      variations: variationsParsed,
    };
    
    if (subcategory) {
      foodItemData.subcategory = subcategory;
    }
    
    if (!variationsParsed.length) {
      foodItemData.price = Number(price);
    }
    
    const foodItem = await FoodItem.create(foodItemData);
    
    return NextResponse.json(foodItem, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/fooditems:", err);
    return NextResponse.json(
      { message: "Internal server error", error: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const items = await FoodItem.find({})
      .populate("branch")
      .populate("category")
      .populate("subcategory");
    
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { message: "Failed to fetch items", error: error.message },
      { status: 500 }
    );
  }
}