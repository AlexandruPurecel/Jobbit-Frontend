import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { getAllCategories } from '../../api/CategoryApi';
import { getAllLocations } from '../../api/LocationApi';
import { getJobById, getJobWithImages } from '../../api/JobApi';

const EditJobPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [streetName, setStreetName] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  
  const [images, setImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userId, setUserId] = useState(null);
  const [originalJob, setOriginalJob] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUserId(decoded.userId);
      
      console.log('Loading job data for ID:', id);
      console.log('Current user ID:', decoded.userId);
      
      Promise.all([
        getJobById(id),          
        getJobWithImages(id),    
        getAllCategories(),
        getAllLocations()
      ])
        .then(([jobDetailsRes, jobImagesRes, categoriesRes, locationsRes]) => {
          
          const job = jobDetailsRes.data;
          setOriginalJob(job);
          
          if (job.postedById !== Number(decoded.userId)) {
            console.warn('Current user is not the owner of this job!');
            setError('You do not have permission to edit this job.');
            setTimeout(() => {
              navigate(`/job/${id}`);
            }, 3000);
            return;
          }
          
          setTitle(job.title || '');
          setDescription(job.description || '');
          setPrice(job.price ? String(job.price) : '');
          setStatus(job.status || 'OPEN');

          if (job.categoryId) {
            console.log('Setting category ID to:', job.categoryId);
            setCategoryId(String(job.categoryId));
          } else {
            setCategoryId('');
          }
          
          if (job.locationDto) {
            setSelectedCity(job.locationDto.city || '');
            setStreetName(job.locationDto.streetName || '');
            setStreetNumber(job.locationDto.streetNumber || '');
          }
          
          if (jobImagesRes.data.jobImages && Array.isArray(jobImagesRes.data.jobImages)) {
            const processedImages = jobImagesRes.data.jobImages.map(img => ({
              id: img.id,
              url: `http://localhost:8080/api/images/${img.id}`
            }));
            setImages(processedImages);
          } else {
            setImages([]);
          }
          
          setCategories(categoriesRes.data || []);
          
          const uniqueCities = Array.from(new Set(locationsRes.data.map(loc => loc.city)))
            .map(city => locationsRes.data.find(loc => loc.city === city));
          setLocations(uniqueCities || []);
          
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading data:', error);
          setError('Failed to load job data. Please try again later.');
          setLoading(false);
        });
    } catch (error) {
      console.error('Error decoding token:', error);
      setError('Something went wrong. Please login again.');
      setLoading(false);
    }
  }, [id, navigate]);

  const getJobWithImages = (jobId) => {
    return axios.get(`http://localhost:8080/api/job/image/${jobId}`);
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (!description.trim()) {
      setError('Description is required');
      return false;
    }
    
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setError('Please enter a valid price');
      return false;
    }
    
    if (!selectedCity) {
      setError('City is required');
      return false;
    }
    
    if (!streetName.trim()) {
      setError('Street name is required');
      return false;
    }
    
    
    return true;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        setError(`File ${file.name} has an invalid type. Only JPG, JPEG, and PNG are allowed.`);
        return false;
      }
      
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
    setError(null);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('image', file);

        const currentProgress = Math.round(((i) / selectedFiles.length) * 100);
        setUploadProgress(currentProgress);
        
        console.log(`Uploading file ${i+1}/${selectedFiles.length}: ${file.name}`);
        
        await axios.post(
          `http://localhost:8080/api/images/job/${id}/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }
      
      setUploadProgress(100);
      setSelectedFiles([]);
      setSuccess('Images uploaded successfully!');
      
      const updatedJobImagesRes = await getJobWithImages(id);
      console.log('Updated job with images:', updatedJobImagesRes.data);
      
      if (updatedJobImagesRes.data.jobImages && Array.isArray(updatedJobImagesRes.data.jobImages)) {
        const processedImages = updatedJobImagesRes.data.jobImages.map(img => ({
          id: img.id,
          url: `http://localhost:8080/api/images/${img.id}`
        }));
        setImages(processedImages);
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err.response?.data?.message || 'Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (imageId) => {
    try {
      await axios.delete(`http://localhost:8080/api/image/${imageId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setImages(prevImages => prevImages.filter(img => img.id !== imageId));
      setSuccess('Image deleted successfully!');
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err.response?.data?.message || 'Failed to delete image. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError(null);
    setSuccess(null);
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      const selectedCategory = categories.find(c => String(c.categoryId) === String(categoryId));
      const categoryName = selectedCategory ? (selectedCategory.name || selectedCategory.categoryName) : null;
      
      console.log('Selected category:', selectedCategory);
      console.log('Using category name:', categoryName);
      
      const updatedJobData = {
        jobId: id,
        title,
        description,
        price: parseFloat(price),
        status,
        postedById: originalJob.postedById,
        postedByName: originalJob.postedByName,
        categoryId: categoryId || null,
        categoryName,
        locationDto: {
          city: selectedCity,
          streetName,
          streetNumber
        }
      };
      
      console.log('Sending updated job data:', updatedJobData);
      
      const response = await axios.put(`http://localhost:8080/api/job/${id}`, updatedJobData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Update response:', response.data);
      
      setSuccess('Job updated successfully!');
      
      setTimeout(() => {
        navigate(`/job/${id}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error updating job:', err);
      setError(err.response?.data?.message || 'Failed to update job. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/job/${id}`);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex justify-center items-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-md">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading job data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
            <h1 className="text-white text-2xl font-bold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Job
            </h1>
            <p className="text-blue-100 mt-1">Update your job listing information</p>
          </div>
          
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
              <p className="text-sm font-medium flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </p>
            </div>
          )}
          
          {success && (
            <div className="mx-6 mt-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
              <p className="text-sm font-medium flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {success}
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Job Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Job Title*
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., House Cleaning, Furniture Assembly"
                required
              />
            </div>
            
            {/* Job Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description*
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the job in detail..."
                required
              ></textarea>
            </div>
            
            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (RON)*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">RON</span>
                </div>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>      
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.name || category.categoryName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Images Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Job Images
              </h3>
              
              {/* Current Images */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                {images && images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((image) => (
                      <div key={image.id} className="relative group rounded-lg overflow-hidden border border-gray-300">
                        <img 
                          src={image.url} 
                          alt={`Job image ${image.id}`} 
                          className="w-full h-24 object-cover"
                          onError={(e) => {
                            console.error(`Error loading image: ${image.url}`);
                            e.target.src = "/images/defaultImage.jpg"; // Înlocuiește cu o imagine placeholder
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => deleteImage(image.id)}
                            className="bg-red-600 text-white rounded-full p-1 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No images available for this job.</p>
                )}
              </div>
              
              {/* Upload New Images */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Upload New Images</h4>
                <label htmlFor="image-upload" className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="space-y-1 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <span className="relative bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        Upload images
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, JPEG up to 5MB
                    </p>
                  </div>
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    className="sr-only"
                    onChange={handleFileSelect}
                  />
                </label>
                
                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h5>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm truncate max-w-xs">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            className="text-red-600 hover:text-red-800 focus:outline-none"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Upload Button */}
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={uploadImages}
                        disabled={isUploading || selectedFiles.length === 0}
                        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          isUploading || selectedFiles.length === 0 ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        {isUploading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading... {uploadProgress}%
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                            </svg>
                            Upload Images
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Location Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Location*</h3>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City*
                </label>
                <select
                  id="city"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a city</option>
                  {locations.map(location => (
                    <option key={location.city} value={location.city}>
                      {location.city}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="streetName" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Name*
                  </label>
                  <input
                    type="text"
                    id="streetName"
                    value={streetName}
                    onChange={(e) => setStreetName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="streetNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Number*
                  </label>
                  <input
                    type="text"
                    id="streetNumber"
                    value={streetNumber}
                    onChange={(e) => setStreetNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className={`px-6 py-2 border border-transparent rounded-lg shadow-sm text-white ${
                  saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center`}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditJobPage;