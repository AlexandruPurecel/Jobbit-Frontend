import API from "./TokenApi";

BASE_URL = "/images"

export const getImage = (id) => API.get(`${BASE_URL}/${id}`)

export const deleteImage = (id) => API.delete(`${BASE_URL}/${id}`)

export const uploadUserProfileImage = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return API.post(`images/user/${id}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
};

export const uploadJobImage = (jobId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return API.post(`images/job/${jobId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
};