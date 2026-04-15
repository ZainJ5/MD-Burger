import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Order from "@/app/models/Order";
import Branch from "@/app/models/Branch"; // Fixed: Added Branch import

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    // --- FIX FOR NEXT.JS 15 ---
    const resolvedParams = await params; // Must await the object first
    const { id } = resolvedParams;
    // --------------------------

    const order = await Order.findById(id)
      .populate('branch', 'name location contactNumber')
      .lean();

    if (!order) {
      console.log("Order not found in DB");
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
    
    // --- FIX FOR NEXT.JS 15 ---
    const resolvedParams = await params;
    const { id } = resolvedParams;
    // --------------------------
    
    const updateData = await request.json();

    if (updateData.status === 'Cancel' && !updateData.cancelReason) {
      return NextResponse.json(
        { message: "Cancel reason is required when status is Cancel" },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.status === 'Complete') {
      return NextResponse.json(
        { message: "Completed orders cannot be modified" },
        { status: 400 }
      );
    }

    if (updateData.items) {
      order.items = updateData.items;
      delete updateData.items;
    }

    Object.keys(updateData).forEach(key => {
      order[key] = updateData[key];
    });

    await order.save();

    return NextResponse.json(order.toObject(), { status: 200 });
  } catch (error) {
    console.error("Error updating order:", error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({
        message: "Validation error",
        errors: error.errors
      }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    // --- FIX FOR NEXT.JS 15 ---
    const resolvedParams = await params;
    const { id } = resolvedParams;
    // --------------------------

    const exists = await Order.exists({ _id: id });

    if (!exists) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    await Order.deleteOne({ _id: id });

    return NextResponse.json({ message: "Order deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json({ message: "Failed to delete order" }, { status: 500 });
  }
}
