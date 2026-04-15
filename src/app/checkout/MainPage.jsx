"use client";
import { useState, useEffect } from "react";
import { FaCreditCard, FaMoneyBill, FaClock, FaTag, FaPercent } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useOrderTypeStore } from "../../store/orderTypeStore";
import { useCartStore } from "../../store/cart";
import { useBranchStore } from "../../store/branchStore";
import { useDeliveryAreaStore } from "../../store/deliveryAreaStore"; // Import the delivery area store
import DeliveryPickupModal from "../components/DeliveryPickupModal";
import { useRouter } from "next/navigation";

const MIN_ORDER_VALUE = 500;

export default function CheckoutPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Mr.");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [nearestLandmark, setNearestLandmark] = useState("");
  const [email, setEmail] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [changeRequest, setChangeRequest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [receiptFile, setReceiptFile] = useState(null);
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [pickupTime, setPickupTime] = useState("20"); 
  const [orderPlaced, setOrderPlaced] = useState(false);
  
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const [discountActive, setDiscountActive] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [onlineOption, setOnlineOption] = useState(null);
  
  const [logoData, setLogoData] = useState({
    logo: "/logo.png",
    updatedAt: new Date()
  });
  const [isLogoLoading, setIsLogoLoading] = useState(true);
  const [isSiteActive, setIsSiteActive] = useState(true);

  const { orderType } = useOrderTypeStore();
  const { deliveryArea } = useDeliveryAreaStore(); // Get the selected delivery area from the global store
  const { branch } = useBranchStore();
  const { items, total, clearCart } = useCartStore();
  const subtotal = total;
  const tax = 0;
  const deliveryFee = orderType === "delivery" && selectedArea ? selectedArea.fee : 0;
  
  const globalDiscount = discountActive ? Math.round(subtotal * (discountPercentage / 100)) : 0;
  
  useEffect(() => {
    if (orderType === "delivery" && deliveryArea) {
      setSelectedArea(deliveryArea);
    }
  }, [orderType, deliveryArea]);

  useEffect(() => {
    const savedUserData = localStorage.getItem('checkoutUserData');
    if (savedUserData) {
      try {
        const userData = JSON.parse(savedUserData);
        if (userData.fullName) setFullName(userData.fullName);
        if (userData.mobileNumber) setMobileNumber(userData.mobileNumber);
        if (userData.alternateMobile) setAlternateMobile(userData.alternateMobile);
        if (userData.email) setEmail(userData.email);
        if (userData.deliveryAddress) setDeliveryAddress(userData.deliveryAddress);
        if (userData.nearestLandmark) setNearestLandmark(userData.nearestLandmark);
      } catch (e) {
        console.error("Error parsing saved user data", e);
      }
    }
  }, []);

  const saveUserData = () => {
    try {
      const userData = {
        fullName,
        mobileNumber,
        alternateMobile,
        email,
        deliveryAddress,
        nearestLandmark
      };
      localStorage.setItem('checkoutUserData', JSON.stringify(userData));
    } catch (e) {
      console.error("Error saving user data", e);
    }
  };
  
  useEffect(() => {
    if (appliedPromoCode) {
      const calculatedDiscount = Math.round(subtotal * (appliedPromoCode.discount / 100));
      setPromoDiscount(calculatedDiscount);
    } else {
      setPromoDiscount(0);
    }
  }, [subtotal, appliedPromoCode]);
  
  const totalDiscount = globalDiscount + promoDiscount;
  const grandTotal = Math.max(0, subtotal + tax + deliveryFee - totalDiscount);

  const easypaisaDetails = {
    title: "EasyPaisa Payment Details",
    accountNumber: "03101300101",
    accountName: "Burhan Ahmed",
    instructions:
      "Transfer using the EasyPaisa app and upload a screenshot of your transaction.",
  };

  const jazzcashDetails = {
    title: "JazzCash Payment Details",
    accountNumber: "444555666",
    accountName: "JazzCash Merchant",
    instructions:
      "Pay via JazzCash and upload a screenshot of your payment confirmation.",
  };

  const bankTransferDetails = {
    title: "Bank Transfer Details",
    bankName: "ABC Bank",
    accountNumber: "1234567890",
    accountName: "Your Business Name",
    branch: "Main Branch",
    instructions:
      "Transfer the payment to the bank account and upload the transaction receipt.",
  };

  useEffect(() => {
    async function fetchLogoData() {
      setIsLogoLoading(true);
      try {
        const res = await fetch("/api/logo");
        if (res.ok) {
          const data = await res.json();
          setLogoData(data);
        }
      } catch (error) {
        console.error("Error fetching logo data:", error);
      } finally {
        setIsLogoLoading(false);
      }
    }
    
    fetchLogoData();
  }, []);

  const getLogoTimestamp = () => {
    return logoData?.updatedAt ? new Date(logoData.updatedAt).getTime() : Date.now();
  };

  useEffect(() => {
    async function fetchDiscountSettings() {
      try {
        const res = await fetch("/api/discount");
        if (res.ok) {
          const data = await res.json();
          setDiscountPercentage(data.percentage);
          setDiscountActive(data.isActive);
        } else {
          toast.error("Failed to fetch discount settings. Using default discount.", {
            style: { background: "#dc2626", color: "#ffffff" },
          });
        }
      } catch (error) {
        console.error("Error fetching discount settings:", error);
        toast.error("Error fetching discount settings. Using default discount.", {
          style: { background: "#dc2626", color: "#ffffff" },
        });
      }
    }
    
    async function fetchDeliveryAreas() {
      try {
        // Fetch areas based on selected branch
        const url = branch?._id 
          ? `/api/delivery-areas?branchId=${branch._id}`
          : "/api/delivery-areas";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setDeliveryAreas(data.filter(area => area.isActive));
        } else {
          toast.error("Failed to fetch delivery areas. Please try again later.", {
            style: { background: "#dc2626", color: "#ffffff" },
          });
        }
      } catch (error) {
        console.error("Error fetching delivery areas:", error);
        toast.error("Error fetching delivery areas. Please try again later.", {
          style: { background: "#dc2626", color: "#ffffff" },
        });
      }
    }

    async function fetchSiteStatus() {
      try {
        const res = await fetch("/api/site-status");
        if (res.ok) {
          const data = await res.json();
          setIsSiteActive(data.isSiteActive);
        }
      } catch (error) {
        console.error("Error fetching site status:", error);
        setIsSiteActive(false);
      }
    }
    
    fetchDiscountSettings();
    if (orderType === "delivery" && branch) {
      fetchDeliveryAreas();
    }
    fetchSiteStatus();
  }, [orderType, branch]);

  useEffect(() => {
    setAppliedDiscount(totalDiscount);
  }, [totalDiscount]);

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }
    
    setPromoError("");
    setIsApplyingPromo(true);
    
    try {
      const res = await fetch(`/api/promocodes/verify?code=${promoCode.trim().toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        setAppliedPromoCode(data);
        
        const discountAmount = Math.round(subtotal * (data.discount / 100));
        setPromoDiscount(discountAmount);
        
        toast.success(`Promo code ${data.code} applied successfully! Additional ${data.discount}% off`, {
          style: { background: "#16a34a", color: "#ffffff" },
        });
        setPromoCode("");
      } else {
        const errorData = await res.json();
        setPromoError(errorData.message || "Invalid promo code");
        toast.error("Invalid promo code", {
          style: { background: "#dc2626", color: "#ffffff" },
        });
      }
    } catch (error) {
      console.error("Error verifying promo code:", error);
      setPromoError("Error verifying promo code. Please try again.");
      toast.error("Error verifying promo code", {
        style: { background: "#dc2626", color: "#ffffff" },
      });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null);
    setPromoDiscount(0);
    toast.info("Promo code removed", {
      style: { background: "#6b7280", color: "#ffffff" },
    });
  };

  const validateForm = () => {
    if (items.length === 0 && !orderPlaced) {
      toast.error("Your cart is empty. Please add items before placing an order.", {
        style: { background: "#dc2626", color: "#ffffff" },
      });
      return false;
    }
    
    if (!fullName.trim()) {
      toast.error("Please enter your full name.", {
        style: { background: "#dc2626", color: "#ffffff" },
      });
      return false;
    }
    
    if (!mobileNumber.trim()) {
      toast.error("Please enter your mobile number.", {
        style: { background: "#dc2626", color: "#ffffff" },
      });
      return false;
    }

    const phoneRegex = /^03[0-9]{9}$/;
    if (!phoneRegex.test(mobileNumber.trim())) {
      toast.error("Please enter a valid mobile number (format: 03XXXXXXXXX)", {
        style: { background: "#dc2626", color: "#ffffff" },
      });
      return false;
    }
    
    if (orderType === "delivery") {
      if(!alternateMobile.trim()){
        toast.error("Please enter your WhatsApp number.", {
          style: { background: "#dc2626", color: "#ffffff" },
        });
        return false;
      }
      
      if (!phoneRegex.test(alternateMobile.trim())) {
        toast.error("Please enter a valid WhatsApp number (format: 03XXXXXXXXX)", {
          style: { background: "#dc2626", color: "#ffffff" },
        });
        return false;
      }
    }
    
    if (!branch) {
      toast.error("Please select a branch for your order.", {
        style: { background: "#dc2626", color: "#ffffff" },
      });
      return false;
    }
    
    if (!orderType) {
      toast.error("Please select an order type (delivery or pickup).", {
        style: { background: "#dc2626", color: "#ffffff" },
      });
      return false;
    }
    
    if (orderType === "delivery") {
      if (!deliveryAddress.trim()) {
        toast.error("Please enter your delivery address.", {
          style: { background: "#dc2626", color: "#ffffff" },
        });
        return false;
      }
      
      if (!selectedArea) {
        toast.error("Please select your delivery area.", {
          style: { background: "#dc2626", color: "#ffffff" },
        });
        return false;
      }
    }
    
    if (subtotal < MIN_ORDER_VALUE) {
      toast.error(`Minimum order value is Rs. ${MIN_ORDER_VALUE}. Please add more items to your order.`, {
        style: { background: "#dc2626", color: "#ffffff" },
      });
      return false;
    }
    
    if (grandTotal < 0) {
      toast.error("The total amount cannot be negative. Please review your order.", {
        style: { background: "#dc2626", color: "#ffffff" },
      });
      return false;
    }
    
    if (paymentMethod === "online") {
      if (!onlineOption) {
        toast.error("Please select an online payment method.", {
          style: { background: "#dc2626", color: "#ffffff" },
        });
        return false;
      }
      
      if (!receiptFile) {
        toast.error("Please upload your payment receipt.", {
          style: { background: "#dc2626", color: "#ffffff" },
        });
        return false;
      }
    }
    
    return true;
  };

const handlePlaceOrder = async () => {
  setOrderPlaced(false);
  
  if (!validateForm()) {
    return;
  }
  
  saveUserData();
  setIsSubmitting(true);

  try {
    const orderItems = items.map((item) => {
      const formattedItem = {
        id: item._id,
        title: item.title.split(" x")[0], 
        description: item.description || "",
        price: item.unitPrice || item.price,
        quantity: item.quantity || 1,
        imageUrl: item.imageUrl || null,
        specialInstructions: item.specialInstructions || ""
      };
      
      if (item.type && item.price) {
        formattedItem.selectedVariation = {
          name: item.type,
          price: item.price
        };
      }
      
      if (item.selectedExtras && item.selectedExtras.length > 0) {
        formattedItem.selectedExtras = item.selectedExtras.map(extra => ({
          name: extra.name,
          price: extra.price
        }));
      }
      
      if (item.selectedSideOrders && item.selectedSideOrders.length > 0) {
        formattedItem.selectedSideOrders = item.selectedSideOrders.map(sideOrder => ({
          name: sideOrder.name,
          price: sideOrder.price,
          category: sideOrder.category || 'other'
        }));
      }
      
      if (item.modifications && item.modifications.length > 0) {
        for (const mod of item.modifications) {
          if (mod.type === 'variation') {
            formattedItem.selectedVariation = {
              name: mod.items[0].name,
              price: mod.items[0].price
            };
          } else if (mod.type === 'extras') {
            formattedItem.selectedExtras = mod.items.map(extra => ({
              name: extra.name,
              price: extra.price
            }));
          } else if (mod.type === 'sideOrders') {
            formattedItem.selectedSideOrders = mod.items.map(sideOrder => ({
              name: sideOrder.name,
              price: sideOrder.price,
              category: sideOrder.category || 'other'
            }));
          }
        }
      }
      
      return formattedItem;
    });
    
    const subtotalValue = Math.round(subtotal);
    const taxValue = Math.round(tax);
    const globalDiscountValue = Math.round(globalDiscount);
    const promoDiscountValue = Math.round(promoDiscount);
    const totalDiscountValue = Math.round(totalDiscount);
    const grandTotalValue = Math.round(grandTotal);
    
    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("mobileNumber", mobileNumber);
    formData.append("orderType", orderType);
    formData.append("branch", branch?._id);
    
    formData.append("status", "Pending");
    
    if (orderType === "delivery") {
      const completeAddress = deliveryAddress.trim() + ", " + selectedArea.name;
      formData.append("alternateMobile", alternateMobile);
      formData.append("deliveryAddress", completeAddress);
      formData.append("nearestLandmark", nearestLandmark);
      formData.append("deliveryFee", selectedArea.fee.toString());
      formData.append("area", selectedArea.name);
    } else if (orderType === "pickup") {
      formData.append("area", "N/A");
    }
    
    formData.append("email", email);
    formData.append("paymentInstructions", paymentInstructions);
    formData.append("paymentMethod", paymentMethod);
    
    formData.append("subtotal", subtotalValue.toString());
    formData.append("tax", taxValue.toString());
    formData.append("globalDiscount", globalDiscountValue.toString());
    formData.append("promoDiscount", promoDiscountValue.toString());
    formData.append("discount", totalDiscountValue.toString());
    formData.append("total", grandTotalValue.toString());
    
    if (appliedPromoCode) {
      formData.append("promoCode", appliedPromoCode.code);
      formData.append("promoDiscountPercentage", appliedPromoCode.discount.toString());
    }
    
    formData.append("globalDiscountPercentage", discountActive ? discountPercentage.toString() : "0");
    formData.append("isGift", isGift ? "true" : "false");
    formData.append("giftMessage", giftMessage);
    formData.append("items", JSON.stringify(orderItems));
    formData.append("changeRequest", changeRequest);
    
    if (orderType === "pickup") {
      formData.append("pickupTime", pickupTime);
    }

    if (paymentMethod === "online") {
      formData.append("receiptImage", receiptFile);
      let bankNameField = "";
      if (onlineOption === "easypaisa") bankNameField = "EasyPaisa";
      else if (onlineOption === "jazzcash") bankNameField = "JazzCash";
      else if (onlineOption === "bank_transfer")
        bankNameField = bankTransferDetails.bankName;
      formData.append("bankName", bankNameField);
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to place order");
    }
    
    const data = await response.json();
    console.log("Order placed successfully:", data);

    const orderNo = data.orderNo || data._id || `ORD-${Date.now()}`;

    const orderDetails = {
      orderNo: orderNo,
      orderId: orderNo,
      _id: data._id,
      orderDate: new Date().toISOString(),
      status: "Pending", 
      estimatedDelivery: orderType === "delivery" ? "Within 1 hour" : `Ready in ${pickupTime} minutes`,
      customerName: fullName,
      fullName: fullName,
      mobileNumber: mobileNumber,
      email: email,
      orderType: orderType,
      branch: branch?._id || "Main Branch",
      branchName: branch?.name || "Main Branch", 
      paymentMethod: paymentMethod,
      bankName: paymentMethod === "online" ? getBankNameFromOption(onlineOption) : undefined,
      subtotal: subtotalValue,
      globalDiscount: globalDiscountValue,
      promoDiscount: promoDiscountValue,
      totalDiscount: totalDiscountValue,
      promoCode: appliedPromoCode ? appliedPromoCode.code : null,
      globalDiscountPercentage: discountActive ? discountPercentage : 0,
      promoDiscountPercentage: appliedPromoCode ? appliedPromoCode.discount : 0,
      total: grandTotalValue,
      items: orderItems,
    };
    
    if (orderType === "delivery") {
      orderDetails.deliveryAddress = deliveryAddress + ", " + selectedArea?.name;
      orderDetails.nearestLandmark = nearestLandmark;
      orderDetails.area = selectedArea?.name;
      orderDetails.deliveryFee = selectedArea?.fee || 0;
    }

    sessionStorage.setItem("lastOrder", JSON.stringify(orderDetails));
    
    try {
      const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
      
      if (!orderHistory.some(order => order.orderNo === orderNo)) {
        const orderSummary = {
          _id: data._id,
          orderNo: orderNo,
          date: new Date().toISOString(),
          status: "Pending",
          total: grandTotalValue,
          fullName: fullName,
          orderType: orderType,
          branchName: branch?.name || "Main Branch",
          paymentMethod: paymentMethod,
        };
        
        orderHistory.unshift(orderSummary);
        
        const limitedHistory = orderHistory.slice(0, 50);
        
        localStorage.setItem('orderHistory', JSON.stringify(limitedHistory));
      }
      
      localStorage.setItem(`order_${orderNo}`, JSON.stringify(orderDetails));
      
    } catch (storageError) {
      console.error("Error storing order in local storage:", storageError);
    }

    setOrderPlaced(true);
    clearCart();
    resetFormFields();

    router.push("/order");

    toast.success("Your order has been placed successfully!", {
      style: { background: "#16a34a", color: "#ffffff" },
    });
  } catch (error) {
    console.error(error);
    toast.error(error.message || "An error occurred while placing your order. Please try again later.", {
      style: { background: "#dc2626", color: "#ffffff" },
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const getBankNameFromOption = (option) => {
    if (option === "easypaisa") return "EasyPaisa";
    if (option === "jazzcash") return "JazzCash";
    if (option === "bank_transfer") return bankTransferDetails.bankName;
    return "";
  };

  const resetFormFields = () => {
    setPaymentInstructions("");
    setPaymentMethod("cod");
    setOnlineOption(null);
    setIsGift(false);
    setGiftMessage("");
    setAppliedPromoCode(null);
    setPromoDiscount(0);
    setPromoCode("");
    setSelectedArea(null);
    setReceiptFile(null);
    setChangeRequest("");
    setPickupTime("20");
  };

  const formatPrice = (price) => {
    return Number(price).toLocaleString();
  };

  const getBaseTitle = (fullTitle) => {
    if (!fullTitle) return '';
    const parts = fullTitle.split(" x");
    parts.pop();
    return parts.join(" x");
  };

  return (
    <>
      <ToastContainer 
        position="bottom-center"
        autoClose={2500}
        hideProgressBar={true}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ 
          bottom: '80px',
          width: 'auto',
          maxWidth: '90%'
        }}
        toastStyle={{
          backgroundColor: '#1f2937',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          minHeight: '48px'
        }}
      />
      {(!branch || !orderType) && <DeliveryPickupModal />}
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center mb-8">
            {!isLogoLoading && (
              <img 
                src={`${logoData.logo || "/logo.png"}?v=${getLogoTimestamp()}`} 
                alt="Logo" 
                className="h-24 sm:h-32" 
              />
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-2 bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                    Checkout
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    {orderType === "delivery" ? (
                      <>This is a Delivery Order <span className="text-brand-600">🚚</span></>
                    ) : (
                      <>This is a Pickup Order <span className="text-brand-600">🏪</span></>
                    )}
                    <br />
                    Just a last step, please enter your details:
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <select
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                    >
                      <option>Mr.</option>
                      <option>Mrs.</option>
                      <option>Ms.</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-sm text-gray-700 mb-1">
                      Full Name <span className="text-brand-500">*Required</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                      placeholder="Full Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Mobile Number <span className="text-brand-500">*Required</span>
                    </label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                      placeholder="03xx-xxxxxxx"
                      pattern="^03[0-9]{9}$"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: 03xxxxxxxxx</p>
                  </div>
                  {orderType === "pickup" ? (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Pick Up Time <span className="text-brand-500">*Required</span>
                      </label>
                      <select
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                      >
                        <option value="20">20 minutes</option>
                        <option value="25">25 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="35">35 minutes</option>
                        <option value="40">40 minutes</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                      Whatsapp Number <span className="text-brand-500">*Required</span>
                    </label>
                      <input
                        type="tel"
                        value={alternateMobile}
                        required
                        onChange={(e) => setAlternateMobile(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                        placeholder="03xx-xxxxxxx"
                        pattern="^03[0-9]{9}$"
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: 03xxxxxxxxx</p>
                    </div>
                  )}
                </div>

                {orderType === "delivery" && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Delivery Address <span className="text-brand-500">*Required</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                        placeholder="Enter your complete address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Select Area <span className="text-brand-500">*Required</span>
                      </label>
                      {branch && (
                        <p className="text-xs text-gray-600 mb-2">
                          Showing areas for <span className="font-semibold">{branch.name}</span> branch
                        </p>
                      )}
                      <select
                        value={selectedArea ? selectedArea.name : ""}
                        onChange={(e) => {
                          const selected = deliveryAreas.find(
                            (area) => area.name === e.target.value
                          );
                          setSelectedArea(selected);
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                      >
                        <option value="">Select an area</option>
                        {deliveryAreas.map((area) => (
                          <option key={area._id} value={area.name}>
                            {area.name} (Fee: Rs. {area.fee})
                          </option>
                        ))}
                      </select>
                      {deliveryAreas.length === 0 && branch && (
                        <p className="text-xs text-brand-600 mt-1">
                          No delivery areas available for {branch.name} branch. Please contact support.
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Nearest Landmark
                        </label>
                        <input
                          type="text"
                          value={nearestLandmark}
                          onChange={(e) => setNearestLandmark(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                          placeholder="Any famous place nearby"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                  </>
                )}

                {orderType === "pickup" && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                      placeholder="Enter your email"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Order Instructions
                  </label>
                  <textarea
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                    placeholder="Any notes or instructions about order?"
                    rows={3}
                  />
                </div>
                
                {/* Gift option */}
                <div className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    id="isGift"
                    checked={isGift}
                    onChange={(e) => setIsGift(e.target.checked)}
                    className="h-4 w-4 text-brand-600 rounded"
                  />
                  <label htmlFor="isGift" className="text-sm text-gray-700">
                    This is a gift
                  </label>
                </div>
                
                {isGift && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Gift Message
                    </label>
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                      placeholder="Add a message for the gift recipient"
                      rows={3}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Payment Information
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("cod");
                        setOnlineOption(null);
                        setReceiptFile(null);
                      }}
                      className={`p-4 border rounded-md flex items-center justify-center space-x-2 ${
                        paymentMethod === "cod"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200"
                      }`}
                    >
                      <FaMoneyBill className="text-green-500" size={24} />
                      <span>Cash on {orderType === "delivery" ? "Delivery" : "Pickup"}</span>
                    </button>
                    <button
                      type="button"
                      // onClick={() => {
                      //   setPaymentMethod("online");
                      //   setOnlineOption(null);
                      //   setReceiptFile(null);
                      // }}
                      className={`p-4 border rounded-md flex flex-col items-center justify-center space-y-2 ${
                        paymentMethod === "online"
                          ? "border-brand-500 bg-brand-50"
                          : "border-gray-200 opacity-50"
                      }`}
                    >
                      <FaCreditCard className="text-brand-500" size={24} />
                      <span>Online Payment</span>
                      <span className="text-xs text-gray-500">(Coming Soon)</span>
                    </button>
                  </div>
                </div>
                {paymentMethod === "online" && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setOnlineOption("easypaisa");
                          setReceiptFile(null);
                        }}
                        className={`p-4 border rounded-md flex flex-col items-center justify-center space-y-2 ${
                          onlineOption === "easypaisa"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <FaCreditCard className="text-green-500" size={24} />
                        <span>EasyPaisa</span>
                      </button>
                      <button
                        type="button"
                        // onClick={() => {
                        //   setOnlineOption("jazzcash");
                        //   setReceiptFile(null);
                        // }}
                        className={`p-4 border rounded-md flex flex-col items-center justify-center space-y-2 ${
                          onlineOption === "jazzcash"
                            ? "border-brand-500 bg-brand-50"
                            : "border-gray-200 opacity-50"
                        }`}
                      >
                        <FaCreditCard className="text-brand-500" size={24} />
                        <span>JazzCash</span>
                        <span className="text-xs text-gray-500">(Coming Soon)</span>
                      </button>
                      <button
                        type="button"
                        // onClick={() => {
                        //   setOnlineOption("bank_transfer");
                        //   setReceiptFile(null);
                        // }}
                        className={`p-4 border rounded-md flex flex-col items-center justify-center space-y-2 ${
                          onlineOption === "bank_transfer"
                            ? "border-brand-500 bg-brand-50"
                            : "border-gray-200 opacity-50"
                        }`}
                      >
                        <FaCreditCard className="text-brand-500" size={24} />
                        <span>Bank Transfer</span>
                        <span className="text-xs text-gray-500">(Coming Soon)</span>
                      </button>
                    </div>
                    {onlineOption === "easypaisa" && (
                      <div className="mt-4 p-4 border rounded-md bg-gray-50">
                        <h3 className="text-lg font-semibold mb-2">
                          {easypaisaDetails.title}
                        </h3>
                        <p>
                          <strong>Account Number:</strong>{" "}
                          {easypaisaDetails.accountNumber}
                        </p>
                        <p>
                          <strong>Account Name:</strong>{" "}
                          {easypaisaDetails.accountName}
                        </p>
                        <p>
                          <strong>Instructions:</strong>{" "}
                          {easypaisaDetails.instructions}
                        </p>
                        <div className="mt-4">
                          <label className="block text-sm text-gray-700 mb-1">
                            Upload Payment Receipt <span className="text-brand-500">*</span>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setReceiptFile(e.target.files[0])}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md"
                          />
                        </div>
                      </div>
                    )}
                    {onlineOption === "jazzcash" && (
                      <div className="mt-4 p-4 border rounded-md bg-gray-50">
                        <h3 className="text-lg font-semibold mb-2">
                          {jazzcashDetails.title}
                        </h3>
                        <p>
                          <strong>Account Number:</strong>{" "}
                          {jazzcashDetails.accountNumber}
                        </p>
                        <p>
                          <strong>Account Name:</strong>{" "}
                          {jazzcashDetails.accountName}
                        </p>
                        <p>
                          <strong>Instructions:</strong>{" "}
                          {jazzcashDetails.instructions}
                        </p>
                        <div className="mt-4">
                          <label className="block text-sm text-gray-700 mb-1">
                            Upload Payment Receipt <span className="text-brand-500">*</span>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setReceiptFile(e.target.files[0])}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md"
                          />
                        </div>
                      </div>
                    )}
                    {onlineOption === "bank_transfer" && (
                      <div className="mt-4 p-4 border rounded-md bg-gray-50">
                        <h3 className="text-lg font-semibold mb-2">
                          {bankTransferDetails.title}
                        </h3>
                        <p>
                          <strong>Bank:</strong> {bankTransferDetails.bankName}
                        </p>
                        <p>
                          <strong>Account Number:</strong>{" "}
                          {bankTransferDetails.accountNumber}
                        </p>
                        <p>
                          <strong>Account Name:</strong>{" "}
                          {bankTransferDetails.accountName}
                        </p>
                        <p>
                          <strong>Branch:</strong> {bankTransferDetails.branch}
                        </p>
                        <p>
                          <strong>Instructions:</strong>{" "}
                          {bankTransferDetails.instructions}
                        </p>
                        <div className="mt-4">
                          <label className="block text-sm text-gray-700 mb-1">
                            Upload Payment Receipt <span className="text-brand-500">*</span>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setReceiptFile(e.target.files[0])}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {paymentMethod === "cod" && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Change Request
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-200 rounded-l-md bg-gray-50">
                        Rs.
                      </span>
                      <input
                        type="text"
                        value={changeRequest}
                        onChange={(e) => setChangeRequest(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-r-md"
                        placeholder="500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Enter amount if you need change</p>
                  </div>
                )}
              </div>
            </div>
            <div className="sticky top-8 bg-white rounded-lg p-4 sm:p-6 shadow-sm h-fit">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Your Order</h2>
                </div>
                <span className="text-lg sm:text-xl font-semibold">Rs. {formatPrice(subtotal)}</span>
              </div>
              {items.length > 0 ? (
                <div className="mb-4 space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                  {items.map((item, index) => {
                    // Calculate actual price per item (unit price)
                    const unitPrice = item.unitPrice || Number(item.price);
                    const totalItemPrice = unitPrice * (item.quantity || 1);
                    const baseTitle = getBaseTitle(item.title);
                    
                    return (
                      <div
                        key={`${item._id || index}-${index}`}
                        className="flex justify-between text-sm text-gray-700"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{baseTitle} <span className="font-normal text-xs">x{item.quantity || 1}</span></p>
                          
                          {/* Show variation type if exists */}
                          {item.type && (
                            <p className="text-xs text-gray-500">Type: {item.type}</p>
                          )}

                          {/* Display modifications in a compact way */}
                          {item.modifications && item.modifications.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {item.modifications.map((mod, i) => (
                                <p key={i}>
                                  {mod.type}: {mod.items.map(m => m.name).join(", ")}
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Legacy support for direct extras/side orders */}
                          {!item.modifications && item.selectedExtras && item.selectedExtras.length > 0 && (
                            <p className="text-xs text-gray-500">
                              Extras: {item.selectedExtras.map(e => e.name).join(", ")}
                            </p>
                          )}
                          
                          {!item.modifications && item.selectedSideOrders && item.selectedSideOrders.length > 0 && (
                            <p className="text-xs text-gray-500">
                              Side Orders: {item.selectedSideOrders.map(s => s.name).join(", ")}
                            </p>
                          )}
                        </div>
                        <span className="text-right ml-4">Rs. {formatPrice(totalItemPrice)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mb-4 py-3 text-center text-brand-600 bg-brand-50 rounded-md">
                  Your cart is empty. Please add items to continue.
                </div>
              )}
              
              <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex items-center mb-3">
                  <FaTag className="text-brand-500 mr-2" />
                  <span className="font-medium">Promo Code</span>
                </div>
                {appliedPromoCode ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="font-medium text-green-700">{appliedPromoCode.code}</span>
                        <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          {appliedPromoCode.discount}% off
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromoCode}
                        className="text-sm text-brand-600 hover:text-brand-800 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-sm text-green-600 mt-2 flex items-center">
                      <FaPercent className="mr-1" size={12} />
                      <span>
                        Additional {appliedPromoCode.discount}% off: Rs. {formatPrice(promoDiscount)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromoCode}
                        disabled={isApplyingPromo || !promoCode.trim()}
                        className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 flex items-center"
                      >
                        {isApplyingPromo ? (
                          <span className="inline-block animate-pulse">Applying...</span>
                        ) : (
                          <span>Apply</span>
                        )}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-xs text-brand-500 mt-1">{promoError}</p>
                    )}
                    {discountActive && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded-md">
                        <span className="font-medium">Note:</span> A global discount of {discountPercentage}% is already active.
                        Promo codes will provide additional discounts!
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-3 text-sm sm:text-base text-gray-600 border-t border-b border-gray-200 py-4 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rs. {formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (0%)</span>
                  <span>Rs. {formatPrice(tax)}</span>
                </div>
                {orderType === "delivery" && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>Rs. {formatPrice(deliveryFee)}</span>
                  </div>
                )}
                
                {discountActive && globalDiscount > 0 && (
                  <div className="flex justify-between text-yellow-600 font-medium">
                    <span>Global Discount ({discountPercentage}%)</span>
                    <span>- Rs. {formatPrice(globalDiscount)}</span>
                  </div>
                )}
                
                {appliedPromoCode && promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Promo Discount ({appliedPromoCode.discount}%)</span>
                    <span>- Rs. {formatPrice(promoDiscount)}</span>
                  </div>
                )}

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-brand-600 font-bold">
                    <span>Total Discount</span>
                    <span>- Rs. {formatPrice(totalDiscount)}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-base sm:text-lg font-semibold">
                  <span>Grand Total</span>
                  <span className="text-brand-600">Rs. {formatPrice(grandTotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded-md text-center">
                    <span className="font-medium">You saved Rs. {formatPrice(totalDiscount)} on this order!</span>
                    {discountActive && appliedPromoCode && (
                      <p className="mt-1">Combined discounts: Global ({discountPercentage}%) + Promo ({appliedPromoCode.discount}%)</p>
                    )}
                  </div>
                )}
                {subtotal < MIN_ORDER_VALUE && (
                  <div className="mt-2 text-xs text-brand-600">
                    Minimum order value is Rs. {MIN_ORDER_VALUE}. Please add more items.
                  </div>
                )}
              </div>
              
              {!isSiteActive && (
                <div className="mt-6 p-4 bg-brand-50 text-brand-700 rounded-md text-center">
                  {/* <p className="font-medium">Service Unavailable</p> */}
                  <p className="text-sm">Order time is 05:00 PM to 3:00 AM. Please make orders during opening hours.</p>
                </div>
              )}
              
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || items.length === 0 || subtotal < MIN_ORDER_VALUE || !isSiteActive}
                  className="w-full mt-6 bg-brand-600 text-white py-3 rounded-md hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Placing Order...
                    </span>
                  ) : (
                    "Place Order"
                  )}
                </button>
                <a
                  href="/"
                  className="block mt-4 text-center text-brand-500 hover:underline text-sm sm:text-base"
                >
                  ← Continue to add more items
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}