import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Order from "@/app/models/Order";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;    
    
    const order = await Order.findById(id).lean();
    
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }
    
    return NextResponse.json(order, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60' 
      }
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ message: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;    
    const { isCompleted } = await request.json(); 
    
    const order = await Order.findByIdAndUpdate(
      id, 
      { isCompleted }, 
      { new: true }
    ).lean();
    
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }
    
    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ message: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    const exists = await Order.exists({ _id: id });
    
    if (!exists) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }
    
    await Order.deleteOne({ _id: id });
    
    return NextResponse.json(
      { message: "Order deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { message: "Failed to delete order" },
      { status: 500 }
    );
  }
}