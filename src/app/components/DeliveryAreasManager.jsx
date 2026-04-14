"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";

export default function DeliveryAreasManager() {
  const [areas, setAreas] = useState([]);
  const [branches, setBranches] = useState([]);
  const [name, setName] = useState("");
  const [fee, setFee] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editName, setEditName] = useState("");
  const [editFee, setEditFee] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editingArea, setEditingArea] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
    fetchAreas();
  }, []);

  useEffect(() => {
    fetchAreas();
  }, [filterBranch]);

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      } else {
        toast.error("Failed to fetch branches");
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Error fetching branches");
    }
  };

  const fetchAreas = async () => {
    setIsLoading(true);
    try {
      const url = filterBranch 
        ? `/api/delivery-areas?branchId=${filterBranch}`
        : "/api/delivery-areas";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAreas(data);
      } else {
        toast.error("Failed to fetch delivery areas");
      }
    } catch (error) {
      console.error("Error fetching delivery areas:", error);
      toast.error("Error fetching delivery areas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isNaN(fee) || Number(fee) < 0) {
      toast.error("Please enter a valid name and fee");
      return;
    }
    
    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }

    setIsLoading(true);
    try {
      const url = "/api/delivery-areas";
      const method = "POST";
      const body = JSON.stringify({ 
        name, 
        fee: Number(fee), 
        branch: selectedBranch,
        isActive 
      });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        toast.success(`Delivery area added successfully`);
        setName("");
        setFee("");
        setSelectedBranch("");
        setIsActive(true);
        fetchAreas();
      } else {
        const data = await res.json();
        toast.error(data.error || `Failed to add delivery area`);
      }
    } catch (error) {
      console.error(`Error adding delivery area:`, error);
      toast.error(`Error adding delivery area`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editName.trim() || isNaN(editFee) || Number(editFee) < 0) {
      toast.error("Please enter a valid name and fee");
      return;
    }
    
    if (!editBranch) {
      toast.error("Please select a branch");
      return;
    }

    setIsLoading(true);
    try {
      const url = "/api/delivery-areas";
      const method = "PUT";
      const body = JSON.stringify({ 
        _id: editingArea._id, 
        name: editName, 
        fee: Number(editFee), 
        branch: editBranch,
        isActive: editIsActive 
      });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        toast.success(`Delivery area updated successfully`);
        setIsModalOpen(false);
        setEditingArea(null);
        fetchAreas();
      } else {
        const data = await res.json();
        toast.error(data.error || `Failed to update delivery area`);
      }
    } catch (error) {
      console.error(`Error updating delivery area:`, error);
      toast.error(`Error updating delivery area`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this delivery area?")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/delivery-areas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: id }),
      });

      if (res.ok) {
        toast.success("Delivery area deleted successfully");
        fetchAreas();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete delivery area");
      }
    } catch (error) {
      console.error("Error deleting delivery area:", error);
      toast.error("Error deleting delivery area");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (area) => {
    setEditingArea(area);
    setEditName(area.name);
    setEditFee(area.fee.toString());
    setEditBranch(area.branch?._id || area.branch);
    setEditIsActive(area.isActive !== false); 
    setIsModalOpen(true);
  };

  const handleToggleActive = async (area) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/delivery-areas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          _id: area._id, 
          name: area.name, 
          fee: area.fee,
          branch: area.branch?._id || area.branch,
          isActive: !area.isActive 
        }),
      });

      if (res.ok) {
        toast.success(`Delivery area ${!area.isActive ? "activated" : "deactivated"} successfully`);
        fetchAreas();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update delivery area status");
      }
    } catch (error) {
      console.error("Error updating delivery area status:", error);
      toast.error("Error updating delivery area status");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsModalOpen(false);
    setEditingArea(null);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Manage Delivery Areas</h3>
      
      {/* Filter by Branch */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Branch</label>
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
        >
          <option value="">All Branches</option>
          {branches.map((branch) => (
            <option key={branch._id} value={branch._id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">
          Add New Delivery Area
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch <span className="text-red-500">*</span></label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              required
            >
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder="Enter area name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (Rs.)</label>
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder="Enter delivery fee"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex items-center mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-red-600"
                />
                <span className="ml-2 text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </div>
        <div className="mt-6 flex space-x-4">
          <button
            type="submit"
            className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Add Area"}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="p-4 text-lg font-semibold border-b">Existing Delivery Areas</h2>
        {isLoading && areas.length === 0 ? (
          <div className="p-4 text-center">Loading...</div>
        ) : areas.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No delivery areas found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Branch</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Fee</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area) => (
                  <tr key={area._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {area.branch?.name || <span className="text-red-500 text-xs">No Branch</span>}
                    </td>
                    <td className="px-4 py-3">{area.name}</td>
                    <td className="px-4 py-3">Rs. {area.fee}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          area.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {area.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(area)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Edit"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(area._id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete"
                        >
                          <FaTrash size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(area)}
                          className={`${area.isActive ? "text-green-500 hover:text-green-700" : "text-gray-400 hover:text-gray-600"}`}
                          title={area.isActive ? "Deactivate" : "Activate"}
                        >
                          {area.isActive ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <h2 className="text-lg font-semibold mb-4">Edit Delivery Area</h2>
            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch <span className="text-red-500">*</span></label>
                  <select
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Enter area name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (Rs.)</label>
                  <input
                    type="number"
                    value={editFee}
                    onChange={(e) => setEditFee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Enter delivery fee"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex items-center mt-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        className="form-checkbox h-5 w-5 text-red-600"
                      />
                      <span className="ml-2 text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex space-x-4">
                <button
                  type="submit"
                  className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Update Area"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}