"use client";
import { useState, useEffect } from "react";

export default function AddSubcategoryForm({ branches, categories, addSubcategory }) {
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?._id || "");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (selectedBranchId) {
      const filtered = categories.filter((cat) => {
        return cat.branch === selectedBranchId || cat.branch?._id === selectedBranchId;
      });
      setFilteredCategories(filtered);
      setSelectedCategoryId("");
    } else {
      setFilteredCategories([]);
    }
  }, [selectedBranchId, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBranchId || !selectedCategoryId || !name.trim()) return;
    await addSubcategory({
      name: name.trim(),
      branch: selectedBranchId,
      category: selectedCategoryId,
    });
    setName("");
    setSelectedBranchId("");
    setSelectedCategoryId("");
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
        <label className="block font-medium mb-1">Select Category</label>
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="w-full border rounded p-2"
          disabled={!selectedBranchId}
        >
          <option value="">-- Select Category --</option>
          {filteredCategories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium mb-1">Subcategory Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded p-2"
          placeholder="Enter subcategory name"
        />
      </div>
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
      >
        Add Subcategory
      </button>
    </form>
  );
}
