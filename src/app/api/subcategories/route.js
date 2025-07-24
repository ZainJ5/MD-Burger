import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Subcategory from "@/app/models/Subcategory";
import Branch from "@/app/models/Branch";

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
    const data = await request.json();

    const newSubcategory = await Subcategory.create(data);

    return NextResponse.json(newSubcategory, { status: 201 });
  } catch (error) {
    console.error("Error creating subcategory:", error);
    return NextResponse.json(
      { message: "Failed to create subcategory" },
      { status: 500 }
    );
  }
}
