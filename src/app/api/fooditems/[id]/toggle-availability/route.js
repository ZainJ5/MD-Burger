import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import FoodItem from "@/app/models/FoodItem";

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    // FIX: Await params before using the ID
    const { id } = await params;

    const formData = await request.formData();
    const isAvailable = formData.get("isAvailable") === 'true';

    const updatedFoodItem = await FoodItem.findByIdAndUpdate(
      id,
      { isAvailable },
      { new: true }
    );

    if (!updatedFoodItem) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: `Item is now ${isAvailable ? "available" : "unavailable"}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling availability:", error);
    return NextResponse.json(
      { message: "Failed to toggle availability", error: error.message },
      { status: 500 }
    );
  }
}
