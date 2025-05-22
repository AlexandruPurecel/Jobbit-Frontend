import API from "./TokenApi";

const BASE_URL = '/location'

export const getAllLocations = () => API.get(BASE_URL);
export const getLocationById = (id) => API.get(`${BASE_URL}/${id}`);