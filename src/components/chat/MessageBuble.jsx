import React from 'react';
import { format } from 'date-fns';

const MessageBubble = ({ message, isMine }) => {
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    return format(new Date(timestamp), 'h:mm a');
  };

  return (
    <div className={`flex items-start gap-2.5 ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`flex flex-col w-full max-w-[320px] leading-1.5 p-4 rounded-e-xl rounded-es-xl ${
        isMine 
          ? 'bg-green-100 rounded-tl-xl rounded-bl-xl rounded-tr-none order-1' 
          : 'bg-white rounded-tr-xl rounded-br-xl rounded-tl-none order-0'
      } shadow-sm`}>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-sm font-semibold text-gray-900">
            {isMine ? 'You' : message.senderName || 'User'}
          </span>
          <span className="text-sm font-normal text-gray-500">
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
        <p className="text-sm font-normal py-2.5 text-gray-900">
          {message.content}
        </p>
        {message.read !== undefined && isMine && (
          <span className="text-sm font-normal text-gray-500">
            {message.read ? 'Read' : 'Delivered'}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;