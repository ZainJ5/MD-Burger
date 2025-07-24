import mongoose from 'mongoose';

const siteStatusSchema = new mongoose.Schema({
  isSiteActive: {
    type: Boolean,
    default: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.SiteStatus || mongoose.model('SiteStatus', siteStatusSchema);