"use client";

import { useEffect, useState, useMemo } from "react";
import { RefreshCw, Download } from "lucide-react";
import * as XLSX from "xlsx";

const numberFmt = (n) => (typeof n === "number" ? n.toLocaleString() : "0");

export default function Statistics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7"); // Default to 7 days
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'completed', 'canceled'
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

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      let url = `/api/statistics`;
      const params = new URLSearchParams();
      
      if (period === "custom") {
        if (!fromDate || !toDate) {
          setLoading(false);
          return;
        }
        params.append('from', `${fromDate}:00`);
        params.append('to', `${toDate}:59`);
      } else {
        params.append('period', period);
      }
      
      if (branchFilter !== "all") {
        params.append('branchFilter', branchFilter);
      }
      
      url += `?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const responseData = await res.json();
      setData(responseData);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [period, branchFilter]);

  const filteredOrders = useMemo(() => {
    if (!data || !data.orders) return [];
    if (filterType === "completed") {
      return data.orders.filter(order => order.status === "Complete");
    } else if (filterType === "canceled") {
      return data.orders.filter(order => order.status === "Cancel");
    }
    return data.orders;
  }, [data, filterType]);

  const stats = useMemo(() => {
    if (!filteredOrders.length) {
      return {
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        pendingOrders: 0,
        inProcessOrders: 0,
        dispatchedOrders: 0,
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        deliveryFees: 0,
        avgOrderValue: 0,
        avgDeliveryFee: 0,
        topAreas: [],
        topItems: [],
        promoCodes: []
      };
    }

    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => o.status === "Complete").length;
    const cancelledOrders = filteredOrders.filter(o => o.status === "Cancel").length;
    const pendingOrders = filteredOrders.filter(o => o.status === "Pending").length;
    const inProcessOrders = filteredOrders.filter(o => o.status === "In-Process").length;
    const dispatchedOrders = filteredOrders.filter(o => o.status === "Dispatched").length;

    const financialOrders = filterType === "canceled" 
      ? filteredOrders 
      : filteredOrders.filter(o => o.status !== "Cancel");
    
    const subtotal = financialOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const tax = financialOrders.reduce((sum, o) => sum + (o.tax || 0), 0);
    const discount = financialOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const total = financialOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    const areaMap = new Map();
    financialOrders.forEach(order => {
      if (order.deliveryAddress) {
        const addressParts = order.deliveryAddress.split(',');
        const area = addressParts.length > 1 
          ? addressParts[addressParts.length - 1].trim() 
          : 'Unknown';
          
        if (!areaMap.has(area)) {
          areaMap.set(area, {
            name: area,
            orderCount: 0,
            totalRevenue: 0,
            orders: []
          });
        }
        
        const areaData = areaMap.get(area);
        areaData.orderCount += 1;
        areaData.totalRevenue += order.total || 0;
        areaData.orders.push(order);
      }
    });
    
    const topAreas = Array.from(areaMap.values())
      .map(area => {
        const estimatedFees = area.orders.reduce((sum, order) => {
          const potentialFee = order.total - ((order.subtotal || 0) - (order.discount || 0) + (order.tax || 0));
          return sum + Math.max(0, potentialFee); 
        }, 0);
        
        return {
          name: area.name,
          orderCount: area.orderCount,
          totalRevenue: area.totalRevenue,
          totalDeliveryFees: estimatedFees,
          avgOrderValue: area.totalRevenue / area.orderCount,
          avgDeliveryFee: estimatedFees / area.orderCount
        };
      })
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);
      
    const itemMap = new Map();
    financialOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const itemId = item.id;
          const title = item.title;
          const price = item.price;
          const quantity = item.quantity || 1;
          
          if (!itemMap.has(itemId)) {
            itemMap.set(itemId, {
              id: itemId,
              title: title,
              totalQuantity: 0,
              totalRevenue: 0
            });
          }
          
          const itemData = itemMap.get(itemId);
          itemData.totalQuantity += quantity;
          itemData.totalRevenue += price * quantity;
        });
      }
    });
    
    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
      
    const promoMap = new Map();
    financialOrders.forEach(order => {
      if (order.promoCode) {
        if (!promoMap.has(order.promoCode)) {
          promoMap.set(order.promoCode, {
            promoCode: order.promoCode,
            uses: 0,
            totalDiscount: 0,
            netRevenue: 0
          });
        }
        
        const promoData = promoMap.get(order.promoCode);
        promoData.uses += 1;
        promoData.totalDiscount += order.discount || 0;
        promoData.netRevenue += order.total || 0;
      }
    });
    
    const promoCodes = Array.from(promoMap.values())
      .map(promo => ({
        ...promo,
        avgDiscountPerUse: promo.totalDiscount / promo.uses,
        avgNetPerUse: promo.netRevenue / promo.uses
      }))
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 10);
    
    const deliveryFees = financialOrders.reduce((sum, order) => {
      if (order.orderType === "delivery") {
        const potentialFee = order.total - ((order.subtotal || 0) - (order.discount || 0) + (order.tax || 0));
        return sum + Math.max(0, potentialFee); 
      }
      return sum;
    }, 0);
    
    const financialOrderCount = financialOrders.length;
    const avgOrderValue = financialOrderCount > 0 ? total / financialOrderCount : 0;
    const deliveryOrders = financialOrders.filter(o => o.orderType === "delivery").length;
    const avgDeliveryFee = deliveryOrders > 0 ? deliveryFees / deliveryOrders : 0;
    
    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      pendingOrders,
      inProcessOrders,
      dispatchedOrders,
      subtotal,
      tax,
      discount,
      total,
      deliveryFees,
      avgOrderValue,
      avgDeliveryFee,
      topAreas,
      topItems,
      promoCodes
    };
    
  }, [filteredOrders, filterType]);

  const downloadReport = () => {
    if (!data || !filteredOrders.length) return;
    
    let reportType;
    if (filterType === "completed") {
      reportType = "Completed_Orders";
    } else if (filterType === "canceled") {
      reportType = "Canceled_Orders";
    } else {
      reportType = "All_Orders";
    }
    
    const periodText = period === "1" ? "1_Day" : period === "7" ? "7_Days" : period === "30" ? "30_Days" : `Custom_${fromDate}_to_${toDate}`;
    
    const summaryData = [
      ["Order Statistics Report"],
      [`Period: ${periodText}`, `Type: ${reportType}`],
      ["Generated On:", new Date().toLocaleString()],
      [""],
      ["Summary Metrics"],
      ["Total Orders", stats.totalOrders],
      ["Completed Orders", stats.completedOrders],
      ["Cancelled Orders", stats.cancelledOrders],
      ["Pending Orders", stats.pendingOrders],
      ["In-Process Orders", stats.inProcessOrders],
      ["Dispatched Orders", stats.dispatchedOrders],
      [""],
      ["Financial Summary"],
      ["Subtotal", stats.subtotal],
      ["Tax", stats.tax],
      ["Discount", stats.discount],
      ["Delivery Fees", stats.deliveryFees],
      ["Total Revenue", stats.total],
      ["Average Order Value", stats.avgOrderValue],
      ["Average Delivery Fee", stats.avgDeliveryFee]
    ];
    
    const ordersData = [
      [
        "Order No", "Date", "Customer", "Status", "Type", 
        "Payment Method", "Subtotal", "Tax", "Discount", "Total",
        "Delivery Address", "Area"
      ],
      ...filteredOrders.map(order => [
        order.orderNo,
        new Date(order.createdAt).toLocaleString(),
        order.fullName,
        order.status,
        order.orderType,
        order.paymentMethod,
        order.subtotal,
        order.tax,
        order.discount,
        order.total,
        order.deliveryAddress || "-",
        order.deliveryAddress ? order.deliveryAddress.split(',').pop().trim() : "-"
      ])
    ];
    
    const wb = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    
    const ws2 = XLSX.utils.aoa_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(wb, ws2, "Orders");
    
    XLSX.writeFile(wb, `Orders_Report_${periodText}_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h3 className="text-2xl font-semibold text-gray-800">Order Statistics</h3>
        <div className="flex flex-wrap gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="1">Last 1 Day</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
          {period === "custom" && (
            <div className="flex gap-3 items-center">
              <input
                type="datetime-local"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="From DateTime"
              />
              <input
                type="datetime-local"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="To DateTime"
              />
              <button
                onClick={fetchStatistics}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          )}

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Orders</option>
            <option value="completed">Completed Only</option>
            <option value="canceled">Canceled Only</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Branches</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>

          <button
            onClick={downloadReport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </button>

          <button
            onClick={fetchStatistics}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-2 gap-4">
        <SummaryCard title="Total Orders" value={numberFmt(stats.totalOrders)} color="text-gray-700" />
        <SummaryCard title="Completed Orders" value={numberFmt(stats.completedOrders)} color="text-green-600" />
        <SummaryCard title="Cancelled Orders" value={numberFmt(stats.cancelledOrders)} color="text-red-600" />
        <SummaryCard title="Pending Orders" value={numberFmt(stats.pendingOrders)} color="text-blue-600" />
      </div>
      
      <div className="grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-2 gap-4">
        <SummaryCard title="Subtotal" value={`Rs. ${numberFmt(stats.subtotal)}`} color="text-amber-600" />
        <SummaryCard title="Tax" value={`Rs. ${numberFmt(stats.tax)}`} color="text-purple-600" />
        <SummaryCard title="Discounts" value={`Rs. ${numberFmt(stats.discount)}`} color="text-blue-600" />
        <SummaryCard title="Total Revenue" value={`Rs. ${numberFmt(stats.total)}`} color="text-green-600" />
        <SummaryCard title="Delivery Fees" value={`Rs. ${numberFmt(stats.deliveryFees)}`} color="text-indigo-600" />
        <SummaryCard title="Avg Order Value" value={`Rs. ${numberFmt(Math.round(stats.avgOrderValue))}`} color="text-pink-600" />
        <SummaryCard title="Avg Delivery Fee" value={`Rs. ${numberFmt(Math.round(stats.avgDeliveryFee))}`} color="text-orange-600" />
      </div>

      <Section title="Order Status Distribution">
        <div className="flex flex-wrap gap-4 justify-center">
          <StatusCard title="Pending" count={stats.pendingOrders} total={stats.totalOrders} color="bg-yellow-100 border-yellow-400" />
          <StatusCard title="In-Process" count={stats.inProcessOrders} total={stats.totalOrders} color="bg-blue-100 border-blue-400" />
          <StatusCard title="Dispatched" count={stats.dispatchedOrders} total={stats.totalOrders} color="bg-purple-100 border-purple-400" />
          <StatusCard title="Completed" count={stats.completedOrders} total={stats.totalOrders} color="bg-green-100 border-green-400" />
          <StatusCard title="Cancelled" count={stats.cancelledOrders} total={stats.totalOrders} color="bg-red-100 border-red-400" />
        </div>
      </Section>

      <Section title="Top 5 Items">
        {stats.topItems && stats.topItems.length > 0 ? (
          <ul className="space-y-2">
            {stats.topItems.map((item, idx) => (
              <li key={item.id || idx} className="flex justify-between p-2 bg-gray-50 rounded-md">
                <span className="text-gray-700">
                  {idx + 1}. {item.title}
                </span>
                <span className="text-gray-600">
                  {item.totalQuantity} qty (Rs. {numberFmt(item.totalRevenue)})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No items sold during this period.</p>
        )}
      </Section>

      <Section title="Top 5 Delivery Areas">
        {stats.topAreas && stats.topAreas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Area</th>
                  <th className="py-2 pr-4">Orders</th>
                  <th className="py-2 pr-4">Net Revenue</th>
                  <th className="py-2 pr-4">Delivery Fees</th>
                  <th className="py-2 pr-4">Avg Order</th>
                  <th className="py-2 pr-4">Avg Delivery Fee</th>
                </tr>
              </thead>
              <tbody>
                {stats.topAreas.map((a, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4">{a.name || "Unknown"}</td>
                    <td className="py-2 pr-4">{a.orderCount}</td>
                    <td className="py-2 pr-4">Rs. {numberFmt(a.totalRevenue)}</td>
                    <td className="py-2 pr-4">Rs. {numberFmt(a.totalDeliveryFees)}</td>
                    <td className="py-2 pr-4">Rs. {numberFmt(Math.round(a.avgOrderValue))}</td>
                    <td className="py-2 pr-4">Rs. {numberFmt(Math.round(a.avgDeliveryFee))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No delivery data during this period.</p>
        )}
      </Section>

      {/* Promo Codes */}
      <Section title="Promo Codes Usage">
        {stats.promoCodes && stats.promoCodes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Uses</th>
                  <th className="py-2 pr-4">Total Discount</th>
                  <th className="py-2 pr-4">Net Revenue</th>
                  <th className="py-2 pr-4">Avg Discount</th>
                  <th className="py-2 pr-4">Avg Net / Use</th>
                </tr>
              </thead>
              <tbody>
                {stats.promoCodes.map((p, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{p.promoCode}</td>
                    <td className="py-2 pr-4">{p.uses}</td>
                    <td className="py-2 pr-4">Rs. {numberFmt(p.totalDiscount)}</td>
                    <td className="py-2 pr-4">Rs. {numberFmt(p.netRevenue)}</td>
                    <td className="py-2 pr-4">Rs. {numberFmt(Math.round(p.avgDiscountPerUse))}</td>
                    <td className="py-2 pr-4">Rs. {numberFmt(Math.round(p.avgNetPerUse))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No promo code usage during this period.</p>
        )}
      </Section>
    </div>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h4 className="text-sm font-medium text-gray-500 mb-1">{title}</h4>
      <p className={`text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h4 className="text-lg font-semibold text-gray-700 mb-4">{title}</h4>
      {children}
    </div>
  );
}

function StatusCard({ title, count, total, color }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className={`p-4 rounded-lg border-2 ${color} w-40 text-center`}>
      <h4 className="text-gray-700 font-medium">{title}</h4>
      <p className="text-2xl font-bold text-gray-800">{count}</p>
      <div className="mt-2 bg-gray-200 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-gray-600 h-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{percentage}% of total</p>
    </div>
  );
}
