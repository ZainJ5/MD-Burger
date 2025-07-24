import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String }
});

const OrderSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    alternateMobile: { type: String },
    deliveryAddress: { type: String },
    nearestLandmark: { type: String },
    email: { type: String },
    paymentInstructions: { type: String },
    paymentMethod: { type: String, enum: ["cod", "online"], default: "cod" },
    bankName: { type: String }, 
    receiptImageUrl: { type: String }, 
    changeRequest: { type: String },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, required: true },
    total: { type: Number, required: true },
    promoCode: { type: String },
    isGift: { type: Boolean, default: false },
    giftMessage: { type: String },
    isCompleted: { type: Boolean, default: false },
    orderType: { type: String, enum: ["delivery", "pickup"], default: "delivery" },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
