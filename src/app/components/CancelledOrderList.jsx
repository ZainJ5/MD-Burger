import { useEffect, useState } from "react";
import { Printer, Eye } from "lucide-react"; 

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("Today");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [error, setError] = useState(null);
  const [branchFilter, setBranchFilter] = useState("all");
  const [branches, setBranches] = useState([]);

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

  useEffect(() => {
    fetchOrderHistory();
  }, [dateFilter, statusFilter, fromDate, toDate, branchFilter]);

  const formatLocalDatetime = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      let url = "/api/order-history";
      const params = new URLSearchParams();
      
      if (dateFilter === "Today" || dateFilter === "Custom") {
        let fromStr, toStr;
        if (dateFilter === "Today") {
          const now = new Date();
          const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          fromStr = formatLocalDatetime(twentyFourHoursAgo);
          toStr = formatLocalDatetime(now);
        } else { // Custom
          if (!fromDate || !toDate) {
            setLoading(false);
            return;
          }
          fromStr = fromDate;
          toStr = toDate;
        }
        params.append('from', `${fromStr}:00`);
        params.append('to', `${toStr}:59`);
      }
      
      if (branchFilter !== "all") {
        params.append('branchFilter', branchFilter);
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setError(null);
      } else {
        setError("Failed to fetch order history");
      }
    } catch (error) {
      setError(`Error fetching order history: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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

  const extractAreaFromAddress = (deliveryAddress) => {
    if (!deliveryAddress) return "N/A";
    
    const parts = deliveryAddress.split(',');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    
    return "N/A";
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date)) return "Invalid Date";
      
      return date.toLocaleDateString('en-US', {
        month: "numeric",
        day: "numeric",
        year: "numeric"
        // hour: "2-digit",
        // minute: "2-digit",
        // hour12: true
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Error";
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "All" && order.status !== statusFilter) return false;
    return true;
  });

  const handleDelete = async (orderId) => {
    const password = prompt("Enter password to delete order:");
    if (password === "delete@tipu123") {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
        if (res.ok) {
          setOrders(orders.filter((o) => o._id !== orderId));
        } else {
          alert("Failed to delete order");
        }
      } catch (error) {
        alert("Error deleting order");
      }
    } else {
      alert("Incorrect password");
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case "Complete": return "bg-green-100 text-green-800";
      case "Cancel": return "bg-red-100 text-red-800";
      // case "Pending": return "bg-yellow-100 text-yellow-800";
      // case "In-Process": return "bg-blue-100 text-blue-800";
      // case "Dispatched": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg">
      {/* <h1 className="text-black text-2xl font-bold mb-2">Order History</h1>
      <p className="text-gray-600 text-sm mb-6">
        Manage your restaurant operations efficiently and effectively.
      </p> */}
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <span className="text-gray-700 mr-2 font-medium">Date:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          >
            <option>Today</option>
            <option>All</option>
            <option>Custom</option>
          </select>
        </div>
        
        {dateFilter === "Custom" && (
          <div className="flex items-center gap-3">
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
        )}
        
        <div className="flex items-center">
          <span className="text-gray-700 mr-2 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          >
            <option>All</option>
            <option>Complete</option>
            <option>Cancel</option>
            {/* <option>Pending</option>
            <option>In-Process</option>
            <option>Dispatched</option> */}
          </select>
        </div>

        <div className="flex items-center">
          <span className="text-gray-700 mr-2 font-medium">Branch:</span>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-800">
              <th className="p-3 text-left font-semibold">Sr No</th>
              <th className="p-3 text-left font-semibold">Order #</th>
              <th className="p-3 text-left font-semibold">Name</th>
              <th className="p-3 text-left font-semibold">Date</th>
              {/* <th className="p-3 text-left font-semibold">Type</th> */}
              {/* <th className="p-3 text-left font-semibold">Area</th> */}
              <th className="p-3 text-left font-semibold">Amount</th>
              <th className="p-3 text-left font-semibold">Status</th>
              <th className="p-3 text-left font-semibold">Reason</th>
              <th className="p-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="p-3 border-b"><div className="h-4 bg-gray-200 rounded"></div></td>
                  <td className="p-3 border-b"><div className="h-4 bg-gray-200 rounded"></div></td>
                  <td className="p-3 border-b"><div className="h-4 bg-gray-200 rounded"></div></td>
                  <td className="p-3 border-b"><div className="h-4 bg-gray-200 rounded"></div></td>
                  <td className="p-3 border-b"><div className="h-4 bg-gray-200 rounded"></div></td>
                  <td className="p-3 border-b"><div className="h-4 bg-gray-200 rounded"></div></td>
                  <td className="p-3 border-b"><div className="h-4 bg-gray-200 rounded"></div></td>
                  <td className="p-3 border-b"><div className="h-4 bg-gray-200 rounded"></div></td>
                  <td className="p-3 border-b"><div className="h-4 bg-gray-200 rounded"></div></td>
                  <td className="p-3 border-b"><div className="h-4 bg-gray-200 rounded"></div></td>
                </tr>
              ))
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="10" className="p-4 text-center text-gray-500 border-b">
                  No orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, index) => {
                const area = order.area || extractAreaFromAddress(order.deliveryAddress);
                return (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 border-b">{index + 1}</td>
                    <td className="p-3 border-b font-medium">
                      {order.orderNo}
                    </td>
                    <td className="p-3 border-b">{order.fullName}</td>
                    <td className="p-3 border-b text-sm text-gray-600">
                      {formatDateTime(order.createdAt)}
                    </td>
                    {/* <td className="p-3 border-b">
                      {order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}
                    </td> */}
                    {/* <td className="p-3 border-b">{area}</td> */}
                    <td className="p-3 border-b font-medium">
                      Rs. {extractValue(order.total) || order.total}
                    </td>
                    <td className="p-3 border-b">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 border-b">
                      {order.status === "Cancel" && order.cancelReason
                        ? order.cancelReason
                        : ""}
                    </td>
                    <td className="p-3 border-b">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDelete(order._id)}
                          className="text-red-600 hover:text-red-800 font-medium text-xs"
                          title="Delete Order"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}