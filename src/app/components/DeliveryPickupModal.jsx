"use client";
import { useEffect, useState } from "react";
import { useOrderTypeStore } from "../../store/orderTypeStore";
import { useBranchStore } from "../../store/branchStore";
import { Truck, ShoppingBag } from "lucide-react";

export default function DeliveryPickupModal() {
  const [isSiteActive, setIsSiteActive] = useState(true); 
  const [settings, setSettings] = useState({
    allowDelivery: true,
    allowPickup: true,
    defaultOption: 'none',
    deliveryMessage: 'Get your food delivered to your doorstep',
    pickupMessage: 'Pick up your order at our restaurant',
    defaultBranchId: null
  });

  const { orderType, setOrderType } = useOrderTypeStore();
  const { branch, setBranch } = useBranchStore();

  const [branches, setBranches] = useState([]);
  const [open, setOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const statusRes = await fetch("/api/site-status");
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setIsSiteActive(statusData.isSiteActive);
        }
        
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
        setIsSiteActive(false); 
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!branch && branches.length > 0) {
      if (settings.defaultBranchId) {
        const defaultBranch = branches.find(b => getBranchId(b) === settings.defaultBranchId);
        if (defaultBranch) {
          setBranch(defaultBranch);
        } else {
          setBranch(branches[0]);
        }
      } else {
        setBranch(branches[0]);
      }
    }
  }, [branch, branches, settings, setBranch]);

  useEffect(() => {
    if (!orderType && settings.defaultOption !== 'none') {
      if ((settings.defaultOption === 'delivery' && settings.allowDelivery) || 
          (settings.defaultOption === 'pickup' && settings.allowPickup)) {
        setOrderType(settings.defaultOption);
      }
    }
  }, [orderType, settings, setOrderType]);

  useEffect(() => {
    if (branch && orderType) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [branch, orderType]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleOrderTypeSelect = (type) => {
    setOrderType(type);
  };

  const handleBranchSelect = (selectedBranch) => {
    setBranch(selectedBranch);
  };

  const getBranchId = (b) => {
    return b._id?.$oid || b._id;
  };

  if (!isSiteActive) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-white w-full max-w-lg rounded-md shadow-2xl overflow-hidden animate-fadeIn">
          <div className="bg-red-600 text-white text-center py-4 px-6">
            <h2 className="text-2xl font-bold">Service Currently Unavailable</h2>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-white w-full max-w-lg rounded-md shadow-2xl overflow-hidden animate-fadeIn p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading options...</p>
        </div>
      </div>
    );
  }

  if (!open) return null;

  if (!settings.allowDelivery && !settings.allowPickup) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-white w-full max-w-lg rounded-md shadow-2xl overflow-hidden animate-fadeIn">
          <div className="bg-red-600 text-white text-center py-4 px-6">
            <h2 className="text-2xl font-bold">Service Unavailable</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700">Our ordering system is currently unavailable. Please check back later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-md shadow-2xl overflow-hidden animate-fadeIn">
        <div className="bg-red-600 text-white text-center py-4 px-6">
          <h2 className="text-2xl font-bold">Select your Order type</h2>
        </div>
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Branch</h3>
            <div className="grid grid-cols-2 gap-4">
              {branches.map((b) => {
                const branchId = getBranchId(b);
                const isSelected = branch && getBranchId(branch) === branchId;
                return (
                  <button
                    key={branchId}
                    onClick={() => handleBranchSelect(b)}
                    className={`w-full p-3 text-sm font-semibold border rounded-md 
                      transition-colors ${
                        isSelected
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:border-red-500"
                      }`}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>
          
          {(settings.allowDelivery || settings.allowPickup) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Order Type</h3>
              <div className={`grid ${settings.allowDelivery && settings.allowPickup ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {settings.allowDelivery && (
                  <button
                    onClick={() => handleOrderTypeSelect("delivery")}
                    className={`flex flex-col items-center p-4 border rounded-md 
                      transition-colors ${
                        orderType === "delivery"
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:border-red-500"
                      }`}
                  >
                    <Truck
                      size={28}
                      className={`mb-2 ${
                        orderType === "delivery" ? "text-white" : "text-red-600"
                      }`}
                    />
                    <span className="font-semibold text-sm">Delivery</span>
                    <span className="text-xs mt-1 text-center">
                      {settings.deliveryMessage}
                    </span>
                  </button>
                )}
                
                {settings.allowPickup && (
                  <button
                    onClick={() => handleOrderTypeSelect("pickup")}
                    className={`flex flex-col items-center p-4 border rounded-md 
                      transition-colors ${
                        orderType === "pickup"
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:border-red-500"
                      }`}
                  >
                    <ShoppingBag
                      size={28}
                      className={`mb-2 ${
                        orderType === "pickup" ? "text-white" : "text-red-600"
                      }`}
                    />
                    <span className="font-semibold text-sm">Pickup</span>
                    <span className="text-xs mt-1 text-center">
                      {settings.pickupMessage}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500">
            You can change these preferences later in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}