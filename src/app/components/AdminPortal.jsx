"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useSocket } from "../context/SocketContext";
import { Toaster } from "react-hot-toast";
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
import UserDetails from "./UserDetails";
import DeliveryPickupSettings from "./DeliveryPickupSettings";
import DeliveryAreasManager from "./DeliveryAreasManager";

const ConfirmationDialog = ({ title, message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-auto shadow-2xl border border-gray-200">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>}
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

export default function AdminPortal({ onLogout }) {
  const { latestOrder } = useSocket();

  const [selectedTab, setSelectedTab] = useState("branch");
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [siteStatus, setSiteStatus] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [logoData, setLogoData] = useState({
    logo: "/logo.png",
    updatedAt: new Date()
  });
  const [isLogoLoading, setIsLogoLoading] = useState(true);

  useEffect(() => {
    if (latestOrder) {
      // Optional: Auto-switch to orders tab when a new order comes in
      // Uncomment the line below if you want this behavior
      // setSelectedTab("orders");
    }
  }, [latestOrder]);

  useEffect(() => {
    fetchBranches();
    fetchCategories();
    fetchSubcategories();
    fetchFoodItems();
    fetchSiteStatus();
    fetchLogoData();

    setCurrentDateTime(new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }));

    const timer = setInterval(() => {
      setCurrentDateTime(new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    }, 60000);

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
      clearInterval(timer);
    };
  }, []);

  const fetchLogoData = async () => {
    setIsLogoLoading(true);
    try {
      const res = await fetch('/api/logo', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLogoData(data);
      }
    } catch (err) {
      console.error("Failed to fetch logo:", err);
    } finally {
      setIsLogoLoading(false);
    }
  };

  const getLogoTimestamp = () => {
    return logoData?.updatedAt ? new Date(logoData.updatedAt).getTime() : Date.now();
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const confirmLogout = () => {
    setShowLogoutConfirmation(true);
  };

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
      case "userDetails":
        return <UserDetails />;
      case "items":
        return <FoodItemList />;
      case "allCategories":
        return <CategoryList />;
      case "allSubcategories":
        return <SubcategoryList />;
      case "discountSettings":
        return <PromoCodesManager />;
      case "deliveryAreas":
        return <DeliveryAreasManager />;
      case "deliveryPickupSettings":
        return <DeliveryPickupSettings />;
      case "statistics":
        return <Statistics />;
      default:
        return null;
    }
  };

  const navigationItems = [
    { id: "branch", label: "Branch Management", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { id: "category", label: "Add Category", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
    { id: "subcategory", label: "Add Subcategory", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
    { id: "foodItem", label: "Add Food Item", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
    { id: "orders", label: "Orders Management", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { id: "userDetails", label: "User Management", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { id: "items", label: "Food Items", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { id: "allCategories", label: "Categories", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
    { id: "allSubcategories", label: "Subcategories", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
    { id: "discountSettings", label: "Promo Codes", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "deliveryAreas", label: "Delivery Areas", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
    { id: "deliveryPickupSettings", label: "Order Options", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"},
    { id: "statistics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 text-black overflow-hidden">
      <Toaster position="top-right" />

      <div className="bg-white border-b border-gray-200 shadow-sm z-20">
        <div className="flex justify-between items-center px-4 h-16">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              {!isLogoLoading && (
                <img
                  src={`${logoData.logo || "/logo.png"}?v=${getLogoTimestamp()}`}
                  alt="Restaurant Logo"
                  width="40"
                  height="40"
                  className="object-contain"
                />
              )}
              <h1 className="ml-2 text-xl font-bold text-red-700 hidden sm:block">Restaurant Management</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {currentDateTime}
            </div>

            <button
              onClick={handleToggleSiteStatus}
              className={`hidden md:flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${siteStatus
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
                }`}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${siteStatus ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {siteStatus ? "Site Online" : "Site Offline"}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button
              onClick={confirmLogout}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 flex items-center gap-2 shadow-sm"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex flex-col w-64 bg-gradient-to-r from-[#ba0000] to-[#930000] text-white shadow-xl z-10">
          {/* <div className="flex-1 overflow-y-auto py-4 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}> */}
          <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
            <div className="px-4 py-2">
              <div className={`mb-6 px-3 py-2.5 rounded-lg ${siteStatus
                ? "bg-green-500 bg-opacity-20 border border-green-600 border-opacity-30"
                : "bg-red-800 bg-opacity-30 border border-red-700 border-opacity-30"
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full ${siteStatus ? "bg-green-400" : "bg-red-400"}`}></span>
                    <span className="ml-2 text-sm font-medium text-white">
                      {siteStatus ? "System Online" : "System Offline"}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleSiteStatus}
                    className={`text-xs px-2 py-1 rounded ${siteStatus
                      ? "bg-green-700 text-green-100 hover:bg-green-600"
                      : "bg-red-700 text-red-100 hover:bg-red-600"
                      }`}
                  >
                    Toggle
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedTab(item.id)}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedTab === item.id
                      ? "bg-white text-red-700 shadow-md"
                      : "text-white hover:bg-red-700 hover:bg-opacity-70"
                      }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 mr-3 ${selectedTab === item.id ? "text-red-600" : "text-white"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-red-700 border-opacity-30">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-red-900 border border-white bg-opacity-30 text-white hover:bg-red-950 hover:bg-opacity-50 transition-colors"
            >
              <span className="flex items-center text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                System Settings
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </aside>

        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileSidebarOpen(false)}></div>
            <div className="relative flex flex-col w-72 max-w-[80%] h-full bg-gradient-to-r from-[#ba0000] to-[#930000] text-white shadow-xl">
              <div className="flex items-center justify-between px-4 h-16 border-b border-red-800">
                <div className="flex items-center">
                  {!isLogoLoading && (
                    <img
                      src={`${logoData.logo || "/logo.png"}?v=${getLogoTimestamp()}`}
                      alt="Restaurant Logo"
                      width="32"
                      height="32"
                      className="object-contain"
                    />
                  )}
                  <h1 className="ml-2 text-lg font-bold text-white">Restaurant App</h1>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 rounded-md text-white hover:bg-red-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className={`mb-6 px-3 py-2.5 rounded-lg ${siteStatus
                  ? "bg-green-500 bg-opacity-20 border border-green-600 border-opacity-30"
                  : "bg-red-800 bg-opacity-30 border border-red-700 border-opacity-30"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full ${siteStatus ? "bg-green-400" : "bg-red-400"}`}></span>
                      <span className="ml-2 text-sm font-medium text-white">
                        {siteStatus ? "System Online" : "System Offline"}
                      </span>
                    </div>
                    <button
                      onClick={handleToggleSiteStatus}
                      className={`text-xs px-2 py-1 rounded ${siteStatus
                        ? "bg-green-700 text-green-100 hover:bg-green-600"
                        : "bg-red-700 text-red-100 hover:bg-red-600"
                        }`}
                    >
                      Toggle
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {navigationItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedTab(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedTab === item.id
                        ? "bg-white text-red-700 shadow-md"
                        : "text-white hover:bg-red-700 hover:bg-opacity-70"
                        }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 mr-3 ${selectedTab === item.id ? "text-red-600" : "text-white"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-red-700 border-opacity-30">
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-red-900 border border-white bg-opacity-30 text-white hover:bg-red-950 hover:bg-opacity-50 transition-colors"
                >
                  <span className="flex items-center text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    System Settings
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* <main className="flex-1 overflow-y-auto bg-gray-50 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }} > */}
        <main className="flex-1 overflow-y-auto bg-gray-50 scrollbar-hide">
          <div className="max-w-7xl mx-auto p-4 lg:p-6">
            <div className="mb-6 pb-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900 capitalize flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={navigationItems.find(item => item.id === selectedTab)?.icon || ""} />
                </svg>
                {navigationItems.find(item => item.id === selectedTab)?.label || "Dashboard"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your restaurant operations efficiently and effectively.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-100">
              <div className="p-6">
                {renderContent()}
              </div>
            </div>
          </div>
        </main>
      </div>

      <SettingsPopup
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {showConfirmation && (
        <ConfirmationDialog
          title="Change Site Status"
          message={`Are you sure you want to turn the site ${siteStatus ? 'OFF' : 'ON'}?`}
          onConfirm={toggleSiteStatus}
          onCancel={() => setShowConfirmation(false)}
        />
      )}

      {showLogoutConfirmation && (
        <ConfirmationDialog
          title="Confirm Logout"
          message="Are you sure you want to logout from the admin panel?"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirmation(false)}
        />
      )}
    </div>
  );
}