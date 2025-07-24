import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import Order from "../../models/Order";

export async function GET() {
  try {
    await connectDB();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [
      totalSalesResult,
      last7DaysSalesResult,
      topItemsResult,
      topAreasResult,
      monthlySalesResult,
      weeklySalesResult,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { isCompleted: true } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
          },
        },
      ]),
      
      Order.aggregate([
        { 
          $match: { 
            isCompleted: true,
            createdAt: { $gte: sevenDaysAgo }
          } 
        },
        {
          $group: {
            _id: null,
            last7DaysSales: { $sum: "$total" },
          },
        },
      ]),

      Order.aggregate([
        { $match: { isCompleted: true } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.id",
            name: { $first: "$items.name" },
            quantitySold: { $sum: 1 },
            totalRevenue: { $sum: "$items.price" },
          },
        },
        { $sort: { quantitySold: -1 } },
        { $limit: 5 },
      ]),

      Order.aggregate([
        { $match: { isCompleted: true, orderType: "delivery" } },
        {
          $group: {
            _id: "$deliveryAddress",
            orderCount: { $sum: 1 },
            totalRevenue: { $sum: "$total" },
          },
        },
        {
          $project: {
            name: "$_id",
            orderCount: 1,
            totalRevenue: 1,
            _id: 0,
          },
        },
        { $sort: { orderCount: -1 } },
        { $limit: 5 },
      ]),

      Order.aggregate([
        { $match: { isCompleted: true } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: { $sum: "$total" },
          },
        },
        {
          $project: {
            month: {
              $concat: [
                { $toString: "$_id.year" },
                "-",
                {
                  $cond: {
                    if: { $lte: ["$_id.month", 9] },
                    then: { $concat: ["0", { $toString: "$_id.month" }] },
                    else: { $toString: "$_id.month" },
                  },
                },
              ],
            },
            total: 1,
            _id: 0,
          },
        },
        { $sort: { month: 1 } },
        { $limit: 12 },
      ]),

      Order.aggregate([
        { $match: { isCompleted: true } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              week: { $week: "$createdAt" }
            },
            total: { $sum: "$total" },
          },
        },
        {
          $project: {
            week: {
              $concat: [
                { $toString: "$_id.year" },
                "-W",
                {
                  $cond: {
                    if: { $lte: ["$_id.week", 9] },
                    then: { $concat: ["0", { $toString: "$_id.week" }] },
                    else: { $toString: "$_id.week" },
                  },
                },
              ],
            },
            total: 1,
            _id: 0,
          },
        },
        { $sort: { week: 1 } },
        { $limit: 10 },
      ]),
    ]);

    const stats = {
      totalSales: totalSalesResult[0]?.totalSales || 0,
      last7DaysSales: last7DaysSalesResult[0]?.last7DaysSales || 0,
      topItems: topItemsResult.map((item) => ({
        id: item._id,
        name: item.name,
        quantitySold: item.quantitySold,
        totalRevenue: item.totalRevenue,
      })),
      topAreas: topAreasResult,
      monthlySales: monthlySalesResult.slice().reverse(), // Ensure newest months appear first
      weeklySales: weeklySalesResult.slice().reverse(), // Ensure newest weeks appear first
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { message: "Failed to fetch statistics", error: error.message },
      { status: 500 }
    );
  }
}