"use client";
import { useState, useEffect } from "react";
import { FaCreditCard, FaMoneyBill, FaClock } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useOrderTypeStore } from "../../store/orderTypeStore";
import { useCartStore } from "../../store/cart";
import { useBranchStore } from "../../store/branchStore";
import DeliveryPickupModal from "../components/DeliveryPickupModal";
import { useRouter } from "next/navigation";

const MIN_ORDER_VALUE = 1; // In Pakistani Rupees

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
  
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const [discountActive, setDiscountActive] = useState(true);

  const [paymentType, setPaymentType] = useState("cod");
  const [onlineOption, setOnlineOption] = useState(null);
  
  const [logoData, setLogoData] = useState({
    logo: "/logo.png",
    updatedAt: new Date()
  });
  const [isLogoLoading, setIsLogoLoading] = useState(true);

  const { orderType } = useOrderTypeStore();
  const { branch } = useBranchStore();
  const { items, total, clearCart } = useCartStore();
  const subtotal = total;
  const tax = 0;
  const deliveryFee = orderType === "delivery" && selectedArea ? selectedArea.fee : 0;
  const grandTotal = subtotal + tax + deliveryFee - appliedDiscount;

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
        const res = await fetch("/api/delivery-areas");
        if (res.ok) {
          const data = await res.json();
          // Filter to only show active delivery areas
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
    
    fetchDiscountSettings();
    if (orderType === "delivery") {
      fetchDeliveryAreas();
    }
  }, [orderType]);

  useEffect(() => {
    if (discountActive) {
      setAppliedDiscount(subtotal * (discountPercentage / 100));
    } else {
      setAppliedDiscount(0);
    }
  }, [subtotal, discountPercentage, discountActive]);

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
    
    if (paymentType === "online") {
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
    
    setIsSubmitting(true);

    try {
      const orderItems = items.map((item) => ({
        id: item.id,
        name: item.title,
        price: item.price,
        type: item.type,
        quantity: item.quantity,
        title: item.title,
        imageUrl: item.imageUrl || `/api/placeholder/100/100`,
      }));
      
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("mobileNumber", mobileNumber);
      formData.append("orderType", orderType);
      formData.append("branch", branch?._id);
      
      if (orderType === "delivery") {
        const completeAddress = deliveryAddress.trim() + ", " + selectedArea.name;
        formData.append("alternateMobile", alternateMobile);
        formData.append("deliveryAddress", completeAddress);
        formData.append("nearestLandmark", nearestLandmark);
        formData.append("area", selectedArea.name);
      } else if (orderType === "pickup") {
        formData.append("pickupTime", pickupTime + " minutes");
      }
      
      formData.append("email", email);
      formData.append("paymentInstructions", paymentInstructions);
      formData.append("paymentMethod", paymentType);
      formData.append("subtotal", subtotal.toString());
      formData.append("tax", tax.toString());
      formData.append("discount", appliedDiscount.toString());
      formData.append("total", grandTotal.toString());
      formData.append("discountPercentage", discountPercentage.toString());
      formData.append("discountActive", discountActive ? "true" : "false");
      formData.append("isGift", isGift ? "true" : "false");
      formData.append("giftMessage", giftMessage);
      formData.append("items", JSON.stringify(orderItems));
      formData.append("changeRequest", changeRequest);

      if (paymentType === "online") {
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

      const orderDetails = {
        orderId: data.orderId || `ORD-${Date.now()}`,
        orderDate: new Date().toISOString(),
        status: "Confirmed",
        estimatedDelivery: orderType === "delivery" ? "Within 1 hour" : `Ready in ${pickupTime} minutes`,
        customerName: fullName,
        fullName: fullName,
        mobileNumber: mobileNumber,
        email: email,
        orderType: orderType,
        branch: branch?.name || "Main Branch",
        paymentMethod: paymentType === "cod" ? "Cash on Delivery" : "Online Payment",
        bankName:
          paymentType === "online"
            ? onlineOption === "easypaisa"
              ? "EasyPaisa"
              : onlineOption === "jazzcash"
              ? "JazzCash"
              : "Bank Transfer"
            : undefined,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        discount: appliedDiscount,
        discountPercentage: discountActive ? discountPercentage : 0,
        total: grandTotal,
        items: orderItems,
      };
      
      if (orderType === "delivery") {
        orderDetails.deliveryAddress = deliveryAddress + ", " + selectedArea?.name;
        orderDetails.nearestLandmark = nearestLandmark;
        orderDetails.area = selectedArea?.name;
      } else if (orderType === "pickup") {
        orderDetails.pickupTime = pickupTime + " minutes";
      }

      sessionStorage.setItem("lastOrder", JSON.stringify(orderDetails));

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

  const resetFormFields = () => {
    setTitle("Mr.");
    setFullName("");
    setMobileNumber("");
    setAlternateMobile("");
    setDeliveryAddress("");
    setNearestLandmark("");
    setEmail("");
    setPaymentInstructions("");
    setPaymentType("cod");
    setOnlineOption(null);
    setIsGift(false);
    setGiftMessage("");
    setAppliedDiscount(0);
    setSelectedArea(null);
    setReceiptFile(null);
    setChangeRequest("");
    setPickupTime("20");
  };

  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
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
                      <>This is a Delivery Order <span className="text-red-600">🚚</span></>
                    ) : (
                      <>This is a Pickup Order <span className="text-red-600">🏪</span></>
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
                      Full Name <span className="text-red-500">*Required</span>
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
                      Mobile Number <span className="text-red-500">*Required</span>
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
                        Pick Up Time <span className="text-red-500">*Required</span>
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
                        Alternate Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={alternateMobile}
                        onChange={(e) => setAlternateMobile(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                        placeholder="03xx-xxxxxxx"
                      />
                    </div>
                  )}
                </div>

                {orderType === "delivery" && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Delivery Address <span className="text-red-500">*Required</span>
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
                        Select Area <span className="text-red-500">*Required</span>
                      </label>
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
                    Payment Instructions
                  </label>
                  <textarea
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md"
                    placeholder="Any notes or instructions about payment?"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Payment Information
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType("cod");
                        setOnlineOption(null);
                        setReceiptFile(null);
                      }}
                      className={`p-4 border rounded-md flex items-center justify-center space-x-2 ${
                        paymentType === "cod"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200"
                      }`}
                    >
                      <FaMoneyBill className="text-green-500" size={24} />
                      <span>Cash on {orderType === "delivery" ? "Delivery" : "Pickup"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType("online");
                        setOnlineOption(null);
                        setReceiptFile(null);
                      }}
                      className={`p-4 border rounded-md flex items-center justify-center space-x-2 ${
                        paymentType === "online"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <FaCreditCard className="text-blue-500" size={24} />
                      <span>Online Payment</span>
                    </button>
                  </div>
                </div>
                {paymentType === "online" && (
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
                        className={`p-4 border rounded-md flex flex-col items-center justify-center space-y-2 ${
                          onlineOption === "jazzcash"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <FaCreditCard className="text-blue-500" size={24} />
                        <span>JazzCash</span>
                      </button>
                      <button
                        type="button"
                        className={`p-4 border rounded-md flex flex-col items-center justify-center space-y-2 ${
                          onlineOption === "bank_transfer"
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200"
                        }`}
                      >
                        <FaCreditCard className="text-red-500" size={24} />
                        <span>Bank Transfer</span>
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
                            Upload Payment Receipt <span className="text-red-500">*</span>
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
                            Upload Payment Receipt <span className="text-red-500">*</span>
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
                            Upload Payment Receipt <span className="text-red-500">*</span>
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
                {paymentType === "cod" && (
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
                <span className="text-lg sm:text-xl font-semibold">Rs. {subtotal}</span>
              </div>
              {items.length > 0 ? (
                <div className="mb-4 space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex justify-between text-sm text-gray-700"
                    >
                      <span>
                        {item.title} x {item.quantity}
                      </span>
                      <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-4 py-3 text-center text-red-600 bg-red-50 rounded-md">
                  Your cart is empty. Please add items to continue.
                </div>
              )}
              <div className="space-y-4 text-sm sm:text-base text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (0%)</span>
                  <span>Rs. {tax}</span>
                </div>
                {orderType === "delivery" && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>Rs. {deliveryFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-yellow-500">
                  <span>Discount {discountActive ? `(${discountPercentage}%)` : '(0%)'}</span>
                  <span>Rs. {appliedDiscount}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-base sm:text-lg font-semibold">
                  <span>Grand Total</span>
                  <span>Rs. {grandTotal}</span>
                </div>
                {subtotal < MIN_ORDER_VALUE && (
                  <div className="mt-2 text-xs text-red-600">
                    Minimum order value is Rs. {MIN_ORDER_VALUE}. Please add more items.
                  </div>
                )}
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || items.length === 0 || subtotal < MIN_ORDER_VALUE}
                  className="w-full mt-6 bg-red-600 text-white py-3 rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Placing Order..." : "Place Order"}
                </button>
                <a
                  href="/"
                  className="block mt-4 text-center text-blue-500 hover:underline text-sm sm:text-base"
                >
                  ← continue to add more items
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}