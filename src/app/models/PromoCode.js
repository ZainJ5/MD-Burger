import mongoose from "mongoose";

const PromoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.PromoCode ||
  mongoose.model("PromoCode", PromoCodeSchema);
