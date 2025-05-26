import API from "./TokenApi";

const BASE_URL = "/reviews";

export const createReview = (reviewData) => API.post(`${BASE_URL}`, reviewData);

export const getReviewsForUser = (userId) => API.get(`${BASE_URL}/user/${userId}`);

export const getUserReviewStats = (userId) => API.get(`${BASE_URL}/user/${userId}/stats`);

export const updateReview = (reviewId, reviewData) => API.put(`${BASE_URL}/${reviewId}`, reviewData);

export const deleteReview = (reviewId) => API.delete(`${BASE_URL}/${reviewId}`);
