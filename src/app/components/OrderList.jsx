'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import { Eye, ChevronLeft, ChevronRight, Printer, ArrowUpDown } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { Toaster, toast } from 'react-hot-toast';
import OrderDetails from "./OrderDetailsModal";

import kitchenSlipTemplate from '../../templates/kitchen-slip';
import deliveryPreBillTemplate from '../../templates/delivery-pre-bill';
import paymentReceiptTemplate from '../../templates/payment-receipt';

const extractValue = (field) => {
  if (typeof field === "object" && field !== null) {
    if (field.$numberInt) return parseInt(field.$numberInt, 10);
    if (field.$numberLong) return parseInt(field.$numberLong, 10);
    if (field.$oid) return field.$oid;
    if (field.$date) {
      if (typeof field.$date === "object" && field.$date.$numberLong) {
        return new Date(parseInt(field.$date.$numberLong, 10));
      } else {
        return new Date(field.$date);
      }
    }
  }
  return field;
};

const parseItemName = (itemName) => {
  try {
    if (!itemName || typeof itemName !== 'string') {
      return { quantity: 1, cleanName: itemName || 'Unknown Item' };
    }

    const endPattern = /\s*x(\d+)\s*$/i;
    const startPattern = /^(\d+)x\s*/i;

    let quantity = 1;
    let cleanName = itemName.trim();

    const endMatch = cleanName.match(endPattern);
    if (endMatch) {
      quantity = parseInt(endMatch[1], 10) || 1;
      cleanName = cleanName.replace(endPattern, '').trim();
    } else {
      const startMatch = cleanName.match(startPattern);
      if (startMatch) {
        quantity = parseInt(startMatch[1], 10) || 1;
        cleanName = cleanName.replace(startPattern, '').trim();
      }
    }

    return { quantity, cleanName };
  } catch (error) {
    console.error('Error parsing item name:', error);
    return { quantity: 1, cleanName: itemName || 'Unknown Item' };
  }
};

