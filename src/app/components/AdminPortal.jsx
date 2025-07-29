"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import AddBranchForm from "./AddBranchForm";
import AddCategoryForm from "./CategoryForm";
import AddSubcategoryForm from "./SubcategoryForm";
import AddFoodItemForm from "./FoodItemForm";
import OrderList from "./OrderList";
import FoodItemList from "./FoodItemList";
import CategoryList from "./CategoryList";
import SubcategoryList from "./SubcategoryList";
import PromoCodesManager from "./PromoCodesManager";
import Statistics from "./Statistics";
import SettingsPopup from "./SettingsPupup";

const ConfirmationDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-auto shadow-xl">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{message}</h3>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

export default function AdminPortal() {
  const [selectedTab, setSelectedTab] = useState("branch");
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [siteStatus, setSiteStatus] = useState(true);
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaFee, setNewAreaFee] = useState("");
  const [editingArea, setEditingArea] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    fetchBranches();
    fetchCategories();
    fetchSubcategories();
    fetchFoodItems();
    fetchSiteStatus();
    fetchDeliveryAreas();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setBranches(data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const res = await fetch("/api/subcategories");
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setSubcategories(data);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const fetchFoodItems = async () => {
    try {
      const res = await fetch("/api/fooditems");
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setFoodItems(data);
    } catch (error) {
      console.error("Error fetching food items:", error);
    }
  };

  const fetchSiteStatus = async () => {
    try {
      const res = await fetch("/api/site-status");
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setSiteStatus(data.isSiteActive);
    } catch (error) {
      console.error("Error fetching site status:", error);
    }
  };

  const fetchDeliveryAreas = async () => {
    try {
      const res = await fetch("/api/delivery-areas");
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setDeliveryAreas(data);
    } catch (error) {
      console.error("Error fetching delivery areas:", error);
    }
  };

  const handleToggleSiteStatus = () => {
    setShowConfirmation(true);
  };

  const toggleSiteStatus = async () => {
    try {
      const newStatus = !siteStatus;
      const res = await fetch("/api/site-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isSiteActive: newStatus }),
      });
      if (res.ok) {
        setSiteStatus(newStatus);
      } else {
        console.error("Failed to update site status");
      }
    } catch (error) {
      console.error("Error updating site status:", error);
    } finally {
      setShowConfirmation(false);
    }
  };

  const addBranch = async (newBranch) => {
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBranch),
      });
      if (res.ok) {
        const createdBranch = await res.json();
        setBranches((prev) => [...prev, createdBranch]);
      } else {
        console.error("Failed to add branch");
      }
    } catch (error) {
      console.error("Error adding branch:", error);
    }
  };

  const addCategory = async (formData) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        body: formData, 
      });
      
      if (res.ok) {
        const createdCategory = await res.json();
        setCategories((prev) => [...prev, createdCategory]);
      } else {
        console.error("Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const addSubcategory = async (formData) => {
    try {
      const res = await fetch("/api/subcategories", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const createdSubcategory = await res.json();
        setSubcategories((prev) => [...prev, createdSubcategory]);
      } else {
        console.error("Failed to add subcategory");
      }
    } catch (error) {
      console.error("Error adding subcategory:", error);
    }
  };

  const addFoodItem = async (formData) => {
    try {
      const res = await fetch("/api/fooditems", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const createdFoodItem = await res.json();
        setFoodItems((prev) => [...prev, createdFoodItem]);
      } else {
        console.error("Failed to add food item");
      }
    } catch (error) {
      console.error("Error adding food item:", error);
    }
  };

  const addDeliveryArea = async (e) => {
    e.preventDefault();
    if (!newAreaName.trim() || !newAreaFee || newAreaFee < 0) {
      alert("Please enter a valid area name and fee.");
      return;
    }
    try {
      const res = await fetch("/api/delivery-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAreaName.trim(), fee: Number(newAreaFee) }),
      });
      if (res.ok) {
        const newArea = await res.json();
        setDeliveryAreas((prev) => [...prev, newArea]);
        setNewAreaName("");
        setNewAreaFee("");
        alert("Delivery area added successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add delivery area.");
      }
    } catch (error) {
      console.error("Error adding delivery area:", error);
      alert("Error adding delivery area.");
    }
  };

  const updateDeliveryArea = async (e) => {
    e.preventDefault();
    if (!editingArea.name.trim() || !editingArea.fee || editingArea.fee < 0) {
      alert("Please enter a valid area name and fee.");
      return;
    }
    try {
      const res = await fetch("/api/delivery-areas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: editingArea._id,
          name: editingArea.name.trim(),
          fee: Number(editingArea.fee),
        }),
      });
      if (res.ok) {
        const updatedArea = await res.json();
        setDeliveryAreas((prev) =>
          prev.map((area) => (area._id === updatedArea._id ? updatedArea : area))
        );
        setEditingArea(null);
        alert("Delivery area updated successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update delivery area.");
      }
    } catch (error) {
      console.error("Error updating delivery area:", error);
      alert("Error updating delivery area.");
    }
  };

  const deleteDeliveryArea = async (areaId) => {
    if (!confirm("Are you sure you want to delete this delivery area?")) return;
    try {
      const res = await fetch("/api/delivery-areas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: areaId }),
      });
      if (res.ok) {
        setDeliveryAreas((prev) => prev.filter((area) => area._id !== areaId));
        alert("Delivery area deleted successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete delivery area.");
      }
    } catch (error) {
      console.error("Error deleting delivery area:", error);
      alert("Error deleting delivery area.");
    }
  };

  const renderContent = () => {
    switch (selectedTab) {
      case "branch":
        return <AddBranchForm addBranch={addBranch} />;
      case "category":
        return <AddCategoryForm branches={branches} addCategory={addCategory} />;
      case "subcategory":
        return (
          <AddSubcategoryForm
            branches={branches}
            categories={categories}
            addSubcategory={addSubcategory}
          />
        );
      case "foodItem":
        return (
          <AddFoodItemForm
            branches={branches}
            categories={categories}
            subcategories={subcategories}
            addFoodItem={addFoodItem}
          />
        );
      case "orders":
        return <OrderList />;
      case "items":
        return <FoodItemList />;
      case "allCategories":
        return <CategoryList />;
      case "allSubcategories":
        return <SubcategoryList />;
      case "discountSettings":
        return <PromoCodesManager />;
      case "deliveryAreas":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Manage Delivery Areas</h3>
            <form onSubmit={editingArea ? updateDeliveryArea : addDeliveryArea} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Area Name</label>
                <input
                  type="text"
                  value={editingArea ? editingArea.name : newAreaName}
                  onChange={(e) =>
                    editingArea
                      ? setEditingArea({ ...editingArea, name: e.target.value })
                      : setNewAreaName(e.target.value)
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="Enter area name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Fee (Rs.)</label>
                <input
                  type="number"
                  value={editingArea ? editingArea.fee : newAreaFee}
                  onChange={(e) =>
                    editingArea
                      ? setEditingArea({ ...editingArea, fee: e.target.value })
                      : setNewAreaFee(e.target.value)
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="Enter delivery fee"
                  min="0"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-md hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                  {editingArea ? "Update Area" : "Add Area"}
                </button>
                {editingArea && (
                  <button
                    type="button"
                    onClick={() => setEditingArea(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <div>
              <h4 className="text-md font-semibold mb-2">Existing Delivery Areas</h4>
              {deliveryAreas.length === 0 ? (
                <p className="text-gray-500">No delivery areas added yet.</p>
              ) : (
                <ul className="space-y-2 divide-y divide-gray-100">
                  {deliveryAreas.map((area) => (
                    <li
                      key={area._id}
                      className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-md transition-colors duration-200"
                    >
                      <span className="font-medium">
                        {area.name} <span className="text-gray-500 text-sm ml-2">(Rs. {area.fee})</span>
                      </span>
                      <div className="space-x-2">
                        <button
                          onClick={() => setEditingArea(area)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteDeliveryArea(area._id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      case "statistics":
        return <Statistics />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen text-black bg-gradient-to-br from-gray-50 to-gray-200 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row h-[92vh]">
        <div 
          className="hidden md:flex md:flex-col md:w-1/4 bg-gradient-to-br from-[#ba0000] to-[#930000] text-white p-6" 
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none', 
          }}
        >
          <div className="flex-shrink-0">
            <div className="flex justify-center mb-8">
              <Image 
                src="/logo.png" 
                alt="Tipu Restaurant Logo" 
                width={120} 
                height={120} 
                className="object-contain drop-shadow-md"
              />
            </div>
            <h2 className="text-xl font-semibold mb-6 text-center text-white">Admin Dashboard</h2>
            
            <button
              onClick={handleToggleSiteStatus}
              className={`w-full text-left px-4 py-3 mb-8 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-between ${
                siteStatus 
                  ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg" 
                  : "bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 shadow-lg"
              }`}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {siteStatus ? "Site is Online" : "Site is Offline"}
              </span>
              <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                {siteStatus ? "ON" : "OFF"}
              </span>
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <ul className="space-y-1.5">
              {["branch", "category", "subcategory", "foodItem", "orders", "items", "allCategories", "allSubcategories", "discountSettings", "deliveryAreas", "statistics"].map((tab) => (
                <li key={tab}>
                  <button
                    onClick={() => setSelectedTab(tab)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center ${
                      selectedTab === tab 
                        ? "bg-red-800 bg-opacity-70 shadow-md transform translate-x-1 border-l-4 border-white" 
                        : "hover:bg-red-700 hover:bg-opacity-40"
                    }`}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 mr-3 transition-transform duration-300 ${selectedTab === tab ? 'rotate-90' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    {tab.replace(/([A-Z])/g, " $1").replace(/^\w/, (c) => c.toUpperCase())}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Settings Button (Desktop) - Now at the bottom */}
          <div className="flex-shrink-0 mt-4 pt-4 border-t border-white border-opacity-20">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full px-4 py-3 rounded-lg text-sm font-medium bg-white bg-opacity-10 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-between group"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                System Settings
              </span>
              <span className="bg-white bg-opacity-20 rounded-full p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        <div className="block md:hidden bg-gradient-to-r from-[#ba0000] to-[#930000] text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Tipu Restaurant Logo" 
                width={60} 
                height={60} 
                className="object-contain drop-shadow-md"
              />
              <h2 className="text-lg font-semibold ml-2">Tipu Admin</h2>
            </div>
          </div>
          <button
            onClick={handleToggleSiteStatus}
            className={`w-full text-center px-3 py-2 mb-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
              siteStatus 
                ? "bg-gradient-to-r from-green-500 to-green-600 shadow-md" 
                : "bg-gradient-to-r from-red-700 to-red-800 shadow-md"
            }`}
          >
            {siteStatus ? "Site is Online (ON)" : "Site is Offline (OFF)"}
          </button>
          <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
            {["branch", "category", "subcategory", "foodItem", "orders", "items", "allCategories", "allSubcategories", "discountSettings", "deliveryAreas", "statistics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  selectedTab === tab ? "bg-red-800 shadow-md" : "hover:bg-red-700 hover:bg-opacity-70"
                }`}
              >
                {tab.replace(/([A-Z])/g, " $1").replace(/^\w/, (c) => c.toUpperCase())}
              </button>
            ))}
            
            {/* Settings Button (Mobile) - added to the tab list */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 bg-white bg-opacity-10 hover:bg-opacity-20 flex items-center space-x-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </button>
          </div>
        </div>

        <div className="w-full md:w-3/4 p-4 overflow-y-auto bg-gray-50">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold capitalize text-[#ba0000]">
              {selectedTab.replace(/([A-Z])/g, " $1").replace(/^\w/, (c) => c.toUpperCase())}
            </h1>
            <div className="text-sm text-gray-500 font-medium bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
              {new Date().toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
            {renderContent()}
          </div>
        </div>
      </div>
      
      <SettingsPopup 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      
      {showConfirmation && (
        <ConfirmationDialog 
          message={`Are you sure you want to turn the site ${siteStatus ? 'OFF' : 'ON'}?`}
          onConfirm={toggleSiteStatus}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
}