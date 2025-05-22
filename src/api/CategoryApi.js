import API from "./TokenApi";

const BASE_URL = "/category"
export const getAllCategories = () => API.get(BASE_URL);
export const getCategoryById = (id) => API.get(`${BASE_URL}/${id}`);
export const createCategory = (category) => API.post(BASE_URL + "new", category)