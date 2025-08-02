import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Category from "@/app/models/Category";
import Subcategory from "@/app/models/Subcategory";
import FoodItem from "@/app/models/FoodItem";
import fs from 'fs/promises';
import path from 'path';
import { writeFile } from 'fs/promises';
import { join } from 'path';

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

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const formData = await request.formData();
    const name = formData.get("name");
    const image = formData.get("image");

    if (!name) {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 }
      );
    }

    const currentCategory = await Category.findById(id);
    if (!currentCategory) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    const updateData = { name };

    if (image && image.size > 0) {
      if (currentCategory.image) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', currentCategory.image.replace(/^\//, ''));
          await fs.unlink(oldImagePath);
        } catch (fileError) {
          console.error("Error deleting old image:", fileError);
        }
      }

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const timestamp = Date.now();
      const filename = `category-${id}-${timestamp}.${image.name.split('.').pop()}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'categories');
      
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, filename), buffer);
        updateData.image = `/uploads/categories/${filename}`;
      } catch (fileError) {
        return NextResponse.json(
          { message: "Error saving image file" },
          { status: 500 }
        );
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('branch');

    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { message: "Failed to update category" },
      { status: 500 }
    );
  }
}