"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Phone,
  CreditCard,
  Truck,
  Store,
  Calendar,
  RefreshCw,
  CheckCircle,
  Gift,
  Clock,
  X,
  AlertCircle,
  Home,
  Navigation,
  Printer
} from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveOrder, setLiveOrder] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [extractedArea, setExtractedArea] = useState(null);
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [areaFee, setAreaFee] = useState(null);

  useEffect(() => {
    const loadOrderDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${id}`);

        if (res.ok) {
          const data = await res.json();
          setOrder(data);

          // Extract area from delivery address if present
          if (data.deliveryAddress && data.orderType === "delivery") {
            extractAreaFromAddress(data.deliveryAddress);
          }
        } else {
          setError("Order not found");
        }
      } catch (err) {
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    // Fetch all delivery areas for reference
    const fetchDeliveryAreas = async () => {
      try {
        const res = await fetch("/api/delivery-areas");
        if (res.ok) {
          const areas = await res.json();
          setDeliveryAreas(areas);
        }
      } catch (error) {
        // Silent fail - we'll just not show area fees if this fails
      }
    };

    if (id) {
      loadOrderDetails();
      fetchDeliveryAreas();
    }
  }, [id]);

  // Extract area name from the delivery address
  const extractAreaFromAddress = (address) => {
    if (!address) return;

    // The address format is typically: "Street address, Area name"
    const addressParts = address.split(', ');
    if (addressParts.length > 1) {
      const possibleArea = addressParts[addressParts.length - 1];
      setExtractedArea(possibleArea);
    }
  };

  // Find area fee from the extracted area name
  useEffect(() => {
    if (extractedArea && deliveryAreas.length > 0) {
      const matchingArea = deliveryAreas.find(area =>
        area.name.toLowerCase() === extractedArea.toLowerCase());

      if (matchingArea) {
        setAreaFee(matchingArea.fee);
      }
    }
  }, [extractedArea, deliveryAreas]);

  // Check current status from API
  const checkLiveStatus = async () => {
    if (!order || !id) return;

    setIsCheckingStatus(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const liveOrderData = await res.json();
        setLiveOrder(liveOrderData);
        setOrder(liveOrderData); // Update the current order with live data
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch {
      return "Unknown date";
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "in-process":
      case "in process":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "dispatched":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "complete":
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancel":
      case "cancelled":
      case "canceled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Get status description
  const getStatusDescription = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "Your order has been received and is awaiting processing.";
      case "in-process":
      case "in process":
        return "Your order is being prepared in our kitchen.";
      case "dispatched":
        return "Your order is on the way to your delivery address.";
      case "complete":
      case "completed":
        return "Your order has been delivered successfully.";
      case "cancel":
      case "cancelled":
      case "canceled":
        return "Your order has been canceled.";
      default:
        return "Your order status is being updated.";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Clock className="h-5 w-5" />;
      case "in-process":
      case "in process":
        return <RefreshCw className="h-5 w-5" />;
      case "dispatched":
        return <Truck className="h-5 w-5" />;
      case "complete":
      case "completed":
        return <CheckCircle className="h-5 w-5" />;
      case "cancel":
      case "cancelled":
      case "canceled":
        return <X className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  // Function to safely get numeric values
  const safeGetNumber = (value, fallback = 0) => {
    if (value === undefined || value === null) return fallback;
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  };

  // Get status percentage for progress bar
  const getStatusPercentage = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return 25;
      case "in-process":
      case "in process": return 50;
      case "dispatched": return 75;
      case "complete":
      case "completed": return 100;
      case "cancel":
      case "cancelled":
      case "canceled": return 0;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">{error}</h1>
          <p className="text-gray-600 mb-6">We couldn't find the order details you're looking for.</p>
          <Link
            href="/order"
            className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition duration-200 shadow-sm inline-block font-medium"
          >
            Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Order Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find the order details you're looking for.</p>
          <Link
            href="/order"
            className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition duration-200 shadow-sm inline-block font-medium"
          >
            Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  // Use live order data if available, otherwise use stored order data
  const displayOrder = liveOrder || order;
  const currentStatus = displayOrder.status || "Pending";
  const statusColorClass = getStatusColor(currentStatus);
  const StatusIcon = getStatusIcon(currentStatus);
  const statusPercentage = getStatusPercentage(currentStatus);

  // Get a cleaner address (without the area part if it was extracted)
  const getCleanAddress = () => {
    if (!displayOrder.deliveryAddress || !extractedArea) return displayOrder.deliveryAddress;

    // Remove the area from the end of the address
    const addressWithoutArea = displayOrder.deliveryAddress.replace(`, ${extractedArea}`, '');
    return addressWithoutArea;
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/order')}
                className="mr-4 p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Back to orders"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Order #{displayOrder.orderNo || displayOrder._id?.substring(0, 8)}
                </h1>
                <p className="text-sm text-gray-500">
                  Placed on {formatDate(displayOrder.orderDate || displayOrder.date || displayOrder.createdAt)}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex space-x-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </button>
              <button
                onClick={checkLiveStatus}
                disabled={isCheckingStatus}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {isCheckingStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent mr-1"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Check Status
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Status Tracker */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-full ${statusColorClass}`}>
                {StatusIcon}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Order Status: <span className={`${statusColorClass.replace('bg-', 'text-').replace('border-', '')}`}>{currentStatus}</span>
              </h2>
            </div>

            {currentStatus.toLowerCase() !== "cancel" && currentStatus.toLowerCase() !== "cancelled" && currentStatus.toLowerCase() !== "canceled" && (
              <div className="mb-6">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${statusColorClass}`}>
                        {statusPercentage}% Complete
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                    <div style={{ width: `${statusPercentage}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${statusColorClass.replace('bg-', 'bg-').replace('text-', 'bg-').replace('-50', '-500').replace('-200', '-500')}`}></div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs text-center">
                  <div className={`p-2 rounded ${currentStatus.toLowerCase() === "pending" || currentStatus.toLowerCase() === "in-process" || currentStatus.toLowerCase() === "dispatched" || currentStatus.toLowerCase() === "completed" || currentStatus.toLowerCase() === "complete" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-400"}`}>
                    <Clock className="h-4 w-4 mx-auto mb-1" />
                    Pending
                  </div>
                  <div className={`p-2 rounded ${currentStatus.toLowerCase() === "in-process" || currentStatus.toLowerCase() === "dispatched" || currentStatus.toLowerCase() === "completed" || currentStatus.toLowerCase() === "complete" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-400"}`}>
                    <RefreshCw className="h-4 w-4 mx-auto mb-1" />
                    In Process
                  </div>
                  <div className={`p-2 rounded ${currentStatus.toLowerCase() === "dispatched" || currentStatus.toLowerCase() === "completed" || currentStatus.toLowerCase() === "complete" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-400"}`}>
                    <Truck className="h-4 w-4 mx-auto mb-1" />
                    Dispatched
                  </div>
                  <div className={`p-2 rounded ${currentStatus.toLowerCase() === "completed" || currentStatus.toLowerCase() === "complete" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-400"}`}>
                    <CheckCircle className="h-4 w-4 mx-auto mb-1" />
                    Completed
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-gray-700">{getStatusDescription(currentStatus)}</p>

              {currentStatus.toLowerCase() === "dispatched" && displayOrder.riderName && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-lg text-purple-800">
                  <div className="flex items-center">
                    <Truck className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="font-medium">Your order is being delivered by: {displayOrder.riderName}</p>
                  </div>
                </div>
              )}

              {currentStatus.toLowerCase().includes("cancel") && displayOrder.cancelReason && (
                <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-800">
                  <div className="flex items-center">
                    <X className="h-5 w-5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Cancellation Reason:</p>
                      <p>{displayOrder.cancelReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden sm:block sm:flex items-center justify-center border-t border-gray-200 bg-gray-50 px-4 py-3">
            <button
              onClick={checkLiveStatus}
              disabled={isCheckingStatus}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isCheckingStatus ? "Checking for updates..." : "Check for status updates"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Order Summary Card */}
          <div className="col-span-3 md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${displayOrder.orderType === "delivery" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                  {displayOrder.orderType === "delivery" ? (
                    <>
                      <Truck className="h-3 w-3 mr-1" />
                      Delivery
                    </>
                  ) : (
                    <>
                      <Store className="h-3 w-3 mr-1" />
                      Pickup
                    </>
                  )}
                </span>
              </div>

              {/* Order Items */}
              <div className="px-6 py-5">
                <div className="divide-y divide-gray-200">
                  {displayOrder.items && displayOrder.items.map((item, index) => {
                    const rawName = item.name || item.title;
                    const match = rawName?.match(/(.*) x(\d+)$/);
                    let displayName = rawName;
                    let extractedQty = null;
                    if (match) {
                      displayName = match[1];
                      extractedQty = parseInt(match[2], 10);
                    }
                    const displayQuantity = item.quantity || extractedQty || 1;

                    return (
                      <div key={index} className="py-4 flex items-center">
                        {/* <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name || item.title} 
                              className="h-full w-full object-cover object-center" 
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                              <Package className="h-8 w-8" />
                            </div>
                          )}
                        </div> */}
                        <div className="ml-4 flex-1">
                          <h4 className="text-base font-medium text-gray-900">{displayName}</h4>
                          {item.type && <p className="text-sm text-gray-500">{item.type}</p>}
                          <div className="mt-1 flex justify-between">
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Qty: {displayQuantity}</span>
                              <span className="mx-2">·</span>
                              <span>Price: Rs. {item.price}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">Rs. {item.price * displayQuantity}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 px-6 py-5 border-t border-gray-200">
                <div className="flex justify-end">
                  <div className="w-full max-w-xs">
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <dt>Subtotal</dt>
                        <dd className="text-gray-900 font-medium">Rs. {safeGetNumber(displayOrder.subtotal).toLocaleString()}</dd>
                      </div>

                      {safeGetNumber(displayOrder.tax) > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <dt>Tax</dt>
                          <dd className="text-gray-900 font-medium">Rs. {safeGetNumber(displayOrder.tax).toLocaleString()}</dd>
                        </div>
                      )}

                      {displayOrder.orderType === "delivery" && (
                        <div className="flex justify-between text-gray-500">
                          <dt>
                            Delivery Fee
                            {areaFee !== null && <span className="text-xs ml-1">({extractedArea})</span>}
                          </dt>
                          <dd className="text-gray-900 font-medium">
                            Rs. {areaFee !== null ? areaFee.toLocaleString() : safeGetNumber(displayOrder.deliveryFee).toLocaleString()}
                          </dd>
                        </div>
                      )}

                      {safeGetNumber(displayOrder.globalDiscount) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <dt>Global Discount {displayOrder.globalDiscountPercentage ? `(${displayOrder.globalDiscountPercentage}%)` : ''}</dt>
                          <dd>- Rs. {safeGetNumber(displayOrder.globalDiscount).toLocaleString()}</dd>
                        </div>
                      )}

                      {displayOrder.promoCode && safeGetNumber(displayOrder.promoDiscount) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <dt>Promo Discount ({displayOrder.promoCode})</dt>
                          <dd>- Rs. {safeGetNumber(displayOrder.promoDiscount).toLocaleString()}</dd>
                        </div>
                      )}

                      {safeGetNumber(displayOrder.totalDiscount || displayOrder.discount) > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                          <dt>Total Discount</dt>
                          <dd>- Rs. {safeGetNumber(displayOrder.totalDiscount || displayOrder.discount).toLocaleString()}</dd>
                        </div>
                      )}

                      <div className="pt-3 mt-1 border-t border-gray-200">
                        <div className="flex justify-between">
                          <dt className="text-base font-medium text-gray-900">Total</dt>
                          <dd className="text-base font-bold text-gray-900">Rs. {safeGetNumber(displayOrder.total).toLocaleString()}</dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Gift information if applicable */}
            {displayOrder.isGift && displayOrder.giftMessage && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center">
                    <Gift className="h-5 w-5 text-pink-600 mr-2" />
                    <h3 className="font-medium text-gray-900">Gift Message</h3>
                  </div>
                </div>
                <div className="p-6 bg-pink-50">
                  <div className="p-4 bg-white rounded-lg border border-pink-100 text-gray-700 italic">
                    "{displayOrder.giftMessage}"
                  </div>
                </div>
              </div>
            )}

            {/* Order Timeline */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="font-medium text-gray-900">Order Timeline</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900">Order Placed</p>
                              <p className="text-sm text-gray-500">Your order has been successfully placed.</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {formatDate(displayOrder.orderDate || displayOrder.date || displayOrder.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>

                    {currentStatus.toLowerCase() !== "pending" && (
                      <li>
                        <div className="relative pb-8">
                          {currentStatus.toLowerCase() !== "in-process" && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                <RefreshCw className="h-5 w-5 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">Order Processing</p>
                                <p className="text-sm text-gray-500">Your order is being prepared in our kitchen.</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {/* Estimated time based on original order */}
                                {formatDate(new Date(new Date(displayOrder.orderDate || displayOrder.date || displayOrder.createdAt).getTime() + 20 * 60000))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    )}

                    {(currentStatus.toLowerCase() === "dispatched" || currentStatus.toLowerCase() === "completed" || currentStatus.toLowerCase() === "complete") && (
                      <li>
                        <div className="relative pb-8">
                          {currentStatus.toLowerCase() !== "dispatched" && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                                <Truck className="h-5 w-5 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">Out for Delivery</p>
                                <p className="text-sm text-gray-500">Your order is on its way to you!</p>
                                {displayOrder.riderName && (
                                  <p className="text-sm text-purple-700 mt-1">Delivery by: {displayOrder.riderName}</p>
                                )}
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {/* Estimated time based on original order */}
                                {formatDate(new Date(new Date(displayOrder.orderDate || displayOrder.date || displayOrder.createdAt).getTime() + 40 * 60000))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    )}

                    {(currentStatus.toLowerCase() === "completed" || currentStatus.toLowerCase() === "complete") && (
                      <li>
                        <div className="relative">
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                <CheckCircle className="h-5 w-5 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">Order Completed</p>
                                <p className="text-sm text-gray-500">Your order has been delivered successfully. Enjoy!</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {/* Estimated time based on original order */}
                                {formatDate(new Date(new Date(displayOrder.orderDate || displayOrder.date || displayOrder.createdAt).getTime() + 60 * 60000))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    )}

                    {(currentStatus.toLowerCase() === "cancel" || currentStatus.toLowerCase() === "cancelled" || currentStatus.toLowerCase() === "canceled") && (
                      <li>
                        <div className="relative">
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center ring-8 ring-white">
                                <X className="h-5 w-5 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">Order Canceled</p>
                                {displayOrder.cancelReason ? (
                                  <p className="text-sm text-gray-500">Reason: {displayOrder.cancelReason}</p>
                                ) : (
                                  <p className="text-sm text-gray-500">Your order has been canceled.</p>
                                )}
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {formatDate(displayOrder.updatedAt || new Date())}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Information */}
          <div className="col-span-3 md:col-span-1 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="font-medium text-gray-900">Customer Information</h3>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{displayOrder.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <a href={`tel:${displayOrder.mobileNumber}`} className="font-medium text-gray-900 hover:text-red-600">{displayOrder.mobileNumber}</a>
                </div>
                {displayOrder.alternateMobile && (
                  <div>
                    <p className="text-xs text-gray-500">Alternative Phone</p>
                    <a href={`tel:${displayOrder.alternateMobile}`} className="font-medium text-gray-900 hover:text-red-600">{displayOrder.alternateMobile}</a>
                  </div>
                )}
                {displayOrder.email && (
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <a href={`mailto:${displayOrder.email}`} className="font-medium text-gray-900 hover:text-red-600">{displayOrder.email}</a>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery/Pickup Information */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center">
                  {displayOrder.orderType === "delivery" ? (
                    <Truck className="h-5 w-5 text-red-600 mr-2" />
                  ) : (
                    <Store className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <h3 className="font-medium text-gray-900">
                    {displayOrder.orderType === "delivery" ? "Delivery Information" : "Pickup Information"}
                  </h3>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                {displayOrder.orderType === "delivery" ? (
                  <>
                    <div>
                      <div className="flex items-center mb-1">
                        <Home className="h-4 w-4 text-gray-500 mr-1.5" />
                        <p className="text-xs text-gray-500">Delivery Address</p>
                      </div>
                      <p className="font-medium text-gray-900">{getCleanAddress()}</p>
                    </div>

                    {extractedArea && (
                      <div>
                        <div className="flex items-center mb-1">
                          <Navigation className="h-4 w-4 text-gray-500 mr-1.5" />
                          <p className="text-xs text-gray-500">Area</p>
                        </div>
                        <div className="flex items-center">
                          <p className="font-medium text-gray-900">{extractedArea}</p>
                          {areaFee !== null && (
                            <span className="ml-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                              Rs. {areaFee} fee
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {displayOrder.nearestLandmark && (
                      <div>
                        <div className="flex items-center mb-1">
                          <MapPin className="h-4 w-4 text-gray-500 mr-1.5" />
                          <p className="text-xs text-gray-500">Nearest Landmark</p>
                        </div>
                        <p className="font-medium text-gray-900">{displayOrder.nearestLandmark}</p>
                      </div>
                    )}
                  </>
                ) : (
                  displayOrder.pickupTime && (
                    <div>
                      <div className="flex items-center mb-1">
                        <Clock className="h-4 w-4 text-gray-500 mr-1.5" />
                        <p className="text-xs text-gray-500">Pickup Time</p>
                      </div>
                      <p className="font-medium text-gray-900">{displayOrder.pickupTime} minutes</p>
                    </div>
                  )
                )}

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center mb-1">
                    <Store className="h-4 w-4 text-gray-500 mr-1.5" />
                    <p className="text-xs text-gray-500">Branch</p>
                  </div>
                  <p className="font-medium text-gray-900">
                    {displayOrder.branch?.name || displayOrder.branchName || "Landhi"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="font-medium text-gray-900">Payment Information</h3>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <div className="flex items-center">
                    {displayOrder.paymentMethod === "cod" ? (
                      <>
                        <div className="mr-2 p-1 bg-green-100 rounded-full">
                          <Package className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="font-medium text-gray-900">Cash on Delivery</p>
                      </>
                    ) : (
                      <>
                        <div className="mr-2 p-1 bg-blue-100 rounded-full">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="font-medium text-gray-900">Online Payment</p>
                      </>
                    )}
                  </div>
                </div>
                {displayOrder.paymentMethod === "online" && displayOrder.bankName && (
                  <div>
                    <p className="text-xs text-gray-500">Payment Platform</p>
                    <p className="font-medium text-gray-900">{displayOrder.bankName}</p>
                  </div>
                )}
                {displayOrder.changeRequest && (
                  <div>
                    <p className="text-xs text-gray-500">Change Request</p>
                    <p className="font-medium text-gray-900">Rs. {displayOrder.changeRequest}</p>
                  </div>
                )}
                {displayOrder.paymentInstructions && (
                  <div>
                    <p className="text-xs text-gray-500">Payment Instructions</p>
                    <p className="font-medium text-gray-900">{displayOrder.paymentInstructions}</p>
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${displayOrder.isPaid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {displayOrder.isPaid ? "Paid" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 py-3 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/order" className="text-sm text-gray-600 hover:text-gray-900 flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Orders
          </Link>

          <div className="flex space-x-3">
            <a
              href="https://api.whatsapp.com/send/?phone=923463332682"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Chat on WhatsApp
            </a>


            <Link
              href="/"
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <Package className="h-4 w-4 mr-1.5" />
              Order More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}