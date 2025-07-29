import mongoose from 'mongoose';

const HeroSectionSchema = new mongoose.Schema({
  banners: [{ 
    type: String, 
    required: true 
  }],
  images: [{ 
    type: String, 
    required: true 
  }],
  settings: {
    bannerRotationSpeed: { type: Number, default: 3000 }, 
    imageRotationSpeed: { type: Number, default: 5000 }, 
  },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.HeroSection || mongoose.model('HeroSection', HeroSectionSchema);