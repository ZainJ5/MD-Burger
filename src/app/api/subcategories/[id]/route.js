import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Subcategory from "@/app/models/Subcategory";
import FoodItem from "@/app/models/FoodItem";
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const subcategory = await Subcategory.findById(id);
    if (!subcategory) {
      return NextResponse.json({ message: "Subcategory not found" }, { status: 404 });
    }

    if (subcategory.image) {
      try {
        const imagePath = path.join(process.cwd(), 'public', subcategory.image);
        await unlink(imagePath);
      } catch (fileError) {
        console.error("Error deleting subcategory image file:", fileError);
      }
    }

    await FoodItem.deleteMany({ subcategory: id });
    
    await Subcategory.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Subcategory and its items deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete subcategory" },
      { status: 500 }
    );
  }
}