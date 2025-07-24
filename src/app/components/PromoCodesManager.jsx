"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function DiscountSettingManager() {
  const [percentage, setPercentage] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchDiscountSetting();
  }, []);

  const fetchDiscountSetting = async () => {
    try {
      const res = await fetch("/api/discount");
      if (res.ok) {
        const data = await res.json();
        setPercentage(data.percentage);
        setIsActive(data.isActive);
        setLastUpdated(new Date(data.updatedAt).toLocaleString());
      } else {
        toast.error("Failed to fetch discount setting");
      }
    } catch (error) {
      console.error("Error fetching discount setting:", error);
      toast.error("Error fetching discount setting");
    }
  };

  const handleUpdateDiscount = async (e) => {
    e.preventDefault();
    if (percentage < 0 || percentage > 100) {
      toast.error("Discount percentage must be between 0 and 100");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/discount", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          percentage: Number(percentage), 
          isActive 
        }),
      });
      
      if (res.ok) {
        const updatedSetting = await res.json();
        setLastUpdated(new Date(updatedSetting.updatedAt).toLocaleString());
        toast.success("Discount setting updated successfully");
      } else {
        toast.error("Failed to update discount setting");
      }
    } catch (error) {
      console.error("Error updating discount setting:", error);
      toast.error("Error updating discount setting");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Global Discount Setting</h2>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleUpdateDiscount} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Percentage
            </label>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                required
              />
              <span className="ml-2 text-gray-700">%</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Set the discount percentage (0-100%)
            </p>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Enable discount
            </label>
          </div>
          
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update Discount Setting"}
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Current Discount Status</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700">
              {isActive 
                ? `Active - ${percentage}% discount on all orders` 
                : 'Inactive - No discount applied'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="text-md font-medium text-yellow-800 mb-2">About Global Discount</h3>
        <p className="text-sm text-yellow-700">
          This discount applies to all orders on the website,
          When enabled, customers will automatically receive the specified discount percentage on their order total.
        </p>
      </div>
    </div>
  );
}