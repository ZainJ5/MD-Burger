import mongoose from 'mongoose';

const deliveryPickupSchema = new mongoose.Schema(
  {
    allowDelivery: {
      type: Boolean,
      default: true,
    },
    allowPickup: {
      type: Boolean,
      default: true,
    },
    defaultOption: {
      type: String,
      enum: ['delivery', 'pickup', 'none'],
      default: 'none',
    },
    deliveryMessage: {
      type: String,
      default: 'Get your food delivered to your doorstep',
    },
    pickupMessage: {
      type: String,
      default: 'Pick up your order at our restaurant',
    },
    defaultBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
  },
  { timestamps: true }
);

deliveryPickupSchema.statics.getSettings = async function() {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }
  
  return this.create({
    allowDelivery: true,
    allowPickup: true,
    defaultOption: 'none',
  });
};

export default mongoose.models.DeliveryPickup || 
  mongoose.model('DeliveryPickup', deliveryPickupSchema);