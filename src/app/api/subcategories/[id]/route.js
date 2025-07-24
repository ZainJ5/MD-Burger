import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Subcategory from "@/app/models/Subcategory";
import FoodItem from "@/app/models/FoodItem";

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const subcategory = await Subcategory.findById(id);
    if (!subcategory) {
      return NextResponse.json({ message: "Subcategory not found" }, { status: 404 });
    }

    await FoodItem.deleteMany({ subcategory: id });
    await Subcategory.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Subcategory and its items deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    return NextResponse.json(
      { message: "Failed to delete subcategory" },
      { status: 500 }
    );
  }
}
