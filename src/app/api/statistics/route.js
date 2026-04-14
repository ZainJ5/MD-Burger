import { NextResponse } from "next/server";
import connectDB from "../../lib/mongoose";
import Order from "../../models/Order"; 
import mongoose from "mongoose"; 

const offset = 5 * 60 * 60 * 1000; // PKT is UTC+5

function getDateFromPeriod(period) {
  const utcNow = new Date();
  const pktNow = new Date(utcNow.getTime() + offset);

  if (period === "1") {
    const pktStart = new Date(pktNow.getFullYear(), pktNow.getMonth(), pktNow.getDate());
    return new Date(pktStart.getTime() - offset);
  }
  if (period === "7") {
    return new Date(pktNow.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (period === "30") {
    return new Date(pktNow.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return null;
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period"); 
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const branchFilter = searchParams.get("branchFilter");

    let startDate;
    let endDate = new Date();

    if (from && to) {
      const tempStart = new Date(from + "Z");
      const tempEnd = new Date(to + "Z");
      if (isNaN(tempStart.getTime()) || isNaN(tempEnd.getTime())) {
        return NextResponse.json(
          { success: false, message: "Invalid from or to date format" },
          { status: 400 }
        );
      }
      startDate = new Date(tempStart.getTime() - offset);
      endDate = new Date(tempEnd.getTime() - offset);
    } else if (period) {
      startDate = getDateFromPeriod(period);
      if (!startDate) {
        return NextResponse.json(
          { success: false, message: "Invalid period. Use 1, 7, or 30" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Please provide either period or from/to dates" },
        { status: 400 }
      );
    }

    const query = { createdAt: { $gte: startDate } };
    if (from && to) {
      query.createdAt.$lte = endDate;
    }

    // Add branch filter if provided
    if (branchFilter && branchFilter !== "all") {
      query.branch = branchFilter;
    }

    const orders = await Order.find(query).lean();

    return NextResponse.json({
      success: true,
      period: period || "custom",
      count: orders.length,
      total: orders.reduce((acc, o) => acc + o.total, 0),
      orders,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const period = body.period;
    const from = body.from;
    const to = body.to;
    const branchFilter = body.branchFilter;

    let startDate;
    let endDate = new Date();

    if (from && to) {
      const tempStart = new Date(from + "Z");
      const tempEnd = new Date(to + "Z");
      if (isNaN(tempStart.getTime()) || isNaN(tempEnd.getTime())) {
        return NextResponse.json(
          { success: false, message: "Invalid from or to date format" },
          { status: 400 }
        );
      }
      startDate = new Date(tempStart.getTime() - offset);
      endDate = new Date(tempEnd.getTime() - offset);
    } else if (period) {
      startDate = getDateFromPeriod(period);
      if (!startDate) {
        return NextResponse.json(
          { success: false, message: "Invalid period. Use 1, 7, or 30" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Please provide either period or from/to dates" },
        { status: 400 }
      );
    }

    const query = { createdAt: { $gte: startDate } };
    if (from && to) {
      query.createdAt.$lte = endDate;
    }

    // Add branch filter if provided
    if (branchFilter && branchFilter !== "all") {
      query.branch = branchFilter;
    }

    const orders = await Order.find(query).lean();

    return NextResponse.json({
      success: true,
      period: period || "custom",
      count: orders.length,
      total: orders.reduce((acc, o) => acc + o.total, 0),
      orders,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}