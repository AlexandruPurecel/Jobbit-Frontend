// src/components/chat/ConversationItem.jsx
import React from 'react';
import { format } from 'date-fns';

const ConversationItem = ({ conversation, currentUserId, isActive, onClick }) => {
  const otherUser = conversation.user1.userId === currentUserId 
    ? conversation.user2 
    : conversation.user1;
  
  const lastMessage = conversation.lastMessage;
  const isUnread = lastMessage && 
                  !lastMessage.read && 
                  lastMessage.recipientId === currentUserId;
  
  const formatConversationTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    } else {
      return format(date, 'MMM d');
    }
  };
  
  const getProfileInitial = () => {
    return otherUser?.firstName ? otherUser.firstName.charAt(0).toUpperCase() : '?';
  };

  return (
    <div 
      onClick={onClick}
      className={`flex items-center p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-blue-50' : ''
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-500 font-bold">
        {getProfileInitial()}
      </div>
      <div className="ml-4 flex-grow overflow-hidden">
        <div className="flex justify-between">
          <h3 className={`font-medium ${isUnread ? 'font-bold text-black' : 'text-gray-800'}`}>
            {otherUser?.firstName} {otherUser?.lastName}
          </h3>
          {conversation.lastMessageTime && (
            <span className="text-xs text-gray-500">
              {formatConversationTime(conversation.lastMessageTime)}
            </span>
          )}
        </div>
        <p className={`text-sm truncate ${isUnread ? 'font-semibold text-black' : 'text-gray-500'}`}>
          {lastMessage ? lastMessage.content : 'No messages yet'}
        </p>
      </div>
      {isUnread && (
        <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0 ml-2"></div>
      )}
    </div>
  );
};

export default ConversationItem;