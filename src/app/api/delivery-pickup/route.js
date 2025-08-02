import connectDB from '../../lib/mongoose';
import DeliveryPickup from '../../models/deliveryPickUp';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    const settings = await DeliveryPickup.getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching delivery-pickup settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery-pickup settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    await connectDB();
    
    if (typeof data.allowDelivery !== 'boolean' || typeof data.allowPickup !== 'boolean') {
      return NextResponse.json(
        { error: 'allowDelivery and allowPickup must be boolean values' },
        { status: 400 }
      );
    }
    
    if (!data.allowDelivery && !data.allowPickup) {
      return NextResponse.json(
        { error: 'At least one order option (delivery or pickup) must be enabled' },
        { status: 400 }
      );
    }

    const settings = await DeliveryPickup.findOneAndUpdate(
      {}, 
      {
        allowDelivery: data.allowDelivery,
        allowPickup: data.allowPickup,
        defaultOption: data.defaultOption || 'none',
        deliveryMessage: data.deliveryMessage,
        pickupMessage: data.pickupMessage,
        defaultBranchId: data.defaultBranchId || null
      },
      { 
        new: true,  
        upsert: true 
      }
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating delivery-pickup settings:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery-pickup settings' },
      { status: 500 }
    );
  }
}