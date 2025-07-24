import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import PromoCode from "@/app/models/PromoCode";

export async function GET(request) {
  try {
    await connectDB();
    const promoCodes = await PromoCode.find({});
    const promoCodesPlain = promoCodes.map((promo) =>
      promo.toObject({ getters: true })
    );
    return NextResponse.json(promoCodesPlain, { status: 200 });
  } catch (error) {
    console.error("Error fetching promo codes:", error);
    return NextResponse.json(
      { message: "Failed to fetch promo codes" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { code, discount } = body;
    if (!code || discount <= 0) {
      return NextResponse.json(
        { error: "Invalid promo code or discount" },
        { status: 400 }
      );
    }
    const newPromo = new PromoCode({ code, discount });
    const createdPromo = await newPromo.save();
    return NextResponse.json(
      createdPromo.toObject({ getters: true }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating promo code:", error);
    return NextResponse.json(
      { error: "Failed to create promo code" },
      { status: 500 }
    );
  }
}
