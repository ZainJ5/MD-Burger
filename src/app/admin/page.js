'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import AdminPortal from '../components/AdminPortal';
import { SocketProvider } from '../context/SocketContext';
import { Toaster, toast } from 'react-hot-toast';
import kitchenSlipTemplate from '../../templates/kitchen-slip';

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
    if (window.printKitchenSlip && typeof window.printKitchenSlip === 'function') {
      console.log('Electron environment detected. Delegating to silent print handler.');

      let orderToPrint = order;
      if (!order.items) {
        const fullOrder = await fetchOrderDetails(String(extractValue(order._id)));
        if (!fullOrder) {
          console.error("Could not fetch order details for silent printing.");
          toast.error("Could not fetch order details for printing.");
          return;
        }
        orderToPrint = fullOrder;
      }
      
      window.printKitchenSlip(orderToPrint);
    } else {
      console.warn('Electron print handler not found. Falling back to browser printing.');
      
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
          modifiersHtml += `<div class="modifiers" style="margin-top: 3px;">Extras: ${item.selectedExtras.map(e => e.name).join(', ')}</div>`;
        }
        
        if (item.selectedSideOrders && item.selectedSideOrders.length > 0) {
          modifiersHtml += `<div class="modifiers" style="margin-top: 3px;">Side Orders: ${item.selectedSideOrders.map(s => s.name).join(', ')}</div>`;
        }
        
        if (item.specialInstructions && item.specialInstructions.trim() !== '') {
          specialInstructions.push(`${itemName}: ${item.specialInstructions}`);
        }

        const isLastItem = index === array.length - 1;
        const borderStyle = isLastItem ? "border-bottom: none;" : "";

        return `
          <tr>
            <td style="padding: 8px 0; border-top: 1px dashed black; ${borderStyle}">
              <div class="item-name" style="font-weight: 900;">${itemName}</div>
              ${descriptionHtml}
              ${modifiersHtml}
            </td>
            <td style="padding: 8px 0; border-top: 1px dashed black; text-align: center; ${borderStyle}">${quantity}</td>
          </tr>
        `;
      }).join('');

      const instructionsRow = specialInstructions.length > 0 ? 
        `<tr>
          <td colspan="2" style="border-bottom: none; padding-top: 10px;">
            <div style="font-weight: bold; text-decoration: underline; margin-bottom: 5px;">SPECIAL INSTRUCTIONS:</div>
            ${specialInstructions.map(instruction => 
              `<div style="font-weight: bold; margin: 5px 0;">${instruction}</div>`
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
      
      setTimeout(() => {
        newWindow.print();
        newWindow.close();
      }, 250);
    }
  }, [fetchOrderDetails]);

  const handleNewOrder = useCallback((order) => {
    setTimeout(() => {
      // printKitchenSlip(order);
    }, 2000);
  }, [printKitchenSlip]);

  return (
    <SocketProvider isAdmin={true} onNewOrder={handleNewOrder}>
      <AdminPortal onLogout={handleLogout} />
      <Toaster position="top-right" />
    </SocketProvider>
  );
}