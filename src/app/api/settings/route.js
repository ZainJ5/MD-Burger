import { NextResponse } from "next/server";
import connectDB from "../../lib/mongoose";
import StoreSettings from "../../models/StoreSettings";

export async function GET() {
  try {
    await connectDB();
    
    let settings = await StoreSettings.findOne().lean();
    
    if (!settings) {
      settings = await StoreSettings.create({ isOrdersVisible: true });
    }
    
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { message: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    if (typeof body.isOrdersVisible !== 'boolean') {
      return NextResponse.json(
        { message: "isOrdersVisible must be a boolean" },
        { status: 400 }
      );
    }
    
    const settings = await StoreSettings.findOneAndUpdate(
      {}, 
      { 
        isOrdersVisible: body.isOrdersVisible,
        lastUpdated: new Date()
      },
      { 
        new: true, 
        upsert: true 
      }
    );
    
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { message: "Failed to update settings" },
      { status: 500 }
    );
  }
}