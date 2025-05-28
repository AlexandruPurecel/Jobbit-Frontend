// src/components/chat/ChatBadge.jsx
import React, { useState, useEffect } from 'react';
import { getUnreadCount } from '../../api/ChatApi';
import { addMessageListener, removeMessageListener } from '../../services/WebSocketService';

const ChatBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  
  useEffect(() => {
    fetchUnreadCount();
    
    //update message in real time 
    const handleNewMessage = (message) => {
      fetchUnreadCount();
    };
    
    addMessageListener(handleNewMessage);
    
    //Interval to check for new messages
    const intervalId = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      removeMessageListener(handleNewMessage);
      clearInterval(intervalId);
    };
  }, []);
  
  if (unreadCount === 0) {
    return null;
  }
  
  return (
    <div className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
};

export default ChatBadge;