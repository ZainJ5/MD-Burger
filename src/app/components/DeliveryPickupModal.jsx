"use client";
import { useEffect, useState } from "react";
import { useOrderTypeStore } from "../../store/orderTypeStore";
import { useDeliveryAreaStore } from "../../store/deliveryAreaStore";
import { useBranchStore } from "../../store/branchStore";
import { useCartStore } from "../../store/cart";
import { Truck, ShoppingBag, MapPin, ChevronDown } from "lucide-react";
export default function DeliveryPickupModal() {
  const [isSiteActive, setIsSiteActive] = useState(true);
  const [settings, setSettings] = useState({
    allowDelivery: true,
    allowPickup: true,
    defaultOption: 'none',
  });
  const { orderType, setOrderType } = useOrderTypeStore();
  const { deliveryArea, setDeliveryArea } = useDeliveryAreaStore();
  const { branch, setBranch } = useBranchStore();
  const { clearCart } = useCartStore();
  const [branches, setBranches] = useState([]);
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [open, setOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [statusRes, settingsRes, logoRes, branchesRes] = await Promise.all([
          fetch("/api/site-status"),
          fetch("/api/delivery-pickup"),
          fetch("/api/logo"),
          fetch("/api/branches")
        ]);
        if (statusRes.ok) setIsSiteActive((await statusRes.json()).isSiteActive);
        if (settingsRes.ok) setSettings(await settingsRes.json());
        if (logoRes.ok) setLogoUrl((await logoRes.json()).logo);
        if (branchesRes.ok) {
          const branchData = await branchesRes.json();
          setBranches(branchData);
          // Set default branch or first branch if no branch is selected
          if (!branch && branchData && branchData.length > 0) {
            const defaultBranch = branchData.find(b => b.isDefault);
            setBranch(defaultBranch || null);
          }
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
  // Fetch delivery areas when branch changes
  useEffect(() => {
    async function fetchDeliveryAreas() {
      if (!branch || orderType !== 'delivery') {
        setDeliveryAreas([]);
        return;
      }
      try {
        const res = await fetch(`/api/delivery-areas?branchId=${branch._id}`);
        if (res.ok) {
          const data = await res.json();
          setDeliveryAreas(data.filter(area => area.isActive));
        } else {
          console.error("Failed to fetch delivery areas");
          setDeliveryAreas([]);
        }
      } catch (error) {
        console.error("Error fetching delivery areas:", error);
        setDeliveryAreas([]);
      }
    }
   
    fetchDeliveryAreas();
  }, [branch, orderType]);
  useEffect(() => {
    if (!orderType && settings.defaultOption !== 'none') {
      if ((settings.defaultOption === 'delivery' && settings.allowDelivery) ||
          (settings.defaultOption === 'pickup' && settings.allowPickup)) {
        setOrderType(settings.defaultOption);
      }
    }
  }, [orderType, settings, setOrderType]);
  useEffect(() => {
    const isReadyToClose = branch && orderType &&
                           (orderType === 'pickup' || (orderType === 'delivery' && deliveryArea));
    setOpen(!isReadyToClose);
  }, [branch, orderType, deliveryArea]);
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
    if (orderType === type) return;
    setOrderType(type);
    setDeliveryArea(null);
  };
 
  const handleBranchSelect = (e) => {
    const selectedBranchId = e.target.value;
    const selectedBranch = branches.find(b => b._id === selectedBranchId);
    
    clearCart();
    
    setOrderType(null);
    setDeliveryArea(null);
    
    setBranch(selectedBranch || null);
  };
 
  const handleDeliveryAreaSelect = (e) => {
    const selectedAreaId = e.target.value;
    const area = deliveryAreas.find(a => a._id === selectedAreaId);
    setDeliveryArea(area || null);
  };
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-white w-full max-w-sm rounded-xl p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        <div className="relative">
          <div className="bg-red-600 h-20"></div>
          <div className="absolute left-1/2 -translate-x-1/2 top-6 flex justify-center">
            <div className="rounded-full bg-white p-1.5 border-4 border-white shadow-lg">
              <img
                src={logoUrl}
                alt="Restaurant Logo"
                className="h-20 w-20 object-contain rounded-full"
              />
            </div>
          </div>
        </div>
        <div className="px-6 pt-14 pb-6 space-y-6">
          {/* Order Type Selection - Compact Pills */}
          <div>
            <h3 className="text-base font-semibold text-gray-700 mb-3 text-center">Select Order Type</h3>
            <div className="flex gap-3 justify-center">
              {settings.allowDelivery && (
                <button
                  onClick={() => handleOrderTypeSelect("delivery")}
                  disabled={!branch}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium transition-all duration-200 ${
                    !branch
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : orderType === "delivery"
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Truck size={18} />
                  Delivery
                </button>
              )}
              {settings.allowPickup && (
                <button
                  onClick={() => handleOrderTypeSelect("pickup")}
                  disabled={!branch}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium transition-all duration-200 ${
                    !branch
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : orderType === "pickup"
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <ShoppingBag size={18} />
                  Pickup
                </button>
              )}
            </div>
            {!branch && (
              <p className="text-xs text-red-600 mt-2 text-center">
                Please select a branch first
              </p>
            )}
          </div>
          {/* Branch Selection - Compact */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              <MapPin className="inline mr-1.5" size={18} />
              Select Your Nearest Location
            </label>
            <div className="relative">
              <select
                value={branch?._id || ""}
                onChange={handleBranchSelect}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-base text-gray-800 appearance-none cursor-pointer transition-all"
              >
                <option value="" disabled className="text-gray-500">
                  Choose your branch
                </option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id} className="text-gray-800">
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>
          </div>
          {/* Delivery Area Selection - Compact */}
          {orderType === 'delivery' && (
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                Delivery Area
              </label>
              <div className="relative">
                <select
                  value={deliveryArea?._id || ""}
                  onChange={handleDeliveryAreaSelect}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-base text-gray-800 appearance-none cursor-pointer transition-all"
                >
                  <option value="" disabled className="text-gray-500">
                    {branch ? 'Select your area' : 'Select a branch first'}
                  </option>
                  {deliveryAreas.length > 0 ? (
                    deliveryAreas.map((area) => (
                      <option
                        key={area._id}
                        value={area._id}
                        className="text-gray-800"
                      >
                        {area.name} • Rs. {area.fee}
                      </option>
                    ))
                  ) : branch ? (
                    <option disabled className="text-gray-500">No delivery areas available</option>
                  ) : null}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>
              {branch && deliveryAreas.length === 0 && (
                <p className="text-xs text-red-600 mt-2">
                  No delivery areas available for {branch.name}. Please try pickup.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}