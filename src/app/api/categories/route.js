import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Category from "@/app/models/Category";
import Branch from "@/app/models/Branch";

export async function GET(request) {
  try {
    await connectDB();
    const categories = await Category.find({}).populate("branch");

    const categoriesPlain = categories.map((cat) =>
      cat.toObject({ getters: true })
    );

    return NextResponse.json(categoriesPlain, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();

    const newCategory = await Category.create(data);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { message: "Failed to create category" },
      { status: 500 }
    );
  }
}
