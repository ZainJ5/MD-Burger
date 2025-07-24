"use client";
import { useState } from "react";

export default function AddBranchForm({ addBranch }) {
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addBranch({ name });
    setName("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label htmlFor="branchName" className="text-sm font-medium">
        Branch Name
      </label>
      <input
        id="branchName"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter branch name"
        className="border border-gray-300 p-2 rounded text-sm focus:outline-none focus:ring focus:border-blue-500"
      />
      <button
        type="submit"
        className="bg-[#ba0000] text-white px-4 py-2 rounded hover:bg-[#cb3939] transition"
      >
        Add Branch
      </button>
    </form>
  );
}
