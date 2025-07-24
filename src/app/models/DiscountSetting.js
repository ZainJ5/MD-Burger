import mongoose from "mongoose";

const DiscountSettingSchema = new mongoose.Schema({
  percentage: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100, 
    default: 10 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.models.DiscountSetting ||
  mongoose.model("DiscountSetting", DiscountSettingSchema);