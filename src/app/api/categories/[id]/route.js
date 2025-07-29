import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Category from "@/app/models/Category";
import Subcategory from "@/app/models/Subcategory";
import FoodItem from "@/app/models/FoodItem";
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    if (category.image) {
      try {
        const fullPath = path.join(process.cwd(), 'public', category.image.replace(/^\//, ''));
        await fs.unlink(fullPath);
      } catch (fileError) {
      }
    }

    const subcategories = await Subcategory.find({ category: id });

    for (const sub of subcategories) {
      if (sub.image) {
        try {
          const subImagePath = path.join(process.cwd(), 'public', sub.image.replace(/^\//, ''));
          await fs.unlink(subImagePath);
        } catch (fileError) {
        }
      }
      
      await FoodItem.deleteMany({ subcategory: sub._id });
    }

    await Subcategory.deleteMany({ category: id });

    await Category.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Category, its subcategories, and items deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete category" },
      { status: 500 }
    );
  }
}