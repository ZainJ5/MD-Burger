import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import FoodItem from "@/app/models/FoodItem";
import Category from "@/app/models/Category";
import Subcategory from "@/app/models/Subcategory";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/app/lib/firebase";

export async function DELETE(request, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    const foodItem = await FoodItem.findById(id);
    if (!foodItem) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }
    await FoodItem.findByIdAndDelete(id);
    return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ message: "Failed to delete item" }, { status: 500 });
  }
}


export async function PATCH(request, context) { try {
    await connectDB();

    const params = await context.params;
    const { id } = params;

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
    }    let variationsParsed = [];
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
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const dateTime = Date.now();
      const fileName = `foodItems/${dateTime}-${file.name}`;
      const storageRef = ref(storage, fileName);
      const metadata = { contentType: file.type };

      await uploadBytes(storageRef, buffer, metadata);
      imageUrl = await getDownloadURL(storageRef);
    }

    const updateData = {
      title,      description,
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
      return NextResponse.json({ message: "Item not found" }, { status: 404 });    }

    return NextResponse.json(updatedFoodItem, { status: 200 });
  } catch (error) {
    console.error("Error updating food item:", error);
    return NextResponse.json(
      { message: "Failed to update item", error: error.message },
      { status: 500 }
    );
  }
}
