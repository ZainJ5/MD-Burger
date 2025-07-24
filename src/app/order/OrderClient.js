"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

function OrderContent({ searchParams }) {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderCount, setOrderCount] = useState(0);
  const fetchOrderCount = async () => {
    try {
      const res = await fetch('/api/orders');
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      if (Array.isArray(data)) {
        setOrderCount(data.length);
      }
    } catch (error) {
      console.error("Failed to fetch order count:", error);
    }
  };
  

  useEffect(() => {
    fetchOrderCount(); 
    const orderId = searchParams?.id;

    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      if (typeof window !== 'undefined') {
        const savedOrder = sessionStorage.getItem('lastOrder');
        if (savedOrder) {
          setOrderDetails(JSON.parse(savedOrder));
          setLoading(false);
        } else {
          setError("No order information found");
          setLoading(false);
        }
      }
    }
  }, [searchParams]);

  const fetchOrderDetails = async (orderId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }
      const data = await response.json();
      setOrderDetails(data);
    } catch (error) {
      console.error("Error fetching order:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const orderDisplayId = `tipu-${(orderCount ).toString().padStart(3, '0')}`;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
          <p className="mt-4 text-black">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-600 text-5xl mb-4">!</div>
          <h1 className="text-2xl font-bold mb-2 text-black">Error Loading Order</h1>
          <p className="text-black mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 text-white py-2 px-6 rounded hover:bg-red-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <div className="text-yellow-500 text-5xl mb-4">?</div>
          <h1 className="text-2xl font-bold mb-2 text-black">No Order Found</h1>
          <p className="text-black mb-4">We couldn't find any order details to display.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 text-white py-2 px-6 rounded hover:bg-red-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo.png" alt="Logo" className="h-12 w-12 rounded-full" />
            <div className="ml-3">
              <h1 className="font-bold text-lg text-black">Tipu Burger and Broast</h1>
              <p className="text-sm text-green-600">Open</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* <a href="tel:+923462838244" className="flex items-center text-sm text-black">
              <span className="text-red-600 mr-1">📞</span>
              +923462838244
            </a>
            <button className="text-sm flex items-center text-black">
              <span className="text-green-600 mr-1">💬</span>
              Chat
            </button>
            <button className="text-sm flex items-center text-black">
              <span className="mr-1">📍</span>
              Address
            </button> */}
            <button
              onClick={() => router.push('/')}
              className="bg-red-600 text-white px-4 py-1 rounded text-sm flex items-center"
            >
              <span className="mr-1">🛒</span>
              Order Now
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-black">Orders</span>
            <span className="text-black">&gt;</span>
            <span className="font-medium text-black">{orderDisplayId}</span>
          </div>
          <button
            onClick={() => window.print()}
            className="bg-red-600 text-white px-4 py-1 rounded text-sm"
          >
            PRINT RECEIPT
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white shadow-sm rounded-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4">
            <div>
              <h2 className="text-xl font-bold text-black">Order# {orderDisplayId}</h2>
              <p className="text-sm text-black">Ordered from Web</p>
            </div>
            <div className="mt-2 md:mt-0">
              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                {orderDetails.status || "Received"}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div>
              <div className="flex items-center mb-3">
                <span className="text-red-600 mr-2">📋</span>
                <h3 className="font-medium text-black">Order Information</h3>
              </div>
              <div className="space-y-3 text-sm text-black">
                <div>
                  <p>Name:</p>
                  <p>{orderDetails.customerName || orderDetails.fullName}</p>
                </div>
                <div>
                  <p>Delivery Address:</p>
                  <p>{orderDetails.deliveryAddress}</p>
                </div>
                {orderDetails.nearestLandmark && (
                  <div>
                    <p>Nearest Landmark:</p>
                    <p>{orderDetails.nearestLandmark}</p>
                  </div>
                )}
                <div>
                  <p>Phone Number:</p>
                  <p>{orderDetails.mobileNumber}</p>
                </div>
                {orderDetails.alternateMobile && (
                  <div>
                    <p>Alternative Phone Number:</p>
                    <p>{orderDetails.alternateMobile}</p>
                  </div>
                )}
                <div>
                  <p>Ordered At:</p>
                  <p>{formatDate(orderDetails.orderDate)}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-3">
                <span className="text-red-600 mr-2">🏪</span>
                <h3 className="font-medium text-black">Merchant Information</h3>
              </div>
              <div className="space-y-3 text-sm text-black">
                <div>
                  <p>Shop Name:</p>
                  <p>Tipu Burger and Broast</p>
                </div>
                <div>
                  <p>Phone Number:</p>
              <div className="flex items-center space-x-1">
                <a
                  href="https://wa.me/923332245706"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-black hover:underline"
                >
                  0333 2245706
                </a>
                <span>/</span>
                <a
                  href="https://wa.me/923463332682"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-black hover:underline"
                >
                  0346 3332682
                </a>
              </div>
              </div>
                <div>
                  <p>Location:</p>
                  <p>{"Clifton"}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-3">
                <span className="text-red-600 mr-2">🚚</span>
                <h3 className="font-medium text-black">Delivery Information</h3>
              </div>
              <div className="space-y-3 text-sm text-black">
                <div>
                  <p>Status:</p>
                  <p>{orderDetails.status || "Pending delivery"}</p>
                </div>
                <div>
                  <p>Estimated Delivery:</p>
                  <p>{"Within 30-45 Minutes"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <table className="w-full text-sm text-black">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Product Name</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4 text-center">Price</th>
                  <th className="py-3 px-4 text-center">Amount</th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.items && orderDetails.items.map((item, index) => (
                  <tr key={index} className={index < orderDetails.items.length - 1 ? "border-b" : ""}>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-md mr-3">
                          <img 
                            src={item.imageUrl || `/api/placeholder/100/100`} 
                            alt={item.name || item.title} 
                            className="w-full h-full object-cover rounded-md" 
                          />
                        </div>
                        <div>
                          <p className="font-medium">{item.name || item.title}</p>
                          <p className="text-xs">{item.type || ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">{item.quantity}</td>
                    <td className="py-4 px-4 text-center">{item.price}</td>
                    <td className="py-4 px-4 text-center">Rs. {item.price * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs">
              <div className="space-y-2 text-sm text-black">
                <div className="flex justify-between">
                  <span>SubTotal:</span>
                  <span className="font-medium">Rs. {orderDetails.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="font-medium">- Rs. {parseInt(orderDetails.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span className="font-medium">Rs. {orderDetails.deliveryFee || 0}</span>
                </div>
                <div className="flex justify-between pt-2 border-t mt-2">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">Rs. {orderDetails.total}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span>Payment Status:</span>
                  <span>{orderDetails.paymentStatus || "Pending"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Type:</span>
                  <span>{orderDetails.paymentMethod || "Cash On Delivery"}</span>
                </div>
                {orderDetails.bankName && (
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span>{orderDetails.bankName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 text-white py-2 px-6 rounded hover:bg-red-700"
          >
            Order More Food
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-200 text-gray-800 py-2 px-6 rounded hover:bg-gray-300"
          >
            Print Receipt
          </button>
        </div>
      </div>

      <footer className="bg-white mt-8 border-t">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-full inline-block mr-2" />
              <h3 className="font-medium inline-block text-black">Tipu Burger and Broast</h3>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function OrderLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
        <p className="mt-4 text-black">Loading order details...</p>
      </div>
    </div>
  );
}

export default function OrderClient({ searchParams }) {
  return (
    <Suspense fallback={<OrderLoading />}>
      <OrderContent searchParams={searchParams} />
    </Suspense>
  );
}