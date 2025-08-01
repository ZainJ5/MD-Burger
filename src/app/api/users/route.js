import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Order from "@/app/models/Order";

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const orderCount = searchParams.get('orderCount') || 'all';
    
    const skip = (page - 1) * limit;
    
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
    
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Order.aggregate(countPipeline);
    const totalCount = countResult.length > 0 ? countResult[0].total : 0;
    
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    
    const users = await Order.aggregate(pipeline);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      users,
      totalCount,
      totalPages,
      currentPage: page
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60'
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}