const extractAreaFromAddress = (deliveryAddress) => {
  if (!deliveryAddress) return null;

  const parts = deliveryAddress.split(',');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }

  return null;
};

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Date";
    
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `${formattedDate} ${formattedTime}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error";
  }
};

const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="p-2 border"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
    <td className="p-2 border"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="p-2 border"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
    <td className="p-2 border"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
    <td className="p-2 border"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="p-2 border w-24"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="p-2 border"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
    <td className="p-2 border"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="p-2 border text-center"><div className="h-5 w-5 bg-gray-200 rounded-full mx-auto"></div></td>
    <td className="p-2 border text-center"><div className="h-5 w-5 bg-gray-200 rounded-full mx-auto"></div></td>
  </tr>
);

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const ordersPerPage = 10;

  const [dateFilter, setDateFilter] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const [pageCache, setPageCache] = useState({});
  const [cacheKey, setCacheKey] = useState("");
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [branches, setBranches] = useState([]);

  const { latestOrder, notifications } = useSocket();

  const [receiptModal, setReceiptModal] = useState({
    isOpen: false,
    imageUrl: ""
  });

  useEffect(() => {
    const fetchDeliveryAreas = async () => {
      try {
        const res = await fetch("/api/delivery-areas");
        if (res.ok) {
          const data = await res.json();
          setDeliveryAreas(data);
        }
      } catch (error) {
        console.error("Error fetching delivery areas:", error);
      }
    };

    fetchDeliveryAreas();
  }, []);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branches");
        if (res.ok) {
          const data = await res.json();
          setBranches(data);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    fetchBranches();
  }, []);

  const getDeliveryFeeForArea = useCallback((areaName) => {
    if (!areaName || !deliveryAreas.length) return 0;

    const area = deliveryAreas.find(
      area => area.name.toLowerCase() === areaName.toLowerCase()
    );

    return area ? area.fee : 0;
  }, [deliveryAreas]);

  const generateCacheKey = useCallback(() => {
    return `${dateFilter}-${customDate || 'none'}-${typeFilter}-${statusFilter}-${paymentFilter}-${branchFilter}`;
  }, [dateFilter, customDate, typeFilter, statusFilter, paymentFilter, branchFilter]);

  useEffect(() => {
    const newCacheKey = generateCacheKey();
    if (newCacheKey !== cacheKey) {
      setPageCache({});
      setCacheKey(newCacheKey);
      setCurrentPage(1);
    }
  }, [dateFilter, customDate, typeFilter, statusFilter, paymentFilter, branchFilter, cacheKey, generateCacheKey]);

  useEffect(() => {
    if (latestOrder) {
      fetchOrders(1, true);
    }
  }, [latestOrder]);

  useEffect(() => {
    if (notifications.length > 0 && currentPage === 1) {
      fetchOrders(1, true);
    }
  }, [notifications.length]);

  const fetchOrders = useCallback(async (page = 1, forceRefresh = false) => {
    const currentCacheKey = generateCacheKey();

    setError(null);

    const cacheEntry = !forceRefresh ? pageCache[`${currentCacheKey}-${page}`] : null;

    if (cacheEntry) {
      console.log(`Using cached data for page ${page}`);
      setOrders(cacheEntry.orders);
      setTotalOrders(cacheEntry.totalCount);
      setTotalPages(cacheEntry.totalPages);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: ordersPerPage,
        dateFilter,
        typeFilter,
      });

      if (statusFilter !== "all" && statusFilter !== "active") {
        params.append("statusFilter", statusFilter);
      } else if (statusFilter === "active") {
        params.append("statusFilter", "Pending,In-Process,Dispatched");
      }

      if (paymentFilter !== "all") {
        params.append("paymentFilter", paymentFilter);
      }

      if (branchFilter !== "all") {
        params.append("branchFilter", branchFilter);
      }

      if (dateFilter === "custom" && customDate) {
        params.append("customDate", customDate);
      }

      const controller = new AbortController();
      const signal = controller.signal;

      if (forceRefresh) {
        params.append("_t", Date.now());
      }

      const res = await fetch(`/api/orders?${params.toString()}`, { signal });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      const data = await res.json();

      if (data && Array.isArray(data.orders)) {
        const processedOrders = await Promise.all(data.orders.map(async (orderRaw) => {
          const order = { ...orderRaw };
          const orderId = String(extractValue(order._id));
          let area = order.area || extractAreaFromAddress(order.deliveryAddress) || null;
          if (area === null && order.orderType === 'delivery') {
            const fullOrder = await fetchOrderDetails(orderId);
            area = fullOrder ? (fullOrder.area || extractAreaFromAddress(fullOrder.deliveryAddress) || "N/A") : "N/A";
          } else {
            area = area || "N/A";
          }
          order.area = area;
          return order;
        }));

        setOrders(processedOrders);
        setTotalOrders(data.totalCount || processedOrders.length);
        setTotalPages(data.totalPages || Math.ceil(data.totalCount / ordersPerPage));

        setPageCache(prev => ({
          ...prev,
          [`${currentCacheKey}-${page}`]: {
            orders: processedOrders,
            totalCount: data.totalCount || processedOrders.length,
            totalPages: data.totalPages || Math.ceil(data.totalCount / ordersPerPage),
            timestamp: Date.now()
          }
        }));
      } else {
        console.error("Expected an array of orders but got:", data);
        setError("Invalid data received from server");
        setOrders([]);
        setTotalOrders(0);
        setTotalPages(1);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error fetching orders:", error);
        setError(`Failed to fetch orders: ${error.message}`);
        setOrders([]);
        setTotalOrders(0);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customDate, typeFilter, statusFilter, paymentFilter, branchFilter, ordersPerPage, pageCache, generateCacheKey]);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(currentPage);
    return () => controller.abort();
  }, [fetchOrders, currentPage]);

  const [orderDetailsCache, setOrderDetailsCache] = useState({});

  const fetchOrderDetails = useCallback(async (orderId) => {
    if (orderDetailsCache[orderId]) {
      return orderDetailsCache[orderId];
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        console.error("Failed to fetch order details");
        return null;
      }
      const order = await res.json();

      setOrderDetailsCache(prev => ({
        ...prev,
        [orderId]: order
      }));

      return order;
    } catch (error) {
      console.error("Error fetching order details:", error);
      return null;
    }
  }, [orderDetailsCache]);

const updateOrderStatus = useCallback(async (orderId, updateData) => {
  try {
    const existingOrder = orders.find(order => String(extractValue(order._id)) === orderId);
    const existingArea = existingOrder ? existingOrder.area : null;
    
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update order (Status: ${res.status})`);
    }

    const updatedOrder = await res.json();
    
    updatedOrder.area = updatedOrder.area || existingArea || extractAreaFromAddress(updatedOrder.deliveryAddress) || "N/A";

    setOrders(prev =>
      prev.map(order =>
        String(extractValue(order._id)) === orderId ? updatedOrder : order
      )
    );

    setPageCache(prevCache => {
      const updatedCache = { ...prevCache };

      Object.keys(updatedCache).forEach(key => {
        if (updatedCache[key] && updatedCache[key].orders) {
          updatedCache[key].orders = updatedCache[key].orders.map(order =>
            String(extractValue(order._id)) === orderId ? updatedOrder : order
          );
        }
      });

      return updatedCache;
    });

    setOrderDetailsCache(prev => ({
      ...prev,
      [orderId]: updatedOrder
    }));

    if (selectedOrder && String(extractValue(selectedOrder._id)) === orderId) {
      setSelectedOrder(updatedOrder);
    }

    toast.success("Order status updated successfully");
    return updatedOrder;
  } catch (error) {
    console.error("Error updating order:", error);
    toast.error(error.message || "Failed to update order status");
    throw error;
  }
}, [orders, selectedOrder]);

  const removeOrder = useCallback((orderId) => {
    setOrders(prev => prev.filter(order => String(extractValue(order._id)) !== orderId));

    setPageCache(prevCache => {
      const updatedCache = { ...prevCache };

      Object.keys(updatedCache).forEach(key => {
        if (updatedCache[key] && updatedCache[key].orders) {
          updatedCache[key].orders = updatedCache[key].orders.filter(order =>
            String(extractValue(order._id)) !== orderId
          );
          if (updatedCache[key].totalCount > 0) {
            updatedCache[key].totalCount -= 1;
          }
        }
      });

      return updatedCache;
    });

    setTotalOrders(prev => Math.max(0, prev - 1));

    const newTotalPages = Math.ceil((totalOrders - 1) / ordersPerPage);
    setTotalPages(newTotalPages);

    if (currentPage > newTotalPages && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }

    if (selectedOrder && String(extractValue(selectedOrder._id)) === orderId) {
      setSelectedOrder(null);
    }
  }, [totalOrders, ordersPerPage, currentPage, selectedOrder]);

  const deleteOrder = useCallback(async (orderId) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Failed to delete order. Status:", res.status);
        toast.error("Failed to delete order");
        return;
      }

      removeOrder(orderId);

      setOrderDetailsCache(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });

      toast.success("Order deleted successfully");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Error deleting order");
    }
  }, [removeOrder]);

  const handlePageChange = useCallback((pageNum) => {
    setCurrentPage(pageNum);
    window.scrollTo(0, 0);
  }, []);

  const viewOrderDetails = useCallback(async (order) => {
    if (!order.items) {
      setModalLoading(true);
      const fullOrder = await fetchOrderDetails(String(extractValue(order._id)));
      setModalLoading(false);
      if (fullOrder) {
        setSelectedOrder(fullOrder);
      } else {
        setSelectedOrder(order);
      }
    } else {
      setSelectedOrder(order);
      setModalLoading(false);
    }
  }, [fetchOrderDetails]);

  const closeDetails = useCallback(() => setSelectedOrder(null), []);

  const openReceiptModal = useCallback((imageUrl) => {
    setReceiptModal({
      isOpen: true,
      imageUrl
    });
  }, []);

  const closeReceiptModal = useCallback(() => {
    setReceiptModal({
      isOpen: false,
      imageUrl: ""
    });
  }, []);

  const paginationPages = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((page, index, arr) => arr.indexOf(page) === index);
  }, [currentPage, totalPages]);

