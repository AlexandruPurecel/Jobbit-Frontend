import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { jwtDecode } from 'jwt-decode';

let stompClient = null;
let subscribedCallbacks = [];
let connectedCallback = null;
let errorCallback = null;

export const connectWebSocket = (onMessageReceived, onConnected, onError) => {
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
  
  if (onMessageReceived && !subscribedCallbacks.includes(onMessageReceived)) {
    subscribedCallbacks.push(onMessageReceived);
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
    stompClient.subscribe(`/user/${userId}/queue/messages`, (message) => {
      const receivedMessage = JSON.parse(message.body);
      subscribedCallbacks.forEach(callback => callback(receivedMessage));
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
    subscribedCallbacks = [];
    connectedCallback = null;
    errorCallback = null;
  }
};

export const addMessageListener = (callback) => {
  if (callback && !subscribedCallbacks.includes(callback)) {
    subscribedCallbacks.push(callback);
  }
};

export const removeMessageListener = (callback) => {
  subscribedCallbacks = subscribedCallbacks.filter(cb => cb !== callback);
};

export const isConnected = () => {
  return stompClient !== null && stompClient.connected;
};