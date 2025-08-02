import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoose";
import Order from "../../../models/Order";

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const orderCount = searchParams.get('orderCount') || 'all';
    
    const pipeline = [];
    
    const matchStage = {};
    if (search) {
      matchStage.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    
    pipeline.push({
      $group: {
        _id: "$mobileNumber", 
        fullName: { $first: "$fullName" },
        email: { $first: "$email" },
        mobileNumber: { $first: "$mobileNumber" },
        alternateMobile: { $first: "$alternateMobile" },
        deliveryAddress: { $first: "$deliveryAddress" },
        nearestLandmark: { $first: "$nearestLandmark" },
        orderCount: { $sum: 1 },
        lastOrderDate: { $max: "$createdAt" },
        totalSpent: { $sum: "$total" }
      }
    });
    
    if (orderCount === 'single') {
      pipeline.push({ $match: { orderCount: 1 } });
    } else if (orderCount === 'multiple') {
      pipeline.push({ $match: { orderCount: { $gt: 1 } } });
    }
    
    pipeline.push({ $sort: { lastOrderDate: -1 } });
    
    const users = await Order.aggregate(pipeline);
    
    return NextResponse.json({
      users
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Error downloading users:", error);
    return NextResponse.json(
      { message: "Failed to download users" },
      { status: 500 }
    );
  }
}