const printKitchenSlip = useCallback(async (order) => {
  let orderToPrint = order;
  if (!order.items) {
    const fullOrder = await fetchOrderDetails(String(extractValue(order._id)));
    if (!fullOrder) {
      console.error("Could not fetch order details for kitchen slip");
      return;
    }
    orderToPrint = fullOrder;
  }

  const orderNumber = orderToPrint.orderNo || "N/A";
  const ticketNumber = Math.floor(10000 + Math.random() * 90000);
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const orderType = orderToPrint.orderType?.charAt(0).toUpperCase() + orderToPrint.orderType?.slice(1) || 'Delivery';

  const specialInstructions = [];

  if (orderToPrint.paymentInstructions && orderToPrint.paymentInstructions.trim() !== '----' && orderToPrint.paymentInstructions.trim() !== '') {
    specialInstructions.push(`Order Instructions: ${orderToPrint.paymentInstructions.trim()}`);
  }

  const itemsList = orderToPrint.items.map((item, index, array) => {
    const itemName = item.title || item.name || "Unknown Item";
    const quantity = item.quantity || 1;
    
    let descriptionHtml = '';
    if (item.description && item.description.trim() !== '') {
      descriptionHtml = `<div class="item-description" style="font-size: 9px; color: #333; margin-top: 2px; font-style: italic;">${item.description}</div>`;
    }

    let modifiersHtml = '';
    
    // if (item.selectedVariation && item.selectedVariation.name) {
    //   modifiersHtml += `<div class="modifiers" style="margin-top: 3px;">Variation: ${item.selectedVariation.name}</div>`;
    // } else if (item.type) {
    //   modifiersHtml += `<div class="modifiers" style="margin-top: 3px;">Type: ${item.type}</div>`;
    // }
    
    if (item.selectedExtras && item.selectedExtras.length > 0) {
      modifiersHtml += `<div class="modifiers" style="margin-top: 3px;">Extras: ${item.selectedExtras.map(e => e.name).join('<br />')}</div>`;
    }
    
    if (item.selectedSideOrders && item.selectedSideOrders.length > 0) {
      modifiersHtml += `<div class="modifiers" style="margin-top: 3px;">Side Orders: ${item.selectedSideOrders.map(s => s.name).join('<br />')}</div>`;
    }
    
    if (item.specialInstructions && item.specialInstructions.trim() !== '') {
      specialInstructions.push(`${itemName}: ${item.specialInstructions}`);
    }

    const isLastItem = index === array.length - 1;
    const borderStyle = isLastItem ? "border-bottom: none;" : "";

    return `
      <tr>
        <td style="padding: 4px 0; border-top: 1px dashed black; ${borderStyle}">
          <div class="item-name" style="font-weight: 900;">${itemName}</div>
          ${descriptionHtml}
          ${modifiersHtml}
        </td>
        <td style="padding: 4px 0; border-top: 1px dashed black; text-align: center; ${borderStyle}">${quantity}</td>
      </tr>
    `;
  }).join('');

  const instructionsRow = specialInstructions.length > 0 ? 
    `<tr>
      <td colspan="2" style="border-bottom: none; padding-top: 5px;">
        <div style="font-weight: bold; text-decoration: underline; margin-bottom: 5px;">SPECIAL INSTRUCTIONS:</div>
        ${specialInstructions.map(instruction => 
          `<div style="color: #000000; font-weight: bold; margin: 5px 0;">${instruction}</div>`
        ).join('')}
      </td>
    </tr>` : '';

  const tableContent = itemsList + instructionsRow;

  let htmlContent = kitchenSlipTemplate
    .replace(/{{ticketNumber}}/g, ticketNumber)
    .replace(/{{orderNumber}}/g, orderNumber)
    .replace(/{{currentDate}}/g, currentDate)
    .replace(/{{currentTime}}/g, currentTime)
    .replace(/{{orderType}}/g, orderType)
    .replace(/{{itemsList}}/g, tableContent);
  
  const newWindow = window.open("", "_blank", "width=300,height=600");
  if (!newWindow) {
    console.error("Couldn't open new window for kitchen slip printing");
    return;
  }

  newWindow.document.write(htmlContent);
  newWindow.document.close();

  updateOrderStatus(String(extractValue(orderToPrint._id)), { status: "In-Process" });
}, [fetchOrderDetails, updateOrderStatus]);

