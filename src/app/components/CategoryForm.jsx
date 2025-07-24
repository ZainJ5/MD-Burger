"use client";
import { useState } from "react";

export default function AddCategoryForm({ branches, addCategory }) {
  const [name, setName] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState(
    branches[0]?._id || ""
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !selectedBranchId) return;
    await addCategory({ name: name.trim(), branch: selectedBranchId });
    setName("");
    setSelectedBranchId("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium mb-1">Select Branch</label>
        <select
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">-- Select Branch --</option>
          {branches.map((branch) => (
            <option key={branch._id} value={branch._id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-medium mb-1">Category Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded p-2"
          placeholder="Enter category name"
        />
      </div>
      <button
        type="submit"
        className="bg-[#ba0000] text-white px-4 py-2 rounded hover:bg-[#cb3939] transition"
      >
        Add Category
      </button>
    </form>
  );
}
