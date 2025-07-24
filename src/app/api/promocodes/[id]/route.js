import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongoose";
import PromoCode from "@/app/models/PromoCode";

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const deletedPromo = await PromoCode.findByIdAndDelete(id);
    if (!deletedPromo) {
      return NextResponse.json(
        { error: "Promo code not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Promo code deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting promo code:", error);
    return NextResponse.json(
      { error: "Failed to delete promo code" },
      { status: 500 }
    );
  }
}
