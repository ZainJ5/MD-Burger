import connectDB from '@/app/lib/mongoose';
import DeliveryArea from '../../models/delivery-areas';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    const areas = await DeliveryArea.find().sort({ name: 1 });
    return NextResponse.json(areas);
  } catch (error) {
    console.error('Error fetching delivery areas:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, fee, isActive = true } = await request.json();
    if (!name || typeof fee !== 'number' || fee < 0) {
      return NextResponse.json({ error: 'Invalid name or fee' }, { status: 400 });
    }

    await connectDB();
    const existingArea = await DeliveryArea.findOne({ name });
    if (existingArea) {
      return NextResponse.json({ error: 'Area already exists' }, { status: 400 });
    }

    const newArea = new DeliveryArea({ name, fee, isActive });
    await newArea.save();
    return NextResponse.json(newArea);
  } catch (error) {
    console.error('Error adding delivery area:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { _id, name, fee, isActive } = await request.json();
    if (!_id || !name || typeof fee !== 'number' || fee < 0) {
      return NextResponse.json({ error: 'Invalid _id, name, or fee' }, { status: 400 });
    }

    await connectDB();
    const updateData = { name, fee, updatedAt: new Date() };
    
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    
    const area = await DeliveryArea.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!area) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 });
    }
    return NextResponse.json(area);
  } catch (error) {
    console.error('Error updating delivery area:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { _id } = await request.json();
    if (!_id) {
      return NextResponse.json({ error: 'Invalid _id' }, { status: 400 });
    }

    await connectDB();
    const area = await DeliveryArea.findByIdAndDelete(_id);
    if (!area) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Area deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery area:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}