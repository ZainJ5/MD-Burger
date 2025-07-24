import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import FoodItem from "@/app/models/FoodItem";
import Category from "@/app/models/Category";
import Subcategory from "@/app/models/Subcategory";
import Branch from "@/app/models/Branch";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/app/lib/firebase";

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
      try {        variationsParsed = JSON.parse(variations);
      } catch (err) {
        console.error("Error parsing variations:", err);
      }
    }

    let imageUrl = null;
    const file = formData.get("foodImage");
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const dateTime = Date.now();
      const fileName = `foodItems/${dateTime}-${file.name}`;
      const storageRef = ref(storage, fileName);
      const metadata = { contentType: file.type };

      await uploadBytes(storageRef, buffer, metadata);
      imageUrl = await getDownloadURL(storageRef);
    }

    const foodItemData = {
      title,
      description,
      imageUrl,
      category,
      branch,      variations: variationsParsed,
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
    await connectDB(); const items = await FoodItem.find({})
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