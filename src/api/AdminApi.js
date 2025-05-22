import API from "./TokenApi";

const BASE_URL = "/admin";

export const getAdminStats = () => API.get(`${BASE_URL}/stats`);

export const getAllUsers = () => API.get(`${BASE_URL}/users`);
export const getAdminUsers = () => API.get(`${BASE_URL}/users/admins`);
export const getRegularUsers = () => API.get(`${BASE_URL}/users/regular`);
export const promoteUser = (userId) => API.put(`${BASE_URL}/users/${userId}/promote`);
export const demoteUser = (userId) => API.put(`${BASE_URL}/users/${userId}/demote`);
export const deleteUser = (userId) => API.delete(`${BASE_URL}/users/${userId}`);

export const getAllJobs = () => API.get(`${BASE_URL}/jobs`);
export const getJobsByUser = (userId) => API.get(`${BASE_URL}/jobs/user/${userId}`);
export const deleteJob = (jobId) => API.delete(`${BASE_URL}/jobs/${jobId}`);