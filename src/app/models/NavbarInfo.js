import mongoose from 'mongoose';

const SocialLinkSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  icon: { type: String, required: true },
  isMenu: { type: Boolean, default: false },
  url: { type: String },
  menuFile: { type: String }
});

const NavbarInfoSchema = new mongoose.Schema({
  restaurant: {
    name: { type: String, required: true, default: "MD Burger & Broast" },
    openingHours: { type: String, required: true, default: "05:00 PM to 3:00 AM" }
  },
  delivery: {
    time: { type: String, required: true, default: "30-45 mins" },
    minimumOrder: { type: String, required: true, default: "Rs. 500 Only" }
  },
  socialLinks: [SocialLinkSchema],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.NavbarInfo || mongoose.model('NavbarInfo', NavbarInfoSchema);