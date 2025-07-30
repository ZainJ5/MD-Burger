"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function BranchManager() {
  const [name, setName] = useState("");
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/branches");
      if (!response.ok) throw new Error("Failed to fetch branches");
      const data = await response.json();
      setBranches(data);
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  };

  const addBranch = async () => {
    if (!name.trim()) {
      toast.warning("Please enter a branch name");
      return;
    }
    
    try {
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error("Failed to add branch");
      
      await fetchBranches();
      setName("");
      toast.success("Branch added successfully");
    } catch (error) {
      console.error("Error adding branch:", error);
      toast.error("Failed to add branch");
    }
  };

  const confirmDelete = (branch) => {
    setDeleteConfirmation(branch);
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const deleteBranch = async (id) => {
    try {
      const response = await fetch(`/api/branches/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete branch");
      
      await fetchBranches();
      toast.success("Branch and all associated data deleted successfully");
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast.error("Failed to delete branch");
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addBranch();
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Branch Management</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-medium mb-4">Add New Branch</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="branchName" className="text-sm font-medium">
              Branch Name
            </label>
            <input
              id="branchName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter branch name"
              className="w-full border border-gray-300 p-2 rounded text-sm focus:outline-none focus:ring focus:border-blue-500 mt-1"
            />
          </div>
          <button
            type="submit"
            className="bg-[#ba0000] text-white px-4 py-2 rounded hover:bg-[#cb3939] transition"
          >
            Add Branch
          </button>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-4">All Branches</h3>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ba0000]"></div>
          </div>
        ) : branches.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No branches found. Add your first branch above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {branches.map((branch) => (
                  <tr key={branch._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => confirmDelete(branch)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h4 className="text-lg font-medium mb-4">Confirm Deletion</h4>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the branch <span className="font-bold">{deleteConfirmation.name}</span>? 
              This will permanently delete all categories, subcategories, and food items associated with this branch.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteBranch(deleteConfirmation._id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}