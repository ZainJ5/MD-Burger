import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Category from "@/app/models/Category";
import Subcategory from "@/app/models/Subcategory";
import FoodItem from "@/app/models/FoodItem";

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    const subcategories = await Subcategory.find({ category: id });

    for (const sub of subcategories) {
      await FoodItem.deleteMany({ subcategory: sub._id });
    }

    await Subcategory.deleteMany({ category: id });

    await Category.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Category, its subcategories, and items deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { message: "Failed to delete category" },
      { status: 500 }
    );
  }
}
