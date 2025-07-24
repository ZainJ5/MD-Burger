"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export default function Statistics() {
  const [stats, setStats] = useState({
    totalSales: 0,
    last7DaysSales: 0,
    topItems: [],
    topAreas: [],
    monthlySales: [],
    weeklySales: [],
  });
  const [loading, setLoading] = useState(true);
  const [graphType, setGraphType] = useState("weekly"); // Changed default to weekly since you have more weekly data

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/statistics");
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const salesData = graphType === "monthly" ? stats.monthlySales : stats.weeklySales;
  const graphLabel = graphType === "monthly" ? "Monthly Sales Trend" : "Weekly Sales Trend";

  // Format week label from "2025-W19" to "Week 19"
  const formatWeekLabel = (weekStr) => {
    const match = weekStr.match(/\d+-W(\d+)/);
    return match ? `Week ${match[1]}` : weekStr;
  };

  // Format month label from "2025-05" to "May 25"
  const formatMonthLabel = (monthStr) => {
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    } catch (e) {
      return monthStr;
    }
  };

  // Calculate maximum value for scaling the graph
  const maxSales = salesData && salesData.length > 0 
    ? Math.max(...salesData.map(item => parseFloat(item.total) || 0)) 
    : 1000;

  // Generate y-axis labels with proper formatting
  const yAxisLabels = [
    0,
    Math.round(maxSales * 0.25),
    Math.round(maxSales * 0.5),
    Math.round(maxSales * 0.75),
    Math.round(maxSales)
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold text-gray-800">E-commerce Statistics</h3>
        <button
          onClick={fetchStatistics}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Total Sales</h4>
          <p className="text-3xl font-bold text-green-600">
            Rs. {stats.totalSales.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Last 7 Days Sales</h4>
          <p className="text-3xl font-bold text-blue-600">
            Rs. {stats.last7DaysSales.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Top 5 Items</h4>
        {stats.topItems && stats.topItems.length > 0 ? (
          <ul className="space-y-3">
            {stats.topItems.map((item, index) => (
              <li
                key={item.id || index}
                className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
              >
                <span className="text-gray-700">
                  {index + 1}. {item.name}
                </span>
                <span className="text-gray-600">
                  {item.quantitySold} units (Rs. {item.totalRevenue.toLocaleString()})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No items sold yet.</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Top 5 Delivery Areas</h4>
        {stats.topAreas && stats.topAreas.length > 0 ? (
          <ul className="space-y-3">
            {stats.topAreas.map((area, index) => (
              <li
                key={area.name || index}
                className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
              >
                <span className="text-gray-700">
                  {index + 1}. {area.name || "Unknown Area"}
                </span>
                <span className="text-gray-600">
                  {area.orderCount} orders (Rs. {area.totalRevenue.toLocaleString()})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No orders in delivery areas yet.</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-700">{graphLabel}</h4>
          <button
            onClick={() => setGraphType(graphType === "monthly" ? "weekly" : "monthly")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Show {graphType === "monthly" ? "Weekly" : "Monthly"} Graph
          </button>
        </div>
        
        {salesData && salesData.length > 0 ? (
          <div className="h-80">
            <div className="flex h-full">
              {/* Y-axis */}
              <div className="flex flex-col justify-between pr-2 text-xs text-gray-500 w-20">
                {yAxisLabels.map((value, index) => (
                  <div key={index} className={`${index === 0 ? 'mb-4' : ''}`}>
                    Rs. {value.toLocaleString()}
                  </div>
                ))}
              </div>
              
              {/* Graph container */}
              <div className="flex-1 flex flex-col">
                {/* Graph body */}
                <div className="flex-1 relative border-l border-b border-gray-300">
                  {/* Horizontal grid lines */}
                  {yAxisLabels.map((_, index) => (
                    <div 
                      key={index}
                      className={`absolute w-full border-t border-gray-200 ${index === 0 ? 'bottom-0' : ''}`}
                      style={{
                        bottom: `${index * 25}%`,
                        height: '1px'
                      }}
                    />
                  ))}
                  
                  {/* Bars */}
                  <div className="absolute inset-0 flex items-end pb-4">
                    {salesData.map((item, index) => {
                      const total = parseFloat(item.total) || 0;
                      const heightPercentage = maxSales > 0 ? (total / maxSales) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center mx-1">
                          <div 
                            className="w-3/4 bg-red-600 hover:bg-red-700 transition-colors rounded-t-md relative group cursor-pointer"
                            style={{ height: `${heightPercentage}%` }}
                          >
                            {/* Tooltip */}
                            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10 pointer-events-none">
                              Rs. {total.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* X-axis labels */}
                <div className="h-10 flex">
                  {salesData.map((item, index) => {
                    const label = graphType === "monthly" 
                      ? formatMonthLabel(item.month) 
                      : formatWeekLabel(item.week);
                    
                    return (
                      <div key={index} className="flex-1 flex justify-center px-1">
                        <div className="text-xs text-gray-600 mt-1 transform -rotate-25 origin-top-left whitespace-nowrap">
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No sales data available for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}