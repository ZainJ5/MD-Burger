import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Subcategory from "@/app/models/Subcategory";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

async function handleFormData(request) {
  const formData = await request.formData();
  const name = formData.get('name');
  const branch = formData.get('branch');
  const category = formData.get('category');
  const imageFile = formData.get('image');

  if (!imageFile || !name || !branch || !category) {
    throw new Error("Missing required fields");
  }

  const uploadDir = path.join(process.cwd(), 'public', 'subcategories');
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Error creating directory:", error);
  }

  const fileExtension = imageFile.name.split('.').pop();
  const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
  const filePath = path.join(uploadDir, uniqueFilename);

  const buffer = Buffer.from(await imageFile.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    name,
    branch,
    category,
    image: `/subcategories/${uniqueFilename}` 
  };
}

export async function GET(request) {
  try {
    await connectDB();
    const subcategories = await Subcategory.find({})
      .populate("category")
      .populate("branch");

    const subcategoriesPlain = subcategories.map((sub) =>
      sub.toObject({ getters: true })
    );

    return NextResponse.json(subcategoriesPlain, { status: 200 });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return NextResponse.json(
      { message: "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const contentType = request.headers.get("content-type") || "";
    
    let subcategoryData;
    if (contentType.includes("multipart/form-data")) {
      subcategoryData = await handleFormData(request);
    } else {
      subcategoryData = await request.json();
    }

    const newSubcategory = await Subcategory.create(subcategoryData);
    return NextResponse.json(newSubcategory, { status: 201 });
  } catch (error) {
    console.error("Error creating subcategory:", error);
    return NextResponse.json(
      { message: "Failed to create subcategory", error: error.message },
      { status: 500 }
    );
  }
}