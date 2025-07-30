import mongoose from 'mongoose';

const LogoSchema = new mongoose.Schema({
  logo: { type: String, required: true, default: "/logo.png" },
}, { timestamps: true });

export default mongoose.models.Logo || mongoose.model('Logo', LogoSchema);