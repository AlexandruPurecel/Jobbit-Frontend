import API from "./TokenApi";

const JOB_REST_API_BASE_URL = '/job'

export const createJob = (job) => API.post(JOB_REST_API_BASE_URL + "/new", job)

export const getAllJobs = () => API.get(JOB_REST_API_BASE_URL)

export const getJobWithImages = (id) => API.get(`${JOB_REST_API_BASE_URL}/image/${id}`);

export const getJobById = (id) => API.get(`${JOB_REST_API_BASE_URL}/${id}`)

export const deleteJob = (id) => API.delete(`${JOB_REST_API_BASE_URL}/${id}`)