import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema({
  isOrdersVisible: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const StoreSettings = mongoose.models.StoreSettings || mongoose.model("StoreSettings", storeSettingsSchema);

export default StoreSettings;