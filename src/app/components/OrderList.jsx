'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import { Eye, ChevronLeft, ChevronRight, Printer, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { Toaster } from 'react-hot-toast';

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

// Function to extract area from delivery address
const extractAreaFromAddress = (deliveryAddress) => {
  if (!deliveryAddress) return null;
  
  // Most addresses in the checkout form are formatted as: "street address, area name"
  const parts = deliveryAddress.split(',');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  
  return null;
};

const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="p-2 border"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
    <td className="p-2 border"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    <td className="p-2 border"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
    <td className="p-2 border"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="p-2 border w-24"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="p-2 border"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
    <td className="p-2 border"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="p-2 border text-center"><div className="h-5 w-5 bg-gray-200 rounded-full mx-auto"></div></td>
    <td className="p-2 border text-center"><div className="h-5 w-5 bg-gray-200 rounded-full mx-auto"></div></td>
  </tr>
);

const OrderDetailsSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    <div className="h-4 bg-gray-200 rounded w-3/5"></div>
    <div className="h-4 bg-gray-200 rounded w-2/5"></div>
    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
    <div className="mt-6">
      <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-11/12"></div>
        <div className="h-4 bg-gray-200 rounded w-10/12"></div>
        <div className="h-4 bg-gray-200 rounded w-9/12"></div>
      </div>
    </div>
    <div className="mt-6 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-2/5 mt-4"></div>
  </div>
);

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [orderNumbers, setOrderNumbers] = useState({});
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
  
  const [pageCache, setPageCache] = useState({});
  const [cacheKey, setCacheKey] = useState("");
  const [deliveryAreas, setDeliveryAreas] = useState([]);

  // Socket context to receive real-time updates
  const { latestOrder, notifications } = useSocket();

  // State for receipt image modal
  const [receiptModal, setReceiptModal] = useState({
    isOpen: false,
    imageUrl: ""
  });

  // Fetch delivery areas
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

  // Get delivery fee for a specific area
  const getDeliveryFeeForArea = useCallback((areaName) => {
    if (!areaName || !deliveryAreas.length) return 0;
    
    const area = deliveryAreas.find(
      area => area.name.toLowerCase() === areaName.toLowerCase()
    );
    
    return area ? area.fee : 0;
  }, [deliveryAreas]);

  const generateCacheKey = useCallback(() => {
    return `${dateFilter}-${customDate || 'none'}-${typeFilter}`;
  }, [dateFilter, customDate, typeFilter]);

  useEffect(() => {
    const newCacheKey = generateCacheKey();
    if (newCacheKey !== cacheKey) {
      setPageCache({});
      setCacheKey(newCacheKey);
      setCurrentPage(1);
    }
  }, [dateFilter, customDate, typeFilter, cacheKey, generateCacheKey]);

  // Immediately refresh the list when a new order is received
  useEffect(() => {
    if (latestOrder) {
      fetchOrders(1, true);
    }
  }, [latestOrder]);

  // Also listen for notifications array changes as a fallback
  useEffect(() => {
    if (notifications.length > 0 && currentPage === 1) {
      fetchOrders(1, true);
    }
  }, [notifications.length]);

  const fetchOrders = useCallback(async (page = 1, forceRefresh = false) => {
    const currentCacheKey = generateCacheKey();
    
    setError(null);
    
    // Skip cache if forceRefresh is true (for new orders)
    const cacheEntry = !forceRefresh ? pageCache[`${currentCacheKey}-${page}`] : null;
    
    if (cacheEntry) {
      console.log(`Using cached data for page ${page}`);
      setOrders(cacheEntry.orders);
      setTotalOrders(cacheEntry.totalCount);
      setTotalPages(cacheEntry.totalPages);
      setOrderNumbers(cacheEntry.orderNumbers);
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
      
      if (dateFilter === "custom" && customDate) {
        params.append("customDate", customDate);
      }
      
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Add cache busting parameter for force refresh
      if (forceRefresh) {
        params.append("_t", Date.now());
      }
      
      const res = await fetch(`/api/orders?${params.toString()}`, { signal });
      
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      
      const data = await res.json();
      
      if (data && Array.isArray(data.orders)) {
        const mapping = {};
        data.orders.forEach((order, index) => {
          const idVal = String(extractValue(order._id));
          const globalIndex = (page - 1) * ordersPerPage + index;
          mapping[idVal] = "king-" + (globalIndex + 1).toString().padStart(3, "0");
        });
        
        setOrders(data.orders);
        setTotalOrders(data.totalCount || data.orders.length);
        setTotalPages(data.totalPages || Math.ceil(data.totalCount / ordersPerPage));
        setOrderNumbers(mapping);
        
        setPageCache(prev => ({
          ...prev,
          [`${currentCacheKey}-${page}`]: {
            orders: data.orders,
            totalCount: data.totalCount || data.orders.length,
            totalPages: data.totalPages || Math.ceil(data.totalCount / ordersPerPage),
            orderNumbers: mapping,
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
  }, [dateFilter, customDate, typeFilter, ordersPerPage, pageCache, generateCacheKey]);

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

  const toggleCompletion = useCallback(async (orderId, currentStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !currentStatus }),
      });
      
      if (!res.ok) {
        console.error("Failed to update order completion");
        return;
      }
      
      const updatedOrder = await res.json();
      
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
    } catch (error) {
      console.error("Error updating order:", error);
    }
  }, [selectedOrder]);

  const deleteOrder = useCallback(async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        console.error("Failed to delete order. Status:", res.status);
        return;
      }
      
      setOrders(prev => 
        prev.filter(order => String(extractValue(order._id)) !== orderId)
      );
      
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
      
      setOrderDetailsCache(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      
      setTotalOrders(prev => Math.max(0, prev - 1));
      
      if (selectedOrder && String(extractValue(selectedOrder._id)) === orderId) {
        setSelectedOrder(null);
      }
      
      const newTotalPages = Math.ceil((totalOrders - 1) / ordersPerPage);
      if (currentPage > newTotalPages && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  }, [selectedOrder, totalOrders, currentPage, ordersPerPage]);

  const handlePageChange = useCallback((pageNum) => {
    setCurrentPage(pageNum);
    window.scrollTo(0, 0);
  }, []);

  const viewOrderDetails = useCallback(async (order) => {
    if (!order.items) {
      setSelectedOrder(order); 
      setModalLoading(true);
      const fullOrder = await fetchOrderDetails(String(extractValue(order._id)));
      setModalLoading(false);
      if (fullOrder) {
        setSelectedOrder(fullOrder);
      }
    } else {
      setSelectedOrder(order);
      setModalLoading(false);
    }
  }, [fetchOrderDetails]);

  const closeModal = useCallback(() => setSelectedOrder(null), []);

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

  // KITCHEN SLIP PRINT FUNCTION
  const printKitchenSlip = useCallback(async (order) => {
    let orderToPrint = order;
    
    // If order doesn't have items, fetch complete order details
    if (!order.items) {
      const fullOrder = await fetchOrderDetails(String(extractValue(order._id)));
      if (!fullOrder) {
        console.error("Could not fetch order details for kitchen slip");
        return;
      }
      orderToPrint = fullOrder;
    }
    
    const idVal = String(extractValue(orderToPrint._id));
    const orderNumber = orderNumbers[idVal] || `king-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
    const ticketNumber = Math.floor(10000 + Math.random() * 90000); // Generate a random 5-digit ticket number
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Format items for kitchen slip (simple list with quantities)
    const itemsList = orderToPrint.items.map((item, index) => {
      const { quantity, cleanName } = parseItemName(item.name);
      
      return `
        <tr>
          <td style="padding: 3px 0; border-top: 1px dashed #aaa;">${cleanName}</td>
          <td style="padding: 3px 0; border-top: 1px dashed #aaa; text-align: center;">${quantity}</td>
        </tr>
      `;
    }).join('');
    
    const htmlContent = `
      <html>
        <head>
          <title>Kitchen Order Slip</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 5px;
              width: 72mm; /* Standard thermal receipt width */
              font-size: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 5px;
            }
            .order-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .order-info div {
              width: 50%;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              text-align: left;
              padding: 3px 0;
              border-bottom: 1px solid #000;
            }
            .bold {
              font-weight: bold;
            }
            .centered {
              text-align: center;
            }
            .header-row {
              background-color: #000;
              color: #fff;
            }
          </style>
        </head>
        <body>
          <div class="header bold">
            <div>KOT: Kitchen 1</div>
          </div>
          
          <div class="order-info">
            <div>
              <div><span class="bold">ORDER # :</span> ${orderNumber}</div>
              <div><span class="bold">TICKET # :</span> ${ticketNumber}</div>
              <div><span class="bold">TABLE # :</span> ----</div>
            </div>
            <div>
              <div><span class="bold">DATE:</span> ${currentDate}</div>
              <div><span class="bold">TIME:</span> ${currentTime}</div>
              <div><span class="bold">WAITER:</span> General</div>
            </div>
          </div>
          
          <div style="margin: 5px 0;">
            <div><span class="bold">TYPE:</span> ${orderToPrint.orderType?.charAt(0).toUpperCase() + orderToPrint.orderType?.slice(1) || 'Delivery'}</div>
            <div><span class="bold">KOT #:</span> 1</div>
          </div>
          
          <table>
            <tr class="header-row">
              <th>DESCRIPTION</th>
              <th style="text-align: center;">Qty</th>
            </tr>
            ${itemsList}
          </table>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `;
    
    const newWindow = window.open("", "_blank", "width=300,height=600");
    if (!newWindow) {
      console.error("Couldn't open new window for kitchen slip printing");
      return;
    }
    
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  }, [fetchOrderDetails, orderNumbers]);

  // DELIVERY PRE-BILL SLIP PRINT FUNCTION
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
    
    const idVal = String(extractValue(orderToPrint._id));
    const orderNumber = orderNumbers[idVal] || `king-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Extract area from delivery address and get delivery fee
    const area = orderToPrint.area || extractAreaFromAddress(orderToPrint.deliveryAddress);
    const deliveryFee = orderToPrint.orderType === 'delivery' ? 
      getDeliveryFeeForArea(area) : 0;
    
    const subtotal = extractValue(orderToPrint.subtotal) || 0;
    const tax = extractValue(orderToPrint.tax) || 0;
    const discount = extractValue(orderToPrint.discount) || 0;
    const discountPercentage = orderToPrint.discountPercentage || 0;
    const total = extractValue(orderToPrint.total) || 0;
    
    const itemRows = orderToPrint.items.map((item, index) => {
      const { quantity, cleanName } = parseItemName(item.name);
      const price = extractValue(item.price) || 0;
      const amount = price * quantity;
      
      return `
        <tr>
          <td style="padding: 2px 0; border-bottom: 1px dotted #ddd;">${index + 1}</td>
          <td style="padding: 2px 0; border-bottom: 1px dotted #ddd;">${cleanName}</td>
          <td style="padding: 2px 0; border-bottom: 1px dotted #ddd; text-align: center;">${quantity}</td>
          <td style="padding: 2px 0; border-bottom: 1px dotted #ddd; text-align: right;">${price}</td>
          <td style="padding: 2px 0; border-bottom: 1px dotted #ddd; text-align: right;">${amount}</td>
        </tr>
      `;
    }).join('');
    
    const htmlContent = `
      <html>
        <head>
          <title>Delivery Pre-Bill</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 5px;
              width: 72mm; /* Standard thermal receipt width */
              font-size: 9px;
            }
            .header {
              text-align: center;
              margin-bottom: 5px;
            }
            .title {
              background-color: #000;
              color: #fff;
              padding: 3px;
              text-align: center;
              font-weight: bold;
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            .summary {
              margin-top: 5px;
              text-align: right;
            }
            .customer-info {
              margin-top: 5px;
              border: 1px solid #000;
              padding: 3px;
            }
            .bold {
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .bill-amount {
              background-color: #000;
              color: #fff;
              padding: 2px 5px;
              margin-top: 3px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="bold">KING ICE FAST FOOD</div>
            <div>Landhi 3 1/2 SNTN 5609626-7</div>
            <div>All Prices Are Inclusive of 13% SST</div>
          </div>
          
          <div class="title">DELIVERY PRE-BILL</div>
          
          <div style="display: flex; justify-content: space-between;">
            <div>
              <div><span class="bold">ORDER #: </span>${orderNumber}</div>
              <div><span class="bold">TYPE: </span>${orderToPrint.orderType?.charAt(0).toUpperCase() + orderToPrint.orderType?.slice(1) || 'Delivery'}</div>
              <div><span class="bold">Customer: </span>${orderToPrint.fullName || ''}</div>
              <div><span class="bold">Cashier: </span>POS</div>
            </div>
            <div>
              <div><span class="bold">Date: </span>${currentDate}</div>
              <div><span class="bold">Time: </span>${currentTime}</div>
              <div><span class="bold">Rider: </span>General</div>
              <div><span class="bold">Covers: </span>1</div>
            </div>
          </div>
          
          <table style="margin-top: 5px;">
            <tr>
              <th style="text-align: left;">SR.#</th>
              <th style="text-align: left;">DESCRIPTION</th>
              <th style="text-align: center;">QTY</th>
              <th style="text-align: right;">RATE</th>
              <th style="text-align: right;">AMOUNT</th>
            </tr>
            ${itemRows}
          </table>
          
          <div style="margin-top: 3px;">
            <div><span class="bold">Item(s): </span>${orderToPrint.items.length} <span style="float: right;"><span class="bold">Gross Amount: </span>${subtotal}</span></div>
          </div>
          
          <div class="summary">
            <div><span class="bold">Sales Tax: </span>${tax}</div>
            <div><span class="bold">Delivery Charges: </span>${deliveryFee}</div>
            <div><span class="bold">Discount ${discountPercentage}%: </span>${discount}</div>
            <div class="bill-amount"><span class="bold">Bill Amount: </span>${total}</div>
          </div>
          
          <div class="customer-info">
            <div><span class="bold">Customer Name & Contact: </span>${orderToPrint.fullName || ''}</div>
            <div>${orderToPrint.mobileNumber || ''}</div>
            <div><span class="bold">Complete Address: </span>${orderToPrint.deliveryAddress || ''}</div>
            <div><span class="bold">Instruction: </span>${orderToPrint.paymentInstructions || '----'}</div>
          </div>
        </body>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </script>
      </html>
    `;
    
    const newWindow = window.open("", "_blank", "width=300,height=600");
    if (!newWindow) return;
    
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  }, [fetchOrderDetails, orderNumbers, getDeliveryFeeForArea]);

  // DELIVERY PAYMENT RECEIPT PRINT FUNCTION
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
    
    const idVal = String(extractValue(orderToPrint._id));
    const orderNumber = orderNumbers[idVal] || `king-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Extract area from delivery address and get delivery fee
    const area = orderToPrint.area || extractAreaFromAddress(orderToPrint.deliveryAddress);
    const deliveryFee = orderToPrint.orderType === 'delivery' ? 
      getDeliveryFeeForArea(area) : 0;
    
    const subtotal = extractValue(orderToPrint.subtotal) || 0;
    const tax = extractValue(orderToPrint.tax) || 0;
    const discount = extractValue(orderToPrint.discount) || 0;
    const total = extractValue(orderToPrint.total) || 0;
    const paymentMethod = orderToPrint.paymentMethod === 'cod' ? 'Cash' : 'Online Payment';
    const changeRequest = orderToPrint.changeRequest || '0.00';
    
    const itemRows = orderToPrint.items.map((item, index) => {
      const { quantity, cleanName } = parseItemName(item.name);
      const price = extractValue(item.price) || 0;
      const amount = price * quantity;
      
      return `
        <tr>
          <td style="padding: 2px 0; border-bottom: 1px dotted #ddd;">${index + 1}</td>
          <td style="padding: 2px 0; border-bottom: 1px dotted #ddd;">${cleanName}</td>
          <td style="padding: 2px 0; border-bottom: 1px dotted #ddd; text-align: center;">${quantity}</td>
          <td style="padding: 2px 0; border-bottom: 1px dotted #ddd; text-align: right;">${price}</td>
          <td style="padding: 2px 0; border-bottom: 1px dotted #ddd; text-align: right;">${amount}</td>
        </tr>
      `;
    }).join('');
    
    const htmlContent = `
      <html>
        <head>
          <title>Delivery Payment Receipt</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 5px;
              width: 72mm; /* Standard thermal receipt width */
              font-size: 9px;
            }
            .header {
              text-align: center;
              margin-bottom: 5px;
            }
            .title {
              background-color: #000;
              color: #fff;
              padding: 3px;
              text-align: center;
              font-weight: bold;
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            .summary {
              margin-top: 5px;
              text-align: right;
            }
            .customer-info {
              margin-top: 5px;
              border: 1px solid #000;
              padding: 3px;
            }
            .payment-info {
              margin-top: 5px;
            }
            .bold {
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .bill-amount {
              background-color: #000;
              color: #fff;
              padding: 2px 5px;
              margin-top: 3px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="bold">KING ICE FAST FOOD</div>
            <div>Landhi 3 1/2 SNTN 5609626-7</div>
            <div>All Prices Are Inclusive of 13% SST</div>
          </div>
          
          <div class="title">DELIVERY - PAYMENT RECEIPT</div>
          
          <div style="display: flex; justify-content: space-between;">
            <div>
              <div><span class="bold">ORDER #: </span>${orderNumber}</div>
              <div><span class="bold">TYPE: </span>${orderToPrint.orderType?.charAt(0).toUpperCase() + orderToPrint.orderType?.slice(1) || 'Delivery'}</div>
              <div><span class="bold">Customer: </span>${orderToPrint.fullName || ''}</div>
              <div><span class="bold">Cashier: </span>POS</div>
            </div>
            <div>
              <div><span class="bold">Date: </span>${currentDate}</div>
              <div><span class="bold">Time: </span>${currentTime}</div>
              <div><span class="bold">Rider: </span>General</div>
              <div><span class="bold">Covers: </span>1</div>
            </div>
          </div>
          
          <table style="margin-top: 5px;">
            <tr>
              <th style="text-align: left;">SR.#</th>
              <th style="text-align: left;">DESCRIPTION</th>
              <th style="text-align: center;">QTY</th>
              <th style="text-align: right;">RATE</th>
              <th style="text-align: right;">AMOUNT</th>
            </tr>
            ${itemRows}
          </table>
          
          <div style="margin-top: 3px;">
            <div><span class="bold">Item(s): </span>${orderToPrint.items.length} <span style="float: right;"><span class="bold">Gross Amount: </span>${subtotal}</span></div>
          </div>
          
          <div class="summary">
            <div><span class="bold">Delivery Chrgs.: </span>${deliveryFee}</div>
            <div><span class="bold">Tip Amount: </span>0</div>
            <div class="bill-amount"><span class="bold">Bill Amount: </span>${total}</div>
          </div>
          
          <div class="payment-info">
            <div><span class="bold">Payment Method: </span>${paymentMethod}</div>
            <div style="margin-top: 5px;">
              <div><span class="bold">Customer Paid: </span>${total}.00</div>
              <div><span class="bold">Change Return: </span>${changeRequest || '0.00'}</div>
            </div>
          </div>
          
          <div class="customer-info">
            <div><span class="bold">Customer Name & Contact: </span>${orderToPrint.fullName || ''}</div>
            <div>${orderToPrint.mobileNumber || ''}</div>
            <div><span class="bold">Complete Address: </span>${orderToPrint.deliveryAddress || ''}</div>
            <div><span class="bold">Instruction: </span>${orderToPrint.paymentInstructions || '----'}</div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `;
    
    const newWindow = window.open("", "_blank", "width=300,height=600");
    if (!newWindow) return;
    
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  }, [fetchOrderDetails, orderNumbers, getDeliveryFeeForArea]);

  // The original printOrderDetails function is now obsolete with our new specialized printing functions
  const printOrderDetails = useCallback(async (order) => {
    // Default to printing delivery payment receipt as before
    printDeliveryPaymentReceipt(order);
  }, [printDeliveryPaymentReceipt]);

  // Add a manual refresh button
  const refreshOrders = () => {
    fetchOrders(currentPage, true);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
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

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
        <div className="flex gap-2 items-center">
          <label htmlFor="dateFilter" className="font-medium">
            Filter by Date:
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
            Filter by Type:
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
      </div>

      <table className="min-w-full border-collapse">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 border text-left">Sr No</th>
            <th className="p-2 border text-left">Order No</th>
            <th className="p-2 border text-left">Customer Name</th>
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
              <td colSpan="9" className="text-center p-4 text-red-500">
                {error}
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan="9" className="text-center p-4">No orders found.</td>
            </tr>
          ) : (
            orders.map((order, index) => {
              const idVal = String(extractValue(order._id));
              const orderNumber = orderNumbers[idVal] || "king-000";
              const status = order.isCompleted ? "Completed" : "Pending";
              const srNo = ((currentPage - 1) * ordersPerPage + index + 1)
                .toString()
                .padStart(2, "0");
              const orderType = order.orderType
                ? order.orderType.charAt(0).toUpperCase() +
                  order.orderType.slice(1)
                : "Delivery";
                
              // Extract area from delivery address if available
              const area = order.area || extractAreaFromAddress(order.deliveryAddress) || "Clifton";

              return (
                <tr key={idVal} className="hover:bg-gray-100">
                  <td className="p-2 border">{srNo}</td>
                  <td className="p-2 border">{orderNumber}</td>
                  <td className="p-2 border">{order.fullName}</td>
                  <td className="p-2 border">{orderType}</td>
                  <td className="p-2 border w-24">{area}</td>
                  <td className="p-2 border">
                    {extractValue(order.total) || 0}/-
                  </td>
                  <td className="p-2 border">
                    <span
                      className={`font-semibold ${
                        order.isCompleted ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {status}
                    </span>
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
                    <button
                      onClick={() => printOrderDetails(order)}
                      className="text-blue-600 hover:text-blue-800"
                      aria-label="Print order details"
                    >
                      <Printer className="h-5 w-5 inline-block" />
                    </button>
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg relative max-w-lg w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-red-600 text-white rounded-t-lg">
              <h3 className="text-lg font-bold">Order Details</h3>
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-200"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {modalLoading ? (
                <OrderDetailsSkeleton />
              ) : (
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-md font-semibold mb-3 text-gray-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Customer Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-600">Full Name:</p>
                        <p className="font-medium">{selectedOrder.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Mobile Number:</p>
                        <p className="font-medium">{selectedOrder.mobileNumber}</p>
                      </div>
                      {selectedOrder.alternateMobile && (
                        <div>
                          <p className="text-sm text-gray-600">Alternate Mobile:</p>
                          <p className="font-medium">{selectedOrder.alternateMobile}</p>
                        </div>
                      )}
                      {selectedOrder.email && (
                        <div>
                          <p className="text-sm text-gray-600">Email:</p>
                          <p className="font-medium">{selectedOrder.email}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Information */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-md font-semibold mb-3 text-gray-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Order Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-600">Order Type:</p>
                        <p className="font-medium capitalize">
                          {selectedOrder.orderType || "Delivery"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Order Status:</p>
                        <p className={`font-medium ${selectedOrder.isCompleted ? "text-green-600" : "text-red-600"}`}>
                          {selectedOrder.isCompleted ? "Completed" : "Pending"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Payment Method:</p>
                        <p className="font-medium">{selectedOrder.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</p>
                      </div>
                      {selectedOrder.paymentMethod === "online" && selectedOrder.bankName && (
                        <div>
                          <p className="text-sm text-gray-600">Payment Platform:</p>
                          <p className="font-medium">{selectedOrder.bankName}</p>
                        </div>
                      )}
                      {selectedOrder.createdAt && (
                        <div>
                          <p className="text-sm text-gray-600">Order Date:</p>
                          <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Information */}
                  {selectedOrder.orderType === "delivery" && selectedOrder.deliveryAddress && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-md font-semibold mb-3 text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Delivery Information
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Delivery Address:</p>
                          <p className="font-medium">{selectedOrder.deliveryAddress}</p>
                        </div>
                        {selectedOrder.area && (
                          <div>
                            <p className="text-sm text-gray-600">Area:</p>
                            <p className="font-medium">{selectedOrder.area}</p>
                          </div>
                        )}
                        {selectedOrder.nearestLandmark && (
                          <div>
                            <p className="text-sm text-gray-600">Nearest Landmark:</p>
                            <p className="font-medium">{selectedOrder.nearestLandmark}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pickup Information */}
                  {selectedOrder.orderType === "pickup" && selectedOrder.pickupTime && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-md font-semibold mb-3 text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pickup Information
                      </h4>
                      <div>
                        <p className="text-sm text-gray-600">Pickup Time:</p>
                        <p className="font-medium">{selectedOrder.pickupTime}</p>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  {selectedOrder.items && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-md font-semibold mb-3 text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Order Items
                      </h4>
                      <div className="mt-2 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedOrder.items.map((item, i) => {
                              const { quantity, cleanName } = parseItemName(item.name);
                              const price = extractValue(item.price) || 0;
                              const total = price * quantity;
                              
                              return (
                                <tr key={i}>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    <div className="font-medium">{cleanName}</div>
                                    {item.type && <div className="text-xs text-gray-500">{item.type}</div>}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-500 text-center">{quantity}</td>
                                  <td className="px-3 py-2 text-sm text-gray-500 text-right">Rs. {price}</td>
                                  <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">Rs. {total}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-md font-semibold mb-3 text-gray-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Payment Summary
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">Rs. {extractValue(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax:</span>
                        <span className="font-medium">Rs. {extractValue(selectedOrder.tax)}</span>
                      </div>
                      {selectedOrder.orderType === "delivery" && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Fee:</span>
                          <span className="font-medium">
                            Rs. {getDeliveryFeeForArea(selectedOrder.area || extractAreaFromAddress(selectedOrder.deliveryAddress))}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-yellow-600">Rs. {extractValue(selectedOrder.discount)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                        <span className="font-semibold">Total:</span>
                        <span className="font-bold text-red-600">Rs. {extractValue(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Information */}
                  <div className="space-y-3">
                    {selectedOrder.paymentInstructions && (
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Payment Instructions:</p>
                        <p className="text-sm bg-yellow-50 p-2 rounded border border-yellow-100">
                          {selectedOrder.paymentInstructions}
                        </p>
                      </div>
                    )}
                    {selectedOrder.changeRequest && (
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Change Request:</p>
                        <p className="text-sm">Rs. {selectedOrder.changeRequest}</p>
                      </div>
                    )}
                    {selectedOrder.isGift && selectedOrder.giftMessage && (
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Gift Message:</p>
                        <p className="text-sm bg-pink-50 p-2 rounded border border-pink-100">
                          {selectedOrder.giftMessage}
                        </p>
                      </div>
                    )}
                    
                    {/* Payment Receipt Image */}
                    {selectedOrder.paymentMethod === "online" && selectedOrder.receiptImageUrl && (
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">Payment Receipt:</p>
                        <div className="mt-1">
                          <img 
                            src={selectedOrder.receiptImageUrl} 
                            alt="Payment Receipt" 
                            className="max-w-full h-auto max-h-60 border rounded cursor-pointer hover:opacity-90"
                            onClick={() => openReceiptModal(selectedOrder.receiptImageUrl)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="p-6 border-t">
              {/* Print Options */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2 text-gray-700">Print Options:</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => printKitchenSlip(selectedOrder)}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition flex items-center"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Kitchen Slip
                  </button>
                  <button
                    onClick={() => printDeliveryPreBill(selectedOrder)}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition flex items-center"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Pre-Bill
                  </button>
                  <button
                    onClick={() => printDeliveryPaymentReceipt(selectedOrder)}
                    className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition flex items-center"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Payment Receipt
                  </button>
                </div>
              </div>
              
              {/* Order Actions */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-gray-700">Order Actions:</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleCompletion(String(extractValue(selectedOrder._id)), selectedOrder.isCompleted)}
                    className={`px-3 py-2 text-sm rounded flex items-center ${
                      selectedOrder.isCompleted
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {selectedOrder.isCompleted ? (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Mark as Pending
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark as Completed
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteOrder(String(extractValue(selectedOrder._id)))}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {receiptModal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="relative max-w-3xl w-full mx-4">
            <button
              onClick={closeReceiptModal}
              className="absolute top-2 right-2 bg-white rounded-full p-1 text-gray-800 hover:text-gray-600 focus:outline-none"
              aria-label="Close receipt view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={receiptModal.imageUrl} 
              alt="Payment Receipt" 
              className="max-w-full max-h-[85vh] mx-auto object-contain"
            />
          </div>
        </div>
      )}
      
      <Toaster position="top-right" />
    </div>
  );
}