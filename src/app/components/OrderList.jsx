import { useState, useEffect, useMemo, useCallback } from "react";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";

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

  const fetchOrders = useCallback(async (page = 1) => {
    const currentCacheKey = generateCacheKey();
    
    setError(null);
    
    const cacheEntry = pageCache[`${currentCacheKey}-${page}`];
    
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
      
      const res = await fetch(`/api/orders?${params.toString()}`, { signal });
      
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      
      const data = await res.json();
      
      if (data && Array.isArray(data.orders)) {
        const mapping = {};
        data.orders.forEach((order, index) => {
          const idVal = String(extractValue(order._id));
          const globalIndex = (page - 1) * ordersPerPage + index;
          mapping[idVal] = "tipu-" + (globalIndex + 1).toString().padStart(3, "0");
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

  const printOrderDetails = useCallback(async (order) => {
    let orderToPrint = order;
    if (!order.items) {
      const fullOrder = await fetchOrderDetails(String(extractValue(order._id)));
      if (!fullOrder) {
        alert("Could not fetch order details for printing");
        return;
      }
      orderToPrint = fullOrder;
    }
    
    const newWindow = window.open("", "_blank", "width=800,height=600");
    if (!newWindow) return;
    
    const itemsList = orderToPrint.items
      .map((item) => {
        const price = extractValue(item.price);
        const { quantity, cleanName } = parseItemName(item.name);
        return `<li>${quantity}x ${cleanName} - Rs ${price}${
          item.type ? ` (Type: ${item.type})` : ""
        }</li>`;
      })
      .join("");

    const subtotal = extractValue(orderToPrint.subtotal);
    const tax = extractValue(orderToPrint.tax);
    const discount = extractValue(orderToPrint.discount);
    const total = extractValue(orderToPrint.total);
    const branch = orderToPrint.branch ? String(extractValue(orderToPrint.branch)) : "";
    const createdAt = orderToPrint.createdAt
      ? new Date(orderToPrint.createdAt).toLocaleString()
      : "";
    const orderType = orderToPrint.orderType
      ? orderToPrint.orderType.charAt(0).toUpperCase() + orderToPrint.orderType.slice(1)
      : "Delivery";

    const htmlContent = `
      <html>
        <head>
          <title>Order Print</title>
          <style>
            body {
              font-family: sans-serif;
              margin: 20px;
            }
            h2 {
              margin-bottom: 1rem;
            }
            .details p {
              margin: 4px 0;
            }
            ul {
              margin-left: 20px;
            }
            .mt-2 {
              margin-top: 0.5rem;
            }
          </style>
        </head>
        <body>
          <h2>Order Details</h2>
          <div class="details">
            <p><strong>Full Name:</strong> ${orderToPrint.fullName}</p>
            <p><strong>Mobile:</strong> ${orderToPrint.mobileNumber}</p>
            ${
              orderToPrint.alternateMobile
                ? `<p><strong>Alternate Mobile:</strong> ${orderToPrint.alternateMobile}</p>`
                : ""
            }
            ${
              orderToPrint.email
                ? `<p><strong>Email:</strong> ${orderToPrint.email}</p>`
                : ""
            }
            <p><strong>Order Type:</strong> ${orderType}</p>
            ${
              orderToPrint.deliveryAddress
                ? `<p><strong>Address:</strong> ${orderToPrint.deliveryAddress}</p>`
                : ""
            }
            ${
              orderToPrint.nearestLandmark
                ? `<p><strong>Nearest Landmark:</strong> ${orderToPrint.nearestLandmark}</p>`
                : ""
            }
            <p><strong>Payment Method:</strong> ${orderToPrint.paymentMethod}</p>
            ${
              orderToPrint.paymentInstructions
                ? `<p><strong>Payment Instructions:</strong> ${orderToPrint.paymentInstructions}</p>`
                : ""
            }
            ${
              orderToPrint.changeRequest
                ? `<p><strong>Change Request:</strong> ${orderToPrint.changeRequest}</p>`
                : ""
            }
            ${
              orderToPrint.promoCode
                ? `<p><strong>Promo Code:</strong> ${orderToPrint.promoCode}</p>`
                : ""
            }
          </div>
          <div class="mt-2">
            <strong>Items:</strong>
            <ul>
              ${itemsList}
            </ul>
          </div>
          <div class="mt-2">
            <p><strong>Subtotal:</strong> ${subtotal} Rs</p>
            <p><strong>Tax:</strong> ${tax} Rs</p>
            <p><strong>Discount:</strong> ${discount} Rs</p>
            <p><strong>Total:</strong> ${total} Rs</p>
          </div>
          ${
            orderToPrint.isGift && orderToPrint.giftMessage
              ? `<p class="mt-2"><strong>Gift Message:</strong> ${orderToPrint.giftMessage}</p>`
              : ""
          }
          ${
            branch
              ? `<p class="mt-2"><strong>Branch:</strong> ${branch}</p>`
              : ""
          }
          ${
            createdAt
              ? `<p class="mt-2"><strong>Order Date:</strong> ${createdAt}</p>`
              : ""
          }
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `;

    newWindow.document.write(htmlContent);
    newWindow.document.close();
  }, [fetchOrderDetails]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Order List</h2>
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
              const orderNumber = orderNumbers[idVal] || "tipu-000";
              const status = order.isCompleted ? "Completed" : "Pending";
              const srNo = ((currentPage - 1) * ordersPerPage + index + 1)
                .toString()
                .padStart(2, "0");
              const orderType = order.orderType
                ? order.orderType.charAt(0).toUpperCase() +
                  order.orderType.slice(1)
                : "Delivery";

              return (
                <tr key={idVal} className="hover:bg-gray-100">
                  <td className="p-2 border">{srNo}</td>
                  <td className="p-2 border">{orderNumber}</td>
                  <td className="p-2 border">{order.fullName}</td>
                  <td className="p-2 border">{orderType}</td>
                  <td className="p-2 border w-24">Clifton</td>
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 inline-block"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19 8H5c-1.1 0-2 .9-2 2v4h4v5h10v-5h4v-4c0-1.1-.9-2-2-2zm-3 9H8v-5h8v5zm3-11V3H6v3H4v4h16V6h-1z" />
                      </svg>
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
            <div className="p-6 border-b">
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Close"
              >
                ×
              </button>
              <h3 className="text-xl font-bold">Order Details</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {modalLoading ? (
                <OrderDetailsSkeleton />
              ) : (
                <>
                  <p>
                    <strong>Full Name:</strong> {selectedOrder.fullName}
                  </p>
                  <p>
                    <strong>Mobile:</strong> {selectedOrder.mobileNumber}
                  </p>
                  {selectedOrder.alternateMobile && (
                    <p>
                      <strong>Alternate Mobile:</strong>{" "}
                      {selectedOrder.alternateMobile}
                    </p>
                  )}
                  {selectedOrder.email && (
                    <p>
                      <strong>Email:</strong> {selectedOrder.email}
                    </p>
                  )}
                  <p>
                    <strong>Order Type:</strong>{" "}
                    {selectedOrder.orderType
                      ? selectedOrder.orderType.charAt(0).toUpperCase() +
                        selectedOrder.orderType.slice(1)
                      : "Delivery"}
                  </p>
                  {selectedOrder.deliveryAddress && (
                    <p>
                      <strong>Address:</strong> {selectedOrder.deliveryAddress}
                    </p>
                  )}
                  {selectedOrder.nearestLandmark && (
                    <p>
                      <strong>Nearest Landmark:</strong>{" "}
                      {selectedOrder.nearestLandmark}
                    </p>
                  )}
                  <p>
                    <strong>Payment Method:</strong> {selectedOrder.paymentMethod}
                  </p>
                  {selectedOrder.paymentInstructions && (
                    <p>
                      <strong>Payment Instructions:</strong> {selectedOrder.paymentInstructions}
                    </p>
                  )}
                  {selectedOrder.changeRequest && (
                    <p>
                      <strong>Change Request:</strong> {selectedOrder.changeRequest}
                    </p>
                  )}
                  {selectedOrder.promoCode && (
                    <p>
                      <strong>Promo Code:</strong> {selectedOrder.promoCode}
                    </p>
                  )}
                  {selectedOrder.items && (
                    <div className="mt-4">
                      <strong>Items:</strong>
                      <ul className="list-disc ml-6">
                        {selectedOrder.items.map((item, i) => {
                          const { quantity, cleanName } = parseItemName(item.name);
                          return (
                            <li key={i}>
                              {quantity}x {cleanName} - Rs {extractValue(item.price)}{" "}
                              {item.type && `(Type: ${item.type})`}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  <div className="mt-4">
                    <p>
                      <strong>Subtotal:</strong>{" "}
                      {extractValue(selectedOrder.subtotal)} Rs
                    </p>
                    <p>
                      <strong>Tax:</strong> {extractValue(selectedOrder.tax)} Rs
                    </p>
                    <p>
                      <strong>Discount:</strong>{" "}
                      {extractValue(selectedOrder.discount)} Rs
                    </p>
                    <p>
                      <strong>Total:</strong> {extractValue(selectedOrder.total)} Rs
                    </p>
                  </div>
                  {selectedOrder.isGift && selectedOrder.giftMessage && (
                    <p className="mt-2">
                      <strong>Gift Message:</strong> {selectedOrder.giftMessage}
                    </p>
                  )}
                  <p className="mt-2">
                    <strong>Branch:</strong> Clifton
                  </p>
                  {selectedOrder.createdAt && (
                    <p className="mt-2 text-sm text-gray-600">
                      <strong>Order Date:</strong>{" "}
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  )}
                </>
              )}
            </div>
            
            <div className="p-6 border-t">
              <div className="flex gap-4">
                <button
                  onClick={() =>
                    toggleCompletion(
                      String(extractValue(selectedOrder._id)),
                      selectedOrder.isCompleted
                    )
                  }
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                  disabled={modalLoading}
                >
                  {selectedOrder.isCompleted
                    ? "Mark as Pending"
                    : "Mark as Completed"}
                </button>
                <button
                  onClick={() =>
                    deleteOrder(String(extractValue(selectedOrder._id)))
                  }
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                  disabled={modalLoading}
                >
                  Delete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}