import React, { useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { connectWebSocket, disconnectWebSocket, addMessageListener, removeMessageListener } from '../services/WebSocketService';
import { getConversations, getConversationMessages, 
  sendMessage as apiSendMessage,
  markMessageAsRead } from '../api/ChatApi';
import MessageBubble from '../components/chat/MessageBuble';
import ChatInput from '../components/chat/ChatInput';
import ConversationItem from '../components/chat/ConversationItem';
import { getUser } from '../api/UsersApi';

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [isStartingNewConversation, setIsStartingNewConversation] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [highlightMessageId, setHighlightMessageId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const isRecipient = searchParams.get('isRecipient') === 'true';
  const messageId = searchParams.get('messageId');
  const messagesContainerRef = useRef(null);
 
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUserId(decoded.userId);
    } catch (error) {
      console.error('Error decoding token:', error);
      navigate('/login');
    }
  }, [navigate]);


  const handleNotificationNavigation = async (messageId) => {
    try {

      const messageResponse = await getMessage(messageId);
      const message = messageResponse.data;
      
      const targetConversation = conversations.find(c => c.id === message.conversationId);
      
      if (targetConversation) {
        setCurrentConversation(targetConversation);
        setIsStartingNewConversation(false);
        setHighlightMessageId(messageId);

        navigate(`/messages/${targetConversation.id}`, { replace: true });
        
        setTimeout(() => {
          const messageElement = document.getElementById(`message-${messageId}`);
          if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight-message');
            
            setTimeout(() => {
              messageElement.classList.remove('highlight-message');
              setHighlightMessageId(null);
            }, 3000);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error navigating to message from notification:', error);
      navigate('/messages', { replace: true });
    }
  };

  useEffect(() => {
    if (!userId) return;
    
    const fetchAndProcessConversations = async () => {
      try {
        console.log("Fetching conversations...");
        const response = await getConversations();
        const conversationsList = response.data;
        setConversations(conversationsList);
        setLoading(false);
        
        if (messageId) {
          await handleNotificationNavigation(messageId);
          return;
        }
        
        if (conversationId && isRecipient) {
          const recipientId = conversationId; 
          
          const existingConversation = conversationsList.find(c => 
            (c.user1.userId === parseInt(recipientId) && c.user2.userId === userId) || 
            (c.user2.userId === parseInt(recipientId) && c.user1.userId === userId)
          );
          
          if (existingConversation) {
            setCurrentConversation(existingConversation);
            setIsStartingNewConversation(false);
            
            navigate(`/messages/${existingConversation.id}`, { replace: true });
          } else {
            fetchRecipientInfo(recipientId);
          }
        }
        else if (conversationId && !isRecipient) {
          const convo = conversationsList.find(c => c.id === parseInt(conversationId));
          if (convo) {
            setCurrentConversation(convo);
            setIsStartingNewConversation(false);
          } else {
            navigate('/messages', { replace: true });
          }
        }
        else if (!conversationId && conversationsList.length > 0) {
          console.log("Loading most recent conversation");
          const mostRecentConversation = conversationsList[0]; 
          setCurrentConversation(mostRecentConversation);
          setIsStartingNewConversation(false);
          
          navigate(`/messages/${mostRecentConversation.id}`, { replace: true });
        }
      } catch (error) {
        setError('Failed to load conversations.');
        setLoading(false);
      }
    };
    
    fetchAndProcessConversations();
  }, [userId, conversationId, isRecipient, messageId, navigate]);

  useEffect(() => {
    if (!userId) return;

    const handleNewMessage = (message) => {
      if (currentConversation && 
         (message.conversationId === currentConversation.id)) {
        setMessages(prev => [...prev, message]);
        markMessageAsRead(message.id).catch(err => 
          console.error('Error marking message as read:', err)
        );
      }
      
      setConversations(prevConversations => {
        const updatedConversations = [...prevConversations];
        const conversationIndex = updatedConversations.findIndex(
          c => c.id === message.conversationId
        );
        
        if (conversationIndex !== -1) {
          const conversation = {...updatedConversations[conversationIndex]};
          conversation.lastMessage = message;
          conversation.lastMessageTime = message.timestamp;
          
          updatedConversations.splice(conversationIndex, 1);
          updatedConversations.unshift(conversation);
        } else {
          fetchConversations();
        }
        
        return updatedConversations;
      });
    };

    connectWebSocket(
      handleNewMessage, 
      null, 
      () => {
        console.log('Connected to WebSocket');
        setWsConnected(true);
      },
      (error) => {
        console.error('WebSocket error:', error);
        setError('Failed to connect to real-time messaging service.');
      }
    );

    addMessageListener(handleNewMessage);

    return () => {
      removeMessageListener(handleNewMessage);
      disconnectWebSocket();
    };
  }, [userId, currentConversation]);

  const currentConversationRef = useRef(currentConversation);

  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  useEffect(() => {
  if (messagesContainerRef.current) {
    const container = messagesContainerRef.current;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }
  }, [messages]);

  const fetchRecipientInfo = async (recipientId) => {
    console.log("Fetching recipient info for ID:", recipientId);
    if (!recipientId) {
      console.error("No recipient ID provided");
      return;
    }
    
    try {
      const response = await getUser(recipientId);
      setRecipientInfo(response.data);
      setIsStartingNewConversation(true);
    } catch (error) {
      console.error('Error fetching recipient info:', error);
      setError('Failed to load recipient information. Please try again.');
      setIsStartingNewConversation(false);
      navigate('/messages', { replace: true });
    }
  };

  const fetchConversations = async () => {
    if (!userId) return;
    
    try {
      const response = await getConversations();
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentConversation) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await getConversationMessages(currentConversation.id);
        setMessages(response.data);
        
        response.data.forEach(message => {
          if (!message.read && message.recipientId === userId) {
            markMessageAsRead(message.id).catch(err => 
              console.error('Error marking message as read:', err)
            );
          }
        });
        setLoadingMessages(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages.');
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [currentConversation, userId]);

  const handleSendMessage = async (content) => {
    if (!content.trim() || !currentConversation || !wsConnected) return;

    try {
      const otherUser = currentConversation.user1.userId === userId 
        ? currentConversation.user2 
        : currentConversation.user1;
      
      const tempMessage = {
        id: `temp-${Date.now()}`,
        senderId: userId,
        recipientId: otherUser.userId,
        content: content,
        timestamp: new Date().toISOString(),
        read: false,
        conversationId: currentConversation.id
      };
      
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      await apiSendMessage(otherUser.userId, content);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  const handleSendFirstMessage = async (content) => {
    if (!content.trim() || !recipientInfo || !wsConnected) return;

    try {
      const tempMessage = {
        id: `temp-${Date.now()}`,
        senderId: userId,
        recipientId: recipientInfo.userId,
        content: content,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      setMessages([tempMessage]);
      
      await apiSendMessage(recipientInfo.userId, content);
      
      const response = await getConversations();
      setConversations(response.data);
      
      const newConversation = response.data.find(c => 
        (c.user1.userId === parseInt(recipientInfo.userId) && c.user2.userId === userId) || 
        (c.user2.userId === parseInt(recipientInfo.userId) && c.user1.userId === userId)
      );
      
      if (newConversation) {
        setCurrentConversation(newConversation);
        setIsStartingNewConversation(false);
        setRecipientInfo(null);
        
        navigate(`/messages/${newConversation.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Failed to start conversation. Please try again.');
    }
  };

  const selectConversation = (conversation) => {
    setCurrentConversation(conversation);
    setIsStartingNewConversation(false);
    setHighlightMessageId(null); 
    navigate(`/messages/${conversation.id}`, { replace: true });
  };

  const getOtherUser = (conversation) => {
    if (!userId || !conversation) return null;
    return conversation.user1.userId === userId ? conversation.user2 : conversation.user1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-10 px-4 sm:px-6 lg:px-8">
      <style jsx={true}>{`
        .highlight-message {
          background-color: #fef3c7 !important;
          border: 2px solid #f59e0b !important;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            border-color: #f59e0b;
          }
          50% {
            border-color: #d97706;
          }
        }
      `}</style>
      
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col md:flex-row" style={{ height: "80vh" }}>
          {/* Conversations sidebar*/}
          <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-200 h-full overflow-hidden">
            <div className="py-4 px-4 bg-gradient-to-r from-indigo-600 to-purple-600  hover:bg-purple-700 text-white h-16 flex items-center">
              <h2 className="text-lg font-semibold">Messages</h2>
            </div>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-2 m-2">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-y-auto h-[calc(80vh-64px)]">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-1">No conversations yet</h3>
                  </div>
                ) : (
                  conversations.map(conversation => (
                    <ConversationItem 
                      key={conversation.id}
                      conversation={conversation}
                      currentUserId={userId}
                      isActive={currentConversation?.id === conversation.id}
                      onClick={() => selectConversation(conversation)}
                    />
                  ))
                )
              )}
            </div>
          </div>

          {/* Chat area - fixed width and height */}
          <div className="w-full md:w-2/3 flex flex-col bg-white h-full">
            {isStartingNewConversation ? (
              <>
                {/* Header for new conversation */}
                <div className="py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600  text-white flex items-center shadow-sm">
                  <div className="w-10 h-10 rounded-full  bg-gradient-to-r from-indigo-600 to-purple-600  flex items-center justify-center text-white font-bold">
                    {recipientInfo?.firstName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-md font-medium">
                      {recipientInfo?.firstName} {recipientInfo?.lastName}
                    </h3>
                    <p className="text-xs opacity-80">New conversation</p>
                  </div>
                </div>
                
                {/* Messages container */}
                <div className="flex-grow overflow-y-auto bg-gray-50 h-[calc(80vh-120px)]">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center bg-white p-6 rounded-lg shadow-md max-w-md">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Start a conversation</h3>
                      <p className="text-gray-600">
                        Type a message below to start chatting with {recipientInfo?.firstName}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Input area*/}
                <div className="bg-gray-100 p-3 border-t border-gray-200">
                  <ChatInput 
                    onSendMessage={handleSendFirstMessage} 
                    placeholder={`Type a message to ${recipientInfo?.firstName}...`}
                    disabled={!wsConnected}
                  />
                </div>
              </>
            ) : currentConversation ? (
              <>
                {/* Header for existing conversation */}
                <div className="py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600  text-white flex items-center justify-between shadow-sm">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center text-white font-bold">
                      {getOtherUser(currentConversation)?.firstName.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-md font-medium">
                        {getOtherUser(currentConversation)?.firstName} {getOtherUser(currentConversation)?.lastName}
                      </h3>
                      {!wsConnected && (
                        <p className="text-xs opacity-80">Offline</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages container*/}
                <div ref={messagesContainerRef} className="flex-grow overflow-y-auto bg-gray-50 h-[calc(80vh-120px)]">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="bg-white p-3 rounded-full shadow-md">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">No messages yet</h3>
                        <p className="text-gray-600">
                          This is the beginning of your conversation with {getOtherUser(currentConversation)?.firstName}. 
                          Start by saying hello!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {messages.map(message => (
                        <div
                          key={message.id}
                          id={`message-${message.id}`}
                          className={highlightMessageId === message.id ? 'highlight-message' : ''}
                        >
                          <MessageBubble 
                            message={message}
                            isMine={message.senderId === userId}
                          />
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input for message in existing conversation*/}
                <div className="bg-gray-100 p-3 border-t border-gray-200">
                  <ChatInput 
                    onSendMessage={handleSendMessage} 
                    disabled={!wsConnected}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No conversations yet</h3>  
                  {loading && (
                    <div className="mt-4 flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;
                