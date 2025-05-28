import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { connectWebSocket, addNotificationListener, 
  removeNotificationListener,
  addMessageListener,
  removeMessageListener } from './WebSocketService';
import { getUnreadCount } from '../api/NotificationApi';

const initialState = {
  notifications: [],
  unreadCount: 0,
  connected: false,
  loading: false
};

const actionTypes = {
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  SET_CONNECTED: 'SET_CONNECTED',
  SET_LOADING: 'SET_LOADING'
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload
      };

    case actionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };

    case actionTypes.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case actionTypes.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      };

    case actionTypes.DELETE_NOTIFICATION:
      const notificationToDelete = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: notificationToDelete && !notificationToDelete.isRead 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount
      };

    case actionTypes.SET_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload
      };

    case actionTypes.SET_CONNECTED:
      return {
        ...state,
        connected: action.payload
      };

    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    default:
      return state;
  }
};

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const handleNewNotification = (notification) => {
    dispatch({ type: actionTypes.ADD_NOTIFICATION, payload: notification });
    
  };

  const handleNewMessage = (message) => {
  };

  const actions = {
    setNotifications: (notifications) => {
      dispatch({ type: actionTypes.SET_NOTIFICATIONS, payload: notifications });
    },

    markAsRead: (notificationId) => {
      dispatch({ type: actionTypes.MARK_AS_READ, payload: notificationId });
    },

    markAllAsRead: () => {
      dispatch({ type: actionTypes.MARK_ALL_AS_READ });
    },

    deleteNotification: (notificationId) => {
      dispatch({ type: actionTypes.DELETE_NOTIFICATION, payload: notificationId });
    },

    setUnreadCount: (count) => {
      dispatch({ type: actionTypes.SET_UNREAD_COUNT, payload: count });
    },

    loadUnreadCount: async () => {
      try {
        const response = await getUnreadCount();
        dispatch({ type: actionTypes.SET_UNREAD_COUNT, payload: response.data?.unreadCount || 0 });
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    }
  };

  useEffect(() => {

    const onConnected = () => {
      dispatch({ type: actionTypes.SET_CONNECTED, payload: true });
    };

    const onError = (error) => {
      console.error('WebSocket error:', error);
      dispatch({ type: actionTypes.SET_CONNECTED, payload: false });
    };

    connectWebSocket(handleNewMessage, handleNewNotification, onConnected, onError);
    addNotificationListener(handleNewNotification);
    addMessageListener(handleNewMessage);
    actions.loadUnreadCount();

    return () => {
      removeNotificationListener(handleNewNotification);
      removeMessageListener(handleNewMessage);
    };
  }, []);

  const value = {
    ...state,
    ...actions
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;