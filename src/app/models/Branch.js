import mongoose from "mongoose";

const BranchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Branch || mongoose.model("Branch", BranchSchema);
