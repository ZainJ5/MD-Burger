"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ChevronRight, 
  Clock, 
  Package, 
  MapPin, 
  CreditCard,
  Truck,
  Store,
  ArrowUpDown,
  Calendar
} from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filter, setFilter] = useState("all");
  
  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        if (typeof window !== "undefined") {
          const orderHistory = JSON.parse(localStorage.getItem("orderHistory") || "[]");
          
          const updatedOrders = [];
          
          for (const order of orderHistory) {
            try {
              const response = await fetch(`/api/orders/${order._id}`);
              if (response.ok) {
                const updatedOrder = await response.json();
                updatedOrders.push({
                  ...order,
                  status: updatedOrder.status
                });
              } else {
                updatedOrders.push(order);
              }
            } catch (error) {
              console.error(`Error fetching order ${order._id}:`, error);
              updatedOrders.push(order);
            }
          }
          
          setOrders(updatedOrders);
          
          localStorage.setItem("orderHistory", JSON.stringify(updatedOrders));
        }
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const sortedOrders = [...orders].sort((a, b) => {
    switch (sortField) {
      case "date":
        return sortDirection === "asc" 
          ? new Date(a.date) - new Date(b.date) 
          : new Date(b.date) - new Date(a.date);
      case "orderNo":
        return sortDirection === "asc" 
          ? a.orderNo.localeCompare(b.orderNo) 
          : b.orderNo.localeCompare(a.orderNo);
      case "total":
        return sortDirection === "asc" 
          ? a.total - b.total 
          : b.total - a.total;
      default:
        return 0;
    }
  });

  const filteredOrders = filter === "all" 
    ? sortedOrders 
    : sortedOrders.filter(order => order.status?.toLowerCase() === filter.toLowerCase());

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch {
      return "Unknown date";
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 ring-yellow-600/20";
      case "in-process":
        return "bg-brand-100 text-brand-800 ring-brand-600/20";
      case "dispatched":
        return "bg-purple-100 text-purple-800 ring-purple-600/20";
      case "complete":
        return "bg-green-100 text-green-800 ring-green-600/20";
      case "cancel":
        return "bg-brand-100 text-brand-800 ring-brand-600/20";
      default:
        return "bg-gray-100 text-gray-800 ring-gray-600/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Orders</h1>
              <p className="text-sm text-gray-500 mt-1">View and track your order history</p>
            </div>
            <div>
              <Link 
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                <Package className="h-4 w-4 mr-2" />
                Order More
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-lg shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
              <Package className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2 items-center">
                <label htmlFor="filter" className="text-sm font-medium text-gray-700">Filter by:</label>
                <select
                  id="filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="rounded-md border border-gray-300 py-1.5 pl-3 pr-8 text-sm bg-white"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="in-process">In Process</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="complete">Completed</option>
                  <option value="cancel">Canceled</option>
                </select>
              </div>
              
              <p className="text-sm text-gray-500">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
              </p>
            </div>
            
            {filteredOrders.length > 0 ? (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("orderNo")}
                        >
                          <div className="flex items-center">
                            <span>Order #</span>
                            {sortField === "orderNo" && (
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("date")}
                        >
                          <div className="flex items-center">
                            <span>Date</span>
                            {sortField === "date" && (
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("total")}
                        >
                          <div className="flex items-center">
                            <span>Total</span>
                            {sortField === "total" && (
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOrders.map((order) => (
                        <tr key={order.orderNo} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">#{order.orderNo}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-gray-900">
                              <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                              {formatDate(order.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ring-1 ring-inset ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                            Rs. {order.total?.toLocaleString() || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {order.orderType === 'delivery' ? (
                                <>
                                  <Truck className="h-4 w-4 text-gray-500 mr-1" />
                                  <span className="text-gray-700">Delivery</span>
                                </>
                              ) : (
                                <>
                                  <Store className="h-4 w-4 text-gray-500 mr-1" />
                                  <span className="text-gray-700">Pickup</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => router.push(`/order/${order._id}`)}
                              className="text-brand-600 hover:text-brand-800 flex items-center justify-end"
                            >
                              View Order
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center bg-white p-12 rounded-lg shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                  <Package className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No matching orders</h3>
                <p className="text-gray-500 mb-6">No orders match the selected filter. Try a different filter or place a new order.</p>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                >
                  Return to Home
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}