import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Category from "@/app/models/Category";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

async function handleFormData(request) {
  const formData = await request.formData();
  const name = formData.get('name');
  const branch = formData.get('branch');
  const imageFile = formData.get('image');

  if (!name || !branch) {
    throw new Error("Name and branch are required fields");
  }

  if (!imageFile) {
    throw new Error("Image is required");
  }

  const uploadDir = path.join(process.cwd(), 'public', 'categories');
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    throw new Error("Error creating directory: " + error.message);
  }

  const fileExtension = imageFile.name.split('.').pop();
  const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
  const filePath = path.join(uploadDir, uniqueFilename);

  const buffer = Buffer.from(await imageFile.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    name,
    branch,
    image: `/categories/${uniqueFilename}`
  };
}

export async function GET(request) {
  try {
    await connectDB();
    const categories = await Category.find({}).populate("branch");

    const categoriesPlain = categories.map((cat) =>
      cat.toObject({ getters: true })
    );

    return NextResponse.json(categoriesPlain, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const categoryData = await handleFormData(request);
    
    const newCategory = await Category.create({
      name: categoryData.name,
      branch: categoryData.branch,
      image: categoryData.image
    });
    
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create category", error: error.message },
      { status: 500 }
    );
  }
}