const printDeliveryPreBill = useCallback(async (order) => {
  let orderToPrint = order;

  if (!order.items) {
    const fullOrder = await fetchOrderDetails(String(extractValue(order._id)));
    if (!fullOrder) {
      alert("Could not fetch order details for printing");
      return;
    }
    orderToPrint = fullOrder;
  }

  const orderNumber = orderToPrint.orderNo || "N/A";
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const orderType = orderToPrint.orderType?.charAt(0).toUpperCase() + orderToPrint.orderType?.slice(1) || 'Delivery';
  const customerName = orderToPrint.fullName || '';
  const mobileNumber = orderToPrint.mobileNumber || '';
  const alternateMobile = orderToPrint.alternateMobile || '';
  const deliveryAddress = orderToPrint.deliveryAddress || '';
  const nearestLandmark = orderToPrint.nearestLandmark || '----'; 
  const paymentInstructions = orderToPrint.paymentInstructions || '----';

  const area = orderToPrint.area || extractAreaFromAddress(orderToPrint.deliveryAddress);
  const deliveryFee = orderToPrint.orderType === 'delivery' ?
    getDeliveryFeeForArea(area) : 0;

  const subtotal = extractValue(orderToPrint.subtotal) || 0;
  const tax = extractValue(orderToPrint.tax) || 0;
  const discount = extractValue(orderToPrint.discount) || 0;
  const discountPercentage = orderToPrint.globalDiscountPercentage || orderToPrint.discountPercentage || 0;
  const total = extractValue(orderToPrint.total) || 0;
  const itemCount = orderToPrint.items.length;

  const itemRows = orderToPrint.items.map((item, index) => {
    const itemName = item.title || item.name || "Unknown Item";
    const quantity = item.quantity || 1;
    const price = extractValue(item.price) || 0;
    const amount = price * quantity;
    
    let modifiersHtml = '';
    
    if (item.selectedVariation) {
      // modifiersHtml += `<div class="item-modifiers">- ${item.selectedVariation.name}</div>`;
    } else if (item.type) {
      modifiersHtml += `<div class="item-modifiers">- ${item.type}</div>`;
    }
    
    if (item.selectedExtras && item.selectedExtras.length > 0) {
      item.selectedExtras.forEach(extra => {
        modifiersHtml += `<div class="item-modifiers">+ ${extra.name} (+${extra.price})</div>`;
      });
    }
    
    if (item.selectedSideOrders && item.selectedSideOrders.length > 0) {
      item.selectedSideOrders.forEach(sideOrder => {
        modifiersHtml += `<div class="item-modifiers">+ ${sideOrder.name} (+${sideOrder.price})</div>`;
      });
    }
    
    if (item.specialInstructions) {
      modifiersHtml += `<div class="item-modifiers" style="color: #cc0000;">Note: ${item.specialInstructions}</div>`;
    }

    return `
      <tr>
        <td style="padding: 2px 0; border-bottom: 1px dotted #ddd;">${index + 1}</td>
        <td style="padding: 2px 0; border-bottom: 1px dotted #ddd;">
          ${itemName}
          ${modifiersHtml}
        </td>
        <td style="padding: 2px 0; border-bottom: 1px dotted #ddd; text-align: center;">${quantity}</td>
        <td style="padding: 2px 0; border-bottom: 1px dotted #ddd; text-align: right;">${price}</td>
        <td style="padding: 2px 0; border-bottom: 1px dotted #ddd; text-align: right;">${amount}</td>
      </tr>
    `;
  }).join('');

  let htmlContent = deliveryPreBillTemplate
    .replace(/{{orderNumber}}/g, orderNumber)
    .replace(/{{orderType}}/g, orderType)
    .replace(/{{customerName}}/g, customerName)
    .replace(/{{currentDate}}/g, currentDate)
    .replace(/{{currentTime}}/g, currentTime)
    .replace(/{{itemRows}}/g, itemRows)
    .replace(/{{itemCount}}/g, itemCount)
    .replace(/{{subtotal}}/g, subtotal)
    .replace(/{{tax}}/g, tax)
    .replace(/{{deliveryFee}}/g, deliveryFee)
    .replace(/{{discountPercentage}}/g, discountPercentage)
    .replace(/{{discount}}/g, discount)
    .replace(/{{total}}/g, total)
    .replace(/{{mobileNumber}}/g, mobileNumber)
    .replace(/{{alternateMobile}}/g, alternateMobile)
    .replace(/{{deliveryAddress}}/g, deliveryAddress)
    .replace(/{{nearestLandmark}}/g, nearestLandmark)
    .replace(/{{paymentInstructions}}/g, paymentInstructions);

  const newWindow = window.open("", "_blank", "width=300,height=600");
  if (!newWindow) return;

  newWindow.document.write(htmlContent);
  newWindow.document.close();

  updateOrderStatus(String(extractValue(orderToPrint._id)), { status: "Dispatched" });
}, [fetchOrderDetails, getDeliveryFeeForArea, updateOrderStatus]);

