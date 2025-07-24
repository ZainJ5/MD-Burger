import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import DiscountSetting from "@/app/models/DiscountSetting";

export async function GET(request) {
  try {
    await connectDB();
    let discountSetting = await DiscountSetting.findOne({});
    
    if (!discountSetting) {
      discountSetting = await DiscountSetting.create({
        percentage: 10,
        isActive: true
      });
    }
    
    return NextResponse.json(discountSetting, { status: 200 });
  } catch (error) {
    console.error("Error fetching discount setting:", error);
    return NextResponse.json(
      { message: "Failed to fetch discount setting" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { percentage, isActive } = body;
    
    if (percentage === undefined || isActive === undefined) {
      return NextResponse.json(
        { error: "Percentage and isActive fields are required" },
        { status: 400 }
      );
    }
    
    if (percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { error: "Percentage must be between 0 and 100" },
        { status: 400 }
      );
    }
    
    let discountSetting = await DiscountSetting.findOne({});
    
    if (!discountSetting) {
      discountSetting = new DiscountSetting({ percentage, isActive });
    } else {
      discountSetting.percentage = percentage;
      discountSetting.isActive = isActive;
      discountSetting.updatedAt = Date.now();
    }
    
    await discountSetting.save();
    
    return NextResponse.json(discountSetting, { status: 200 });
  } catch (error) {
    console.error("Error updating discount setting:", error);
    return NextResponse.json(
      { error: "Failed to update discount setting" },
      { status: 500 }
    );
  }
}