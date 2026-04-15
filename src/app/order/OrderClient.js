"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Clock, MapPin, Phone, User, 
  Package, Truck, Store, CreditCard, 
  Calendar, Clipboard, ChevronRight, Receipt, Printer, ArrowLeft
} from "lucide-react";

function OrderDetailContent() {
  const router = useRouter();
  const params = useParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoData, setLogoData] = useState({
    logo: "/logo.png",
    updatedAt: new Date()
  });
  const [isLogoLoading, setIsLogoLoading] = useState(true);
  const [branchInfo, setBranchInfo] = useState(null);

  const getLogoTimestamp = () => {
    return logoData?.updatedAt ? new Date(logoData.updatedAt).getTime() : Date.now();
  };

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

  useEffect(() => {
    fetchLogoData();
    
    // Get the order ID from URL params
    const orderId = params.id;
    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      setError("Order ID is missing");
      setLoading(false);
    }
  }, [params.id]);

  const fetchOrderDetails = async (orderId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Order not found");
        } else {
          throw new Error("Failed to fetch order details");
        }
      }
      
      const data = await response.json();
      setOrderDetails(data);
      
      if (data.branch) {
        if (typeof data.branch === 'object' && data.branch.name) {
          setBranchInfo(data.branch);
        } else if (typeof data.branch === 'string') {
          fetchBranchInfo(data.branch);
        }
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchInfo = async (branchId) => {
    if (!branchId) return;
    
    try {
      const res = await fetch(`/api/branch/${branchId}`);
      if (res.ok) {
        const data = await res.json();
        setBranchInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch branch details:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  // Function to safely get numeric values with fallback to prevent NaN
  const safeGetNumber = (value, fallback = 0) => {
    if (value === undefined || value === null) return fallback;
    
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case "Pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800", ring: "ring-yellow-600/20" };
      case "In-Process":
        return { bg: "bg-brand-100", text: "text-brand-800", ring: "ring-brand-600/20" };
      case "Dispatched":
        return { bg: "bg-purple-100", text: "text-purple-800", ring: "ring-purple-600/20" };
      case "Complete":
        return { bg: "bg-green-100", text: "text-green-800", ring: "ring-green-600/20" };
      case "Cancel":
        return { bg: "bg-brand-100", text: "text-brand-800", ring: "ring-brand-600/20" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", ring: "ring-gray-600/20" };
    }
  };
  
  const getStatusDescription = (status) => {
    switch(status) {
      case "Pending":
        return "Your order has been received and is awaiting processing.";
      case "In-Process":
        return "Your order is being prepared in our kitchen.";
      case "Dispatched":
        return "Your order is on the way to your delivery address.";
      case "Complete":
        return "Your order has been delivered successfully.";
      case "Cancel":
        return "Your order has been canceled.";
      default:
        return "Your order status is being updated.";
    }
  };
  
  const getStatusSteps = () => {
    const statuses = ["Pending", "In-Process", "Dispatched", "Complete"];
    const currentStatus = orderDetails?.status || "Pending";
    
    if (currentStatus === "Cancel") {
      return [
        { name: "Pending", completed: true },
        { name: "Canceled", completed: true }
      ];
    }
    
    const currentIndex = statuses.indexOf(currentStatus);
    
    return statuses.map((status, index) => ({
      name: status,
      completed: index <= currentIndex
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-700">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 text-brand-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Error Loading Order</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/orders')}
            className="bg-brand-600 text-white py-3 px-6 rounded-lg hover:bg-brand-700 transition duration-200 shadow-lg"
          >
            Return to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">No Order Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find any order details to display.</p>
          <button
            onClick={() => router.push('/orders')}
            className="bg-brand-600 text-white py-3 px-6 rounded-lg hover:bg-brand-700 transition duration-200 shadow-lg"
          >
            View Your Orders
          </button>
        </div>
      </div>
    );
  }

  // Calculate safe numeric values for the order summary
  const subtotal = safeGetNumber(orderDetails.subtotal);
  const deliveryFee = safeGetNumber(orderDetails.deliveryFee);
  const total = safeGetNumber(orderDetails.total);
  const tax = safeGetNumber(orderDetails.tax);
  
  // Calculate discount components
  const globalDiscount = safeGetNumber(orderDetails.globalDiscount);
  const promoDiscount = safeGetNumber(orderDetails.promoDiscount);
  
  // Calculate total discount (sum of global and promo discounts)
  const totalDiscount = globalDiscount + promoDiscount;
  
  // If totalDiscount is still 0 but we have a discount field in orderDetails, use that
  const displayDiscount = totalDiscount || safeGetNumber(orderDetails.discount) || safeGetNumber(orderDetails.totalDiscount);
  
  const statusColor = getStatusColor(orderDetails.status);
  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {!isLogoLoading && (
                <img 
                  src={`${logoData.logo || "/logo.png"}?v=${getLogoTimestamp()}`}
                  alt="Logo" 
                  className="h-12 w-auto" 
                />
              )}
              <div className="ml-3">
                <h1 className="font-bold text-lg text-gray-900">King Ice Restaurant</h1>
                <p className="text-sm text-green-600">Open Now</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-brand-700 transition duration-150"
              >
                Order More Food
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            <Link href="/orders" className="text-gray-500 hover:text-gray-700">Orders</Link>
            <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            <span className="font-medium text-gray-900">Order #{orderDetails.orderNo || orderDetails._id}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Order header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order #{orderDetails.orderNo || orderDetails._id}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Placed on {orderDetails.createdAt ? formatDate(orderDetails.createdAt) : formatDate(orderDetails.orderDate || new Date())}
                </p>
              </div>
              <div className={`mt-4 sm:mt-0 px-4 py-2 rounded-full ${statusColor.bg} ${statusColor.text} font-medium text-sm inline-flex items-center ring-1 ring-inset ${statusColor.ring}`}>
                <span className="h-2 w-2 rounded-full bg-current mr-2"></span>
                {orderDetails.status || "Pending"}
              </div>
            </div>
          </div>
          
          {/* Order progress tracker */}
          <div className="px-6 py-5 bg-gray-50">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Order Status</h3>
            <div className="mb-4">
              <p className="text-gray-600">{getStatusDescription(orderDetails.status)}</p>
              
              {orderDetails.status === "Cancel" && orderDetails.cancelReason && (
                <div className="mt-2 p-3 bg-brand-50 border border-brand-100 rounded-md text-brand-700 text-sm">
                  <p className="font-semibold">Cancellation Reason:</p>
                  <p>{orderDetails.cancelReason}</p>
                </div>
              )}
              
              {orderDetails.status === "Dispatched" && orderDetails.riderName && (
                <div className="mt-2 p-3 bg-purple-50 border border-purple-100 rounded-md text-purple-700 text-sm">
                  <p className="font-semibold">Delivery by:</p>
                  <p>{orderDetails.riderName}</p>
                </div>
              )}
            </div>
            
            {orderDetails.status !== "Cancel" && (
              <div className="relative">
                <div className="overflow-hidden h-2 mb-6 text-xs flex bg-gray-200 rounded">
                  {statusSteps.map((step, index) => (
                    <div 
                      key={step.name}
                      style={{ width: `${100/statusSteps.length}%` }} 
                      className={`shadow-none flex flex-col text-center whitespace-nowrap justify-center ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between">
                  {statusSteps.map((step, index) => (
                    <div key={step.name} className="text-center">
                      <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center border-2 ${step.completed ? 'border-green-500 bg-green-500' : 'border-gray-400 bg-white'}`}>
                        {step.completed && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                      <div className={`text-xs mt-1 ${step.completed ? 'text-green-500 font-medium' : 'text-gray-500'}`}>
                        {step.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-0">
            {/* Customer Information */}
            <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-brand-600 mr-2" />
                <h3 className="font-medium text-gray-900">Customer Information</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{orderDetails.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="font-medium text-gray-900">{orderDetails.mobileNumber}</p>
                </div>
                {orderDetails.alternateMobile && (
                  <div>
                    <p className="text-xs text-gray-500">Alternative Phone</p>
                    <p className="font-medium text-gray-900">{orderDetails.alternateMobile}</p>
                  </div>
                )}
                {orderDetails.email && (
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{orderDetails.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery/Pickup Information */}
            <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="flex items-center mb-4">
                {orderDetails.orderType === "delivery" ? (
                  <Truck className="h-5 w-5 text-brand-600 mr-2" />
                ) : (
                  <Store className="h-5 w-5 text-brand-600 mr-2" />
                )}
                <h3 className="font-medium text-gray-900">
                  {orderDetails.orderType === "delivery" ? "Delivery Information" : "Pickup Information"}
                </h3>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                {orderDetails.orderType === "delivery" && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500">Delivery Address</p>
                      <p className="font-medium text-gray-900">{orderDetails.deliveryAddress}</p>
                    </div>
                    {orderDetails.nearestLandmark && (
                      <div>
                        <p className="text-xs text-gray-500">Nearest Landmark</p>
                        <p className="font-medium text-gray-900">{orderDetails.nearestLandmark}</p>
                      </div>
                    )}
                    {orderDetails.area && (
                      <div>
                        <p className="text-xs text-gray-500">Area</p>
                        <p className="font-medium text-gray-900">{orderDetails.area}</p>
                      </div>
                    )}
                  </>
                )}
                
                {orderDetails.orderType === "pickup" && orderDetails.pickupTime && (
                  <div>
                    <p className="text-xs text-gray-500">Pickup Time</p>
                    <p className="font-medium text-gray-900">{orderDetails.pickupTime}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-xs text-gray-500">Branch</p>
                  <p className="font-medium text-gray-900">
                    {branchInfo?.name || 
                     (orderDetails.branch?.name) || 
                     (typeof orderDetails.branch === "string" ? "Loading..." : "Main Branch")}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="h-5 w-5 text-brand-600 mr-2" />
                <h3 className="font-medium text-gray-900">Payment Information</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <p className="font-medium text-gray-900">
                    {orderDetails.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
                  </p>
                </div>
                {orderDetails.paymentMethod === "online" && orderDetails.bankName && (
                  <div>
                    <p className="text-xs text-gray-500">Payment Platform</p>
                    <p className="font-medium text-gray-900">{orderDetails.bankName}</p>
                  </div>
                )}
                {orderDetails.changeRequest && (
                  <div>
                    <p className="text-xs text-gray-500">Change Request</p>
                    <p className="font-medium text-gray-900">Rs. {orderDetails.changeRequest}</p>
                  </div>
                )}
                {orderDetails.paymentInstructions && (
                  <div>
                    <p className="text-xs text-gray-500">Payment Instructions</p>
                    <p className="font-medium text-gray-900">{orderDetails.paymentInstructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {orderDetails.isGift && orderDetails.giftMessage && (
            <div className="px-6 py-4 bg-pink-50 border-t border-pink-100">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                <h3 className="font-medium text-pink-900">Gift Message</h3>
              </div>
              <div className="p-3 bg-white rounded-md text-gray-700 border border-pink-200">
                {orderDetails.giftMessage}
              </div>
            </div>
          )}

          <div className="px-6 py-5 border-t border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderDetails.items && orderDetails.items.map((item, index) => {
                    // Calculate item quantity - some items might have it embedded in name like "Pizza x2"
                    const itemName = item.name;
                    const nameParts = itemName.split(' x');
                    const quantity = nameParts.length > 1 && !isNaN(parseInt(nameParts[nameParts.length-1])) 
                      ? parseInt(nameParts[nameParts.length-1]) 
                      : (item.quantity || 1);
                    
                    const displayName = nameParts.length > 1 && !isNaN(parseInt(nameParts[nameParts.length-1])) 
                      ? nameParts.slice(0, -1).join(' x')
                      : itemName;
                    
                    const price = safeGetNumber(item.price);
                    const itemTotal = price * quantity;
                    
                    return (
                      <tr key={index}>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden bg-gray-100">
                              <img 
                                src={item.imageUrl || `/api/placeholder/100/100`} 
                                alt={displayName} 
                                className="h-full w-full object-cover" 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{displayName}</div>
                              {item.type && <div className="text-xs text-gray-500">{item.type}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-gray-500">
                          {quantity}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-gray-500">
                          Rs. {price}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                          Rs. {itemTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-gray-50 px-6 py-5 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="w-full max-w-md">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal:</span>
                    <span className="text-gray-900">Rs. {subtotal}</span>
                  </div>
                  
                  {tax > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Tax:</span>
                      <span className="text-gray-900">Rs. {tax}</span>
                    </div>
                  )}
                  
                  {orderDetails.orderType === "delivery" && (
                    <div className="flex justify-between text-gray-500">
                      <span>Delivery Fee:</span>
                      <span className="text-gray-900">Rs. {deliveryFee}</span>
                    </div>
                  )}
                  
                  {displayDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>- Rs. {displayDiscount}</span>
                    </div>
                  )}
                  
                  {orderDetails.promoCode && (
                    <div className="flex justify-between text-green-600">
                      <span>Promo Code:</span>
                      <span>{orderDetails.promoCode}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 mt-1 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-base font-medium text-gray-900">Total:</span>
                      <span className="text-base font-bold text-gray-900">Rs. {total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between space-x-4">
            <Link
              href="/orders"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Orders
            </Link>
            <div className="flex space-x-3">
              <button
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex items-center px-4 py-2 bg-brand-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                Order More Food
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white mt-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center">
                {!isLogoLoading && (
                  <img 
                    src={`${logoData.logo || "/logo.png"}?v=${getLogoTimestamp()}`}
                    alt="Logo" 
                    className="h-10 w-auto" 
                  />
                )}
                <h3 className="ml-2 font-medium text-gray-900">King Ice Restaurant</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Serving delicious meals and refreshing ice cream across Pakistan.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Contact Us</h3>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <a href="tel:+923122754064" className="hover:text-brand-600">+92 312 2754064</a>
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Landhi, Karachi</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Quick Links</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/" className="text-sm text-gray-600 hover:text-brand-600">Home</Link>
                </li>
                <li>
                  <Link href="/orders" className="text-sm text-gray-600 hover:text-brand-600">My Orders</Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              © {new Date().getFullYear()} King Ice Restaurant. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      
      <style jsx global>{`
        @media print {
          header, nav, footer, .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
          }
          .bg-gray-50 {
            background-color: white !important;
          }
        }
      `}</style>
    </div>
  );
}

function OrderLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-700">Loading order details...</p>
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }) {
  return (
    <Suspense fallback={<OrderLoading />}>
      <OrderDetailContent />
    </Suspense>
  );
}