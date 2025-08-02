import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Subcategory from "@/app/models/Subcategory";
import FoodItem from "@/app/models/FoodItem";
import { unlink, writeFile, mkdir } from 'fs/promises';
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

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const formData = await request.formData();
    const name = formData.get("name");
    const image = formData.get("image");

    if (!name) {
      return NextResponse.json(
        { message: "Subcategory name is required" },
        { status: 400 }
      );
    }

    const currentSubcategory = await Subcategory.findById(id);
    if (!currentSubcategory) {
      return NextResponse.json(
        { message: "Subcategory not found" },
        { status: 404 }
      );
    }

    const updateData = { name };

    if (image && image.size > 0) {
      if (currentSubcategory.image) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', currentSubcategory.image.replace(/^\//, ''));
          await unlink(oldImagePath);
        } catch (fileError) {
          console.error("Error deleting old image:", fileError);
        }
      }

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const timestamp = Date.now();
      const filename = `subcategory-${id}-${timestamp}.${image.name.split('.').pop()}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'subcategories');
      
      try {
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
        updateData.image = `/uploads/subcategories/${filename}`;
      } catch (fileError) {
        return NextResponse.json(
          { message: "Error saving image file" },
          { status: 500 }
        );
      }
    }

    const updatedSubcategory = await Subcategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('category').populate('branch');

    return NextResponse.json(updatedSubcategory, { status: 200 });
  } catch (error) {
    console.error("Error updating subcategory:", error);
    return NextResponse.json(
      { message: "Failed to update subcategory" },
      { status: 500 }
    );
  }
}