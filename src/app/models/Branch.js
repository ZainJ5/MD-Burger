import mongoose from "mongoose";

const BranchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Branch || mongoose.model("Branch", BranchSchema);
