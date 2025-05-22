import API from "./TokenApi";

export const sendMessage = (recipientId, content) => {
  return API.post('/messages/send', { recipientId, content });
};

export const getConversations = () => {
  return API.get('/messages/conversations');
};

export const getConversationMessages = (conversationId) => {
  return API.get(`/messages/conversation/${conversationId}`);
};

export const markMessageAsRead = (messageId) => {
  return API.post(`/messages/read/${messageId}`);
};

export const getUnreadCount = () => {
  return API.get('/messages/unread-count');
};

export const startConversation = (recipientId, content) => {
  return API.post('/messages/send', { recipientId, content });
};