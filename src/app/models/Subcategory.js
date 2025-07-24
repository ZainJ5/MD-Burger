import mongoose from "mongoose";

const SubcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Subcategory ||
  mongoose.model("Subcategory", SubcategorySchema);
