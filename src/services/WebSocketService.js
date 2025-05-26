import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { jwtDecode } from 'jwt-decode';

let stompClient = null;
let messageCallbacks = [];
let notificationCallbacks = [];
let connectedCallback = null;
let errorCallback = null;

export const connectWebSocket = (onMessageReceived, onNotificationReceived, onConnected, onError) => {
  if (stompClient !== null && stompClient.connected) {
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found, cannot connect to WebSocket');
    return;
  }

  const decoded = jwtDecode(token);
  const userId = decoded.userId;

  connectedCallback = onConnected;
  errorCallback = onError;
  
  // Store message callbacks
  if (onMessageReceived && !messageCallbacks.includes(onMessageReceived)) {
    messageCallbacks.push(onMessageReceived);
  }

  // Store notification callbacks
  if (onNotificationReceived && !notificationCallbacks.includes(onNotificationReceived)) {
    notificationCallbacks.push(onNotificationReceived);
  }

  const socket = new SockJS('http://localhost:8080/ws');
  stompClient = new Client({
    webSocketFactory: () => socket,
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    debug: function (str) {
      console.log(str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = (frame) => {
    // Subscribe to messages
    stompClient.subscribe(`/user/${userId}/queue/messages`, (message) => {
      const receivedMessage = JSON.parse(message.body);
      messageCallbacks.forEach(callback => callback(receivedMessage));
    });

    // Subscribe to notifications
    stompClient.subscribe(`/user/${userId}/notifications`, (notification) => {
      const receivedNotification = JSON.parse(notification.body);
      notificationCallbacks.forEach(callback => callback(receivedNotification));
    });

    if (connectedCallback) {
      connectedCallback();
    }
  };

  stompClient.onStompError = (frame) => {
    console.error('Broker reported error: ' + frame.headers['message']);
    console.error('Additional details: ' + frame.body);
    
    if (errorCallback) {
      errorCallback(frame);
    }
  };

  stompClient.activate();
};

export const disconnectWebSocket = () => {
  if (stompClient !== null) {
    stompClient.deactivate();
    stompClient = null;
    messageCallbacks = [];
    notificationCallbacks = [];
    connectedCallback = null;
    errorCallback = null;
  }
};

export const addMessageListener = (callback) => {
  if (callback && !messageCallbacks.includes(callback)) {
    messageCallbacks.push(callback);
  }
};

export const removeMessageListener = (callback) => {
  messageCallbacks = messageCallbacks.filter(cb => cb !== callback);
};

export const addNotificationListener = (callback) => {
  if (callback && !notificationCallbacks.includes(callback)) {
    notificationCallbacks.push(callback);
  }
};

export const removeNotificationListener = (callback) => {
  notificationCallbacks = notificationCallbacks.filter(cb => cb !== callback);
};

export const isConnected = () => {
  return stompClient !== null && stompClient.connected;
};