import connectDB from '@/app/lib/mongoose';
import DeliveryArea from '../../models/delivery-areas';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    
    let query = {};
    if (branchId) {
      query.branch = branchId;
    }
    
    const areas = await DeliveryArea.find(query).populate('branch', 'name').sort({ name: 1 });
    return NextResponse.json(areas);
  } catch (error) {
    console.error('Error fetching delivery areas:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, fee, branch, isActive = true } = await request.json();
    if (!name || typeof fee !== 'number' || fee < 0) {
      return NextResponse.json({ error: 'Invalid name or fee' }, { status: 400 });
    }
    
    if (!branch) {
      return NextResponse.json({ error: 'Branch is required' }, { status: 400 });
    }

    await connectDB();
    
    // Check if area already exists for this branch
    const existingArea = await DeliveryArea.findOne({ name, branch });
    if (existingArea) {
      return NextResponse.json({ error: 'Area already exists for this branch' }, { status: 400 });
    }

    const newArea = new DeliveryArea({ name, fee, branch, isActive });
    await newArea.save();
    
    // Populate branch before returning
    const populatedArea = await DeliveryArea.findById(newArea._id).populate('branch', 'name');
    
    return NextResponse.json(populatedArea);
  } catch (error) {
    console.error('Error adding delivery area:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { _id, name, fee, branch, isActive } = await request.json();
    if (!_id || !name || typeof fee !== 'number' || fee < 0) {
      return NextResponse.json({ error: 'Invalid _id, name, or fee' }, { status: 400 });
    }

    await connectDB();
    
    // Check if another area with the same name exists for this branch
    if (branch) {
      const existingArea = await DeliveryArea.findOne({ 
        name, 
        branch,
        _id: { $ne: _id } // Exclude current area being updated
      });
      if (existingArea) {
        return NextResponse.json({ error: 'Area with this name already exists for this branch' }, { status: 400 });
      }
    }
    
    const updateData = { name, fee, updatedAt: new Date() };
    
    if (branch) {
      updateData.branch = branch;
    }
    
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    
    const area = await DeliveryArea.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    ).populate('branch', 'name');
    
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