import connectDB from '../../lib/mongoose'; 
import Order from '../../models/Order';

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const branchFilter = searchParams.get("branchFilter");

    const query = { status: { $in: ['Complete', 'Cancel'] } };
    if (from || to) {
      query.createdAt = {};
      if (from) {
        query.createdAt.$gte = new Date(`${from}+05:00`);
      }
      if (to) {
        query.createdAt.$lte = new Date(`${to}+05:00`);
      }
    }

    // Add branch filter if provided
    if (branchFilter && branchFilter !== "all") {
      query.branch = branchFilter;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('branch');

    return new Response(JSON.stringify(orders), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}