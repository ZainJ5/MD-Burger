'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export function SocketProvider({ children, isAdmin = false, onNewOrder }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [latestOrder, setLatestOrder] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (isAdmin) {
      audioRef.current = new Audio('/sound/bell-sound.wav');
      audioRef.current.volume = 0.5;
    }
    
    const socketInstance = io();
    setSocket(socketInstance);

    socketInstance.on('newOrder', (order) => {
      if (isAdmin) {
        setNotifications(prev => [
          {
            id: order._id,
            message: `New order received from ${order.fullName}`,
            time: new Date(),
            read: false,
            order
          },
          ...prev
        ]);
        
        setLatestOrder(order);
        
        try {
          if (audioRef.current) {
            audioRef.current.play().catch(err => console.error('Error playing sound:', err));
          }
        } catch (error) {
          console.error('Error playing notification sound:', error);
        }
        
        toast.success(`New order received from ${order.fullName}`, {
          duration: 5000,
          position: 'top-right',
        });
        
        if (onNewOrder && typeof onNewOrder === 'function') {
          onNewOrder(order);
        }
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [isAdmin, onNewOrder]);

  const markNotificationAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  return (
    <SocketContext.Provider 
      value={{ 
        socket, 
        notifications,
        latestOrder,
        markNotificationAsRead,
        markAllNotificationsAsRead
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);