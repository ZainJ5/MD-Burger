import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Branch from "@/app/models/Branch";

export async function GET() {
  try {
    await connectDB();
    const branches = await Branch.find({});
    return NextResponse.json(branches, { status: 200 });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json({ message: "Failed to fetch branches" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const newBranch = await Branch.create(data);
    return NextResponse.json(newBranch, { status: 201 });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json({ message: "Failed to create branch" }, { status: 500 });
  }
}
