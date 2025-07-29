import mongoose from "mongoose";

if (mongoose.models.Category) {
  delete mongoose.models.Category;
}

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    image: { type: String, required: true } 
  },
  { timestamps: true }
);

export default mongoose.model("Category", CategorySchema);