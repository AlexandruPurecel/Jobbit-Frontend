import React from 'react';
import { useNavigate } from 'react-router-dom';

const MessageButton = ({ userId, jobPostedBy, className, buttonText = "Message" }) => {
  const navigate = useNavigate();
  
  const handleMessageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const recipientId = jobPostedBy || userId;

    navigate(`/messages/${recipientId}?isRecipient=true`);
  };
  
  return (
    <button
      onClick={handleMessageClick}
      className={`flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${className || ''}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
      {buttonText}
    </button>
  );
};

export default MessageButton;