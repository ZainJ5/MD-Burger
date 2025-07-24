import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Order from "@/app/models/Order";
import StoreSettings from "../../models/StoreSettings";

export async function GET(request) {
  try {
    await connectDB();
    
    const storeSettings = await StoreSettings.findOne().lean();
    
    if (!storeSettings || !storeSettings.isOrdersVisible) {
      return NextResponse.json({
        orders: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        message: "Error! message code 500 Orders are not avaible"
      }, { status: 500 });
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const dateFilter = searchParams.get('dateFilter') || 'all';
    const typeFilter = searchParams.get('typeFilter') || 'all';
    const customDate = searchParams.get('customDate') || '';
    
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filter.createdAt = { $gte: today, $lt: tomorrow };
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: yesterday, $lt: today };
    } else if (dateFilter === 'custom' && customDate) {
      const selectedDate = new Date(customDate);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.createdAt = { $gte: selectedDate, $lt: nextDay };
    }
    
    if (typeFilter === 'pickup') {
      filter.orderType = 'pickup';
    } else if (typeFilter === 'delivery') {
      filter.orderType = 'delivery';
    }

    const listFields = {
      fullName: 1, 
      mobileNumber: 1, 
      orderType: 1, 
      total: 1, 
      isCompleted: 1,
      createdAt: 1
    };
    
    const totalCount = await Order.countDocuments(filter);
    
    const orders = await Order.find(filter)
      .select(listFields)
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .lean(); 
    
    const totalPages = Math.ceil(totalCount / limit);
    
    const headers = {
      'Cache-Control': 'private, max-age=30' // Cache for 30 seconds
    };
    
    return NextResponse.json({
      orders,
      totalCount,
      totalPages,
      currentPage: page
    }, { 
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}