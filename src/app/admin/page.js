'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import AdminPortal from '../components/AdminPortal';
import { SocketProvider } from '../context/SocketContext';
import { Toaster } from 'react-hot-toast';

export default function AdminPage() {
  const router = useRouter();
  const [orderDetailsCache, setOrderDetailsCache] = useState({});

  useEffect(() => {
    const adminAuth = Cookies.get('adminAuth');
    if (!adminAuth) {
      router.push('/admin/login');
    }
  }, [router]);

  const handleLogout = () => {
    Cookies.remove('adminAuth');
    router.push('/admin/login');
  };

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
    
    const idVal = String(extractValue(orderToPrint._id));
    const orderNumber = `king-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
    const ticketNumber = Math.floor(10000 + Math.random() * 90000); // Generate a random 5-digit ticket number
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
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
  }, [fetchOrderDetails]);

  const handleNewOrder = useCallback((order) => {
    printKitchenSlip(order);
  }, [printKitchenSlip]);

  return (
    <SocketProvider isAdmin={true} onNewOrder={handleNewOrder}>
      <AdminPortal onLogout={handleLogout} />
      <Toaster position="top-right" />
    </SocketProvider>
  );
}