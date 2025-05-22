import API from "./TokenApi";

const BASE_URL = '/user'

export const createUser = (user) => API.post(BASE_URL + "/new", user)

export const getUser = (id) => API.get(`${BASE_URL}/${id}`)

export const getUserWithPostedJobs = (id) => API.get(`${BASE_URL}/postedJobs/${id}`)
