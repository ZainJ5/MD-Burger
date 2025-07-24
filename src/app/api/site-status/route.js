import connectDB from '@/app/lib/mongoose';
import SiteStatus from '../../models/SiteStatus';
import { NextResponse } from 'next/server';

// GET: Fetch current site status
export async function GET() {
  try {
    await connectDB();
    const status = await SiteStatus.findOne();
    if (!status) {
      const newStatus = new SiteStatus({ isSiteActive: true });
      await newStatus.save();
      return NextResponse.json({ isSiteActive: true });
    }
    return NextResponse.json({ isSiteActive: status.isSiteActive });
  } catch (error) {
    console.error('Error fetching site status:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { isSiteActive } = await request.json();
    if (typeof isSiteActive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid isSiteActive value' }, { status: 400 });
    }

    await connectDB();
    const status = await SiteStatus.findOneAndUpdate(
      {},
      { isSiteActive, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ isSiteActive: status.isSiteActive });
  } catch (error) {
    console.error('Error updating site status:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}