import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import FoodItem from "@/app/models/FoodItem";
import Subcategory from "@/app/models/Subcategory";
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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

function deleteImageFile(imageUrl) {
  if (!imageUrl) return;
  
  try {
    const filename = imageUrl.split('/').pop();
    const filepath = path.join(process.cwd(), 'public/food-items', filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`Deleted file: ${filepath}`);
    }
  } catch (error) {
    console.error(`Error deleting image file: ${error}`);
  }
}

export async function DELETE(request, context) {
  try {
    await connectDB();
    const { id } = context.params;
    const foodItem = await FoodItem.findById(id);
    
    if (!foodItem) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }
    
    if (foodItem.imageUrl) {
      deleteImageFile(foodItem.imageUrl);
    }
    
    await FoodItem.findByIdAndDelete(id);
    return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ message: "Failed to delete item" }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  try {
    await connectDB();
    
    const { id } = context.params;
    const formData = await request.formData();
    
    const title = formData.get("title");
    const description = formData.get("description");
    const price = formData.get("price");
    const category = formData.get("category");
    const subcategory = formData.get("subcategory");
    const branch = formData.get("branch");
    
    if (category) {
      const subcategoriesCount = await Subcategory.countDocuments({ category });
      
      if (subcategoriesCount > 0 && (!subcategory || subcategory === "")) {
        return NextResponse.json(
          { message: "Subcategory is required for this category" },
          { status: 400 }
        );
      }
    }
    
    let variationsParsed = [];
    const variations = formData.get("variations");
    if (variations) {
      try {
        variationsParsed = JSON.parse(variations);
      } catch (err) {
        console.error("Error parsing variations:", err);
      }
    }
    
    let imageUrl;
    const file = formData.get("foodImage");
    if (file && file.size > 0) {
      const existingItem = await FoodItem.findById(id);
      if (existingItem && existingItem.imageUrl) {
        deleteImageFile(existingItem.imageUrl);
      }
      
      imageUrl = await processFileUpload(formData, "foodImage");
    }
    
    const updateData = {
      title,
      description,
      category,
      branch,
      variations: variationsParsed,
    };
    
    if (subcategory && subcategory !== "") {
      updateData.subcategory = subcategory;
    } else {
      updateData.subcategory = null;
    }
    
    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }
    
    if (!variationsParsed.length) {
      updateData.price = Number(price);
    }
    
    const updatedFoodItem = await FoodItem.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    
    if (!updatedFoodItem) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }
    
    return NextResponse.json(updatedFoodItem, { status: 200 });
  } catch (error) {
    console.error("Error updating food item:", error);
    return NextResponse.json(
      { message: "Failed to update item", error: error.message },
      { status: 500 }
    );
  }
}