const printDeliveryPaymentReceipt = useCallback(async (order) => {
  let orderToPrint = order;

  if (!order.items) {
    const fullOrder = await fetchOrderDetails(String(extractValue(order._id)));
    if (!fullOrder) {
      alert("Could not fetch order details for printing");
      return;
    }
    orderToPrint = fullOrder;
  }

  const orderNumber = orderToPrint.orderNo || "N/A";
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const orderType = orderToPrint.orderType?.charAt(0).toUpperCase() + orderToPrint.orderType?.slice(1) || 'Delivery';
  const customerName = orderToPrint.fullName || '';
  const mobileNumber = orderToPrint.mobileNumber || '';
  const alternateMobile = orderToPrint.alternateMobile || '';
  const deliveryAddress = orderToPrint.deliveryAddress || '';
  const paymentInstructions = orderToPrint.paymentInstructions || '----';

  const area = orderToPrint.area || extractAreaFromAddress(orderToPrint.deliveryAddress);
  const deliveryFee = orderToPrint.orderType === 'delivery' ?
    getDeliveryFeeForArea(area) : 0;

  const subtotal = extractValue(orderToPrint.subtotal) || 0;
  const total = extractValue(orderToPrint.total) || 0;
  const paymentMethod = orderToPrint.paymentMethod === 'cod' ? 'Cash' : 'Online Payment';
  const changeRequest = orderToPrint.changeRequest || '0.00';
  const itemCount = orderToPrint.items.length;

  const itemRows = orderToPrint.items.map((item, index) => {
    const itemName = item.title || item.name || "Unknown Item";
    const quantity = item.quantity || 1;
    const price = extractValue(item.price) || 0;
    const amount = price * quantity;
    
    let modifiersHtml = '';
    
    if (item.selectedVariation) {
      // modifiersHtml += `<div class="item-modifiers">- ${item.selectedVariation.name}</div>`;
    } else if (item.type) {
      modifiersHtml += `<div class="item-modifiers">- ${item.type}</div>`;
    }
    
    if (item.selectedExtras && item.selectedExtras.length > 0) {
      item.selectedExtras.forEach(extra => {
        modifiersHtml += `<div class="item-modifiers">+ ${extra.name} (+${extra.price})</div>`;
      });
    }
    
    if (item.selectedSideOrders && item.selectedSideOrders.length > 0) {
      item.selectedSideOrders.forEach(sideOrder => {
        modifiersHtml += `<div class="item-modifiers">+ ${sideOrder.name} (+${sideOrder.price})</div>`;
      });
    }
    
    if (item.specialInstructions) {
      modifiersHtml += `<div class="item-modifiers" style="color: #cc0000;">Note: ${item.specialInstructions}</div>`;
    }

    return `
      <tr>
        <td style="padding: 2px 0; border-bottom: 1px dotted #ddd;">${index + 1}</td>
        <td style="padding: 2px 0; border-bottom: 1px dotted #ddd;">
          ${itemName}
          ${modifiersHtml}
        </td>
        <td style="padding: 2px 0; border-bottom: 1px dotted #ddd; text-align: center;">${quantity}</td>
        <td style="padding: 2px 0; border-bottom: 1px dotted #ddd; text-align: right;">${price}</td>
        <td style="padding: 2px 0; border-bottom: 1px dotted #ddd; text-align: right;">${amount}</td>
      </tr>
    `;
  }).join('');

  let htmlContent = paymentReceiptTemplate
    .replace(/{{orderNumber}}/g, orderNumber)
    .replace(/{{orderType}}/g, orderType)
    .replace(/{{customerName}}/g, customerName)
    .replace(/{{currentDate}}/g, currentDate)
    .replace(/{{currentTime}}/g, currentTime)
    .replace(/{{itemRows}}/g, itemRows)
    .replace(/{{itemCount}}/g, itemCount)
    .replace(/{{subtotal}}/g, subtotal)
    .replace(/{{deliveryFee}}/g, deliveryFee)
    .replace(/{{total}}/g, total)
    .replace(/{{paymentMethod}}/g, paymentMethod)
    .replace(/{{changeRequest}}/g, changeRequest)
    .replace(/{{mobileNumber}}/g, mobileNumber)
    .replace(/{{alternateMobile}}/g, alternateMobile)
    .replace(/{{deliveryAddress}}/g, deliveryAddress)
    .replace(/{{paymentInstructions}}/g, paymentInstructions);

  const newWindow = window.open("", "_blank", "width=300,height=600");
  if (!newWindow) return;

  newWindow.document.write(htmlContent);
  newWindow.document.close();
}, [fetchOrderDetails, getDeliveryFeeForArea]);

  const refreshOrders = () => {
    fetchOrders(currentPage, true);
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "In-Process": return "bg-blue-100 text-blue-800";
      case "Dispatched": return "bg-purple-100 text-purple-800";
      case "Complete": return "bg-green-100 text-green-800";
      case "Cancel": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const statusLevels = {
    'Pending': 0,
    'In-Process': 1,
    'Dispatched': 2,
    'Complete': 3,
    'Cancel': 4
  };

  const formatPhoneForWhatsApp = (phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) {
      return `92${cleanNumber.substring(1)}`;
    }
    return cleanNumber;
  };

  const openWhatsAppChat = (phoneNumber) => {
    const formattedNumber = formatPhoneForWhatsApp(phoneNumber);
    window.open(`https://wa.me/${formattedNumber}`, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Order List</h2>

        <div className="flex items-center">
          <button
            onClick={refreshOrders}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            aria-label="Refresh orders"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-6 flex-wrap">
        <div className="flex gap-2 items-center">
          <label htmlFor="dateFilter" className="font-medium">
            Date:
          </label>
          <select
            id="dateFilter"
            className="px-3 py-1 border rounded"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              if (e.target.value !== "custom") {
                setCustomDate("");
              }
            }}
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="custom">Custom</option>
          </select>
          {dateFilter === "custom" && (
            <input
              type="date"
              className="px-3 py-1 border rounded"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
              }}
            />
          )}
        </div>

        <div className="flex gap-2 items-center">
          <label htmlFor="typeFilter" className="font-medium">
            Type:
          </label>
          <select
            id="typeFilter"
            className="px-3 py-1 border rounded"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
            }}
          >
            <option value="all">All</option>
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
        
        <div className="flex gap-2 items-center">
          <label htmlFor="statusFilter" className="font-medium">
            Status:
          </label>
          <select
            id="statusFilter"
            className="px-3 py-1 border rounded"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
            }}
          >
            <option value="active">Active</option>
            <option value="all">All</option>
            <option value="Pending">Pending</option>
            <option value="In-Process">In-Process</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Complete">Complete</option>
            <option value="Cancel">Cancel</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <label htmlFor="paymentFilter" className="font-medium">
            Payment:
          </label>
          <select
            id="paymentFilter"
            className="px-3 py-1 border rounded"
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
            }}
          >
            <option value="all">All</option>
            <option value="cod">COD</option>
            <option value="online">Online</option>
            <option value="easypaisa">Easypaisa</option>
            <option value="jazzcash">JazzCash</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <label htmlFor="branchFilter" className="font-medium">
            Branch:
          </label>
          <select
            id="branchFilter"
            className="px-3 py-1 border rounded"
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
            }}
          >
            <option value="all">All Branches</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <table className="min-w-full border-collapse">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 border text-left">Sr No</th>
            <th className="p-2 border text-left">Order</th>
            <th className="p-2 border text-left">Name</th>
            <th className="p-2 border text-left">Date & Time</th>
            <th className="p-2 border text-left">Type</th>
            <th className="p-2 border text-left w-24">Area</th>
            <th className="p-2 border text-left">Amount</th>
            <th className="p-2 border text-left">Status</th>
            <th className="p-2 border text-left">View</th>
            <th className="p-2 border text-left">Print</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array(ordersPerPage).fill(0).map((_, index) => (
              <TableRowSkeleton key={index} />
            ))
          ) : error ? (
            <tr>
              <td colSpan="10" className="text-center p-4 text-red-500">
                {error}
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan="10" className="text-center p-4">No orders found.</td>
            </tr>
          ) : (
            orders.map((order, index) => {
              const srNo = ((currentPage - 1) * ordersPerPage + index + 1)
                .toString()
                .padStart(2, "0");
              const orderType = order.orderType
                ? order.orderType.charAt(0).toUpperCase() +
                  order.orderType.slice(1)
                : "Delivery";
              const currentStatus = order.status || "Pending";
              const currentLevel = statusLevels[currentStatus];
              const orderId = String(extractValue(order._id));

              return (
                <tr key={order._id} className="hover:bg-gray-100">
                  <td className="p-2 border">{srNo}</td>
                  <td className="p-2 border font-medium">{order.orderNo || "N/A"}</td>
                  <td className="p-2 border">
                    <div className="flex items-center gap-2">
                      {order.fullName}
                      {(order.alternateMobile) && (
                        <button 
                          onClick={() => openWhatsAppChat(order.alternateMobile)}
                          className="text-green-600 hover:text-green-700"
                          aria-label="Contact via WhatsApp"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-2 border text-sm">
                    {formatDateTime(order.createdAt || null)}
                  </td>
                  <td className="p-2 border">{orderType}</td>
                  <td className="p-2 border w-24">{order.area}</td>
                  <td className="p-2 border">
                    Rs. {extractValue(order.total) || 0}
                  </td>
                  <td className="p-2 border">
                    <select
                      value={currentStatus}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        if (statusLevels[newStatus] < currentLevel && newStatus !== 'Cancel') {
                          toast.error("Cannot revert to previous status");
                          e.target.value = currentStatus;
                          return;
                        }
                        let updateData = { status: newStatus };
                        if (newStatus === "Cancel" && currentStatus !== "Cancel") {
                          const reason = prompt("Please enter cancellation reason:");
                          if (!reason) {
                            e.target.value = currentStatus;
                            return;
                          }
                          updateData.cancelReason = reason;
                        }
                        try {
                          const updated = await updateOrderStatus(orderId, updateData);
                          if (statusFilter === 'active' && (newStatus === 'Complete' || newStatus === 'Cancel')) {
                            removeOrder(orderId);
                          }
                        } catch (err) {}
                      }}
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(currentStatus)} w-full text-center`}
                    >
                      {Object.keys(statusLevels).map(status => (
                        <option 
                          key={status} 
                          value={status} 
                          disabled={(statusLevels[status] < currentLevel && status !== 'Cancel' && status !== currentStatus) || (currentStatus === 'Complete' && status !== 'Cancel' && status !== 'Complete') || (currentStatus === 'Cancel' && status !== 'Cancel')}
                        >
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 border text-center">
                    <button
                      type="button"
                      onClick={() => viewOrderDetails(order)}
                      className="text-blue-600 hover:text-blue-800"
                      aria-label="View order details"
                    >
                      <Eye className="h-5 w-5 inline-block" />
                    </button>
                  </td>
                  <td className="p-2 border text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => printKitchenSlip(order)}
                        className="text-green-600 hover:text-green-800"
                        aria-label="Print kitchen slip"
                        title="Kitchen Slip"
                      >
                        <Printer className="h-5 w-5 inline-block" />
                      </button>
                      <button
                        onClick={() => printDeliveryPreBill(order)}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label="Print pre-bill"
                        title="Pre-Bill Slip"
                      >
                        <Printer className="h-5 w-5 inline-block" />
                      </button>
                      <button
                        onClick={() => printDeliveryPaymentReceipt(order)}
                        className="text-purple-600 hover:text-purple-800"
                        aria-label="Print payment receipt"
                        title="Payment Receipt Slip"
                      >
                        <Printer className="h-5 w-5 inline-block" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center mt-6 space-x-1">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`flex items-center px-3 py-2 text-sm font-medium border rounded-md ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </button>

          <div className="flex space-x-1">
            {paginationPages.map((page, index) => (
              <div key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-sm font-medium text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium border rounded-md ${
                      currentPage === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {page}
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`flex items-center px-3 py-2 text-sm font-medium border rounded-md ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Showing {((currentPage - 1) * ordersPerPage) + 1} to{" "}
            {Math.min(currentPage * ordersPerPage, totalOrders)} of{" "}
            {totalOrders} orders
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {selectedOrder && (
        <div className="mt-8 border rounded-lg shadow-lg bg-white">
          <OrderDetails
            selectedOrder={selectedOrder}
            modalLoading={modalLoading}
            closeDetails={closeDetails}
            updateOrderStatus={updateOrderStatus}
            deleteOrder={deleteOrder}
            printKitchenSlip={printKitchenSlip}
            printDeliveryPreBill={printDeliveryPreBill}
            printDeliveryPaymentReceipt={printDeliveryPaymentReceipt}
            openReceiptModal={openReceiptModal}
            receiptModal={receiptModal}
            closeReceiptModal={closeReceiptModal}
            getDeliveryFeeForArea={getDeliveryFeeForArea}
            extractValue={extractValue}
            parseItemName={parseItemName}
            extractAreaFromAddress={extractAreaFromAddress}
          />
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}