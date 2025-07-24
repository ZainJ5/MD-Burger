import mongoose from "mongoose";

const VariationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const FoodItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: {
      type: Number,
      required: function () {
        return !this.variations || this.variations.length === 0;
      },
    },
    imageUrl: { type: String },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: false,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    variations: [VariationSchema],
  },
  { timestamps: true }
);

export default mongoose.models.FoodItem ||
  mongoose.model("FoodItem", FoodItemSchema);
