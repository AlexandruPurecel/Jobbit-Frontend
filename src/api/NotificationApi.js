import API from "./TokenApi";

const BASE_URL = "/notifications"

export const getNotification = () => API.get(BASE_URL)

export const getUnreadNotification = () => API.get(`${BASE_URL}/unread`)

export const getUnreadCount = () => API.get(`${BASE_URL}/unread-count`)

export const markAsRead = (id) => API.post(`${BASE_URL}/read/${id}`)

export const markAllAsRead = () => API.post(`${BASE_URL}/read-all`)

export const deleteNotification = (id) => API.delete(`${BASE_URL}/${id}`)

export const clearAllNotifications = () => API.delete(`${BASE_URL}/clear-all`)