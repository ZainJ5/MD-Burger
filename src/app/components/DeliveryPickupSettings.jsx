"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function DeliveryPickupSettings() {
  const [settings, setSettings] = useState({
    allowDelivery: true,
    allowPickup: true,
    defaultOption: 'none',
    deliveryMessage: 'Get your food delivered to your doorstep',
    pickupMessage: 'Pick up your order at our restaurant',
    defaultBranchId: null
  });
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const settingsRes = await fetch("/api/delivery-pickup");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        }

        const branchesRes = await fetch("/api/branches");
        if (branchesRes.ok) {
          const branchesData = await branchesRes.json();
          setBranches(branchesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!settings.allowDelivery && !settings.allowPickup) {
      toast.error("At least one order option must be enabled");
      return;
    }

    if (
      (settings.defaultOption === 'delivery' && !settings.allowDelivery) ||
      (settings.defaultOption === 'pickup' && !settings.allowPickup)
    ) {
      setSettings(prev => ({ ...prev, defaultOption: 'none' }));
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/delivery-pickup", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Delivery & Pickup Settings
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="allowDelivery"
                      className="sr-only"
                      checked={settings.allowDelivery}
                      onChange={handleChange}
                    />
                    <div className={`w-10 h-5 bg-gray-300 rounded-full shadow-inner ${
                      settings.allowDelivery ? 'bg-red-600' : ''
                    }`}></div>
                    <div className={`toggle-dot absolute w-4 h-4 bg-white rounded-full shadow -left-1 -top-1 transition ${
                      settings.allowDelivery ? 'transform translate-x-6' : ''
                    }`}></div>
                  </div>
                  <span className="ml-3 text-gray-700 font-medium">Enable Delivery</span>
                </label>
                {settings.allowDelivery && (
                  <input
                    type="radio"
                    name="defaultOption"
                    value="delivery"
                    checked={settings.defaultOption === 'delivery'}
                    onChange={handleChange}
                    className="ml-2 h-4 w-4 accent-red-600"
                  />
                )}
              </div>
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Message
                </label>
                <input
                  type="text"
                  name="deliveryMessage"
                  value={settings.deliveryMessage}
                  onChange={handleChange}
                  disabled={!settings.allowDelivery}
                  className={`w-full p-2 border rounded-md ${
                    !settings.allowDelivery 
                      ? 'bg-gray-100 text-gray-500' 
                      : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
                  }`}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="allowPickup"
                      className="sr-only"
                      checked={settings.allowPickup}
                      onChange={handleChange}
                    />
                    <div className={`w-10 h-5 bg-gray-300 rounded-full shadow-inner ${
                      settings.allowPickup ? 'bg-red-600' : ''
                    }`}></div>
                    <div className={`toggle-dot absolute w-4 h-4 bg-white rounded-full shadow -left-1 -top-1 transition ${
                      settings.allowPickup ? 'transform translate-x-6' : ''
                    }`}></div>
                  </div>
                  <span className="ml-3 text-gray-700 font-medium">Enable Pickup</span>
                </label>
                {settings.allowPickup && (
                  <input
                    type="radio"
                    name="defaultOption"
                    value="pickup"
                    checked={settings.defaultOption === 'pickup'}
                    onChange={handleChange}
                    className="ml-2 h-4 w-4 accent-red-600"
                  />
                )}
              </div>
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Message
                </label>
                <input
                  type="text"
                  name="pickupMessage"
                  value={settings.pickupMessage}
                  onChange={handleChange}
                  disabled={!settings.allowPickup}
                  className={`w-full p-2 border rounded-md ${
                    !settings.allowPickup 
                      ? 'bg-gray-100 text-gray-500' 
                      : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Branch (Optional)
            </label>
            <select
              name="defaultBranchId"
              value={settings.defaultBranchId || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            >
              <option value="">No default branch</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              If selected, this branch will be pre-selected in the order type modal.
            </p>
          </div>

          <div className="flex items-center mt-6">
            <input
              type="radio"
              name="defaultOption"
              value="none"
              checked={settings.defaultOption === 'none'}
              onChange={handleChange}
              className="h-4 w-4 accent-red-600"
            />
            <label className="ml-2 text-sm text-gray-700">
              No default option (users must select)
            </label>
            <div className="flex-grow"></div>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 ${
                isSaving 
                  ? 'bg-gray-400' 
                  : 'bg-red-600 hover:bg-red-700'
              } text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50`}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}