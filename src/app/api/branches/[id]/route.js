import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Branch from "@/app/models/Branch";
import Category from "@/app/models/Category";
import Subcategory from "@/app/models/Subcategory";
import FoodItem from "@/app/models/FoodItem";

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const data = await request.json();

    // If setting this branch as default, unset all other branches
    if (data.isDefault === true) {
      await Branch.updateMany({}, { isDefault: false });
    }

    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );

    if (!updatedBranch) {
      return NextResponse.json({ message: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json(updatedBranch, { status: 200 });
  } catch (error) {
    console.error("Error updating branch:", error);
    return NextResponse.json({ message: "Failed to update branch" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const branch = await Branch.findById(id);
    if (!branch) {
      return NextResponse.json({ message: "Branch not found" }, { status: 404 });
    }

    const categories = await Category.find({ branch: id });
    for (const cat of categories) {
      const subs = await Subcategory.find({ category: cat._id });
      for (const sub of subs) {
        await FoodItem.deleteMany({ subcategory: sub._id });
      }
      await Subcategory.deleteMany({ category: cat._id });
    }
    await FoodItem.deleteMany({ branch: id });

    await Category.deleteMany({ branch: id });

    await Branch.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Branch and its related data deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting branch:", error);
    return NextResponse.json({ message: "Failed to delete branch" }, { status: 500 });
  }
}
