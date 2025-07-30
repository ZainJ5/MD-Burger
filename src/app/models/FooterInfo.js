import mongoose from 'mongoose';

const FooterInfoSchema = new mongoose.Schema({
  restaurant: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String, required: true },
    establishedYear: { type: Number, default: 1993 },
    mapsLink: { type: String, required: true }
  },
  contact: {
    uanNumber: { type: String, required: true },
    whatsappNumbers: [{ type: String, required: true }],
    openingHours: { type: String, required: true }
  },
  appLinks: {
    appStore: { type: String, required: true },
    googlePlay: { type: String, required: true }
  },
  developer: {
    name: { type: String },
    contact: { type: String }
  },
  sliderImages: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.FooterInfo || mongoose.model('FooterInfo', FooterInfoSchema);