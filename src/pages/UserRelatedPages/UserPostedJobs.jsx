import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getUserWithPostedJobs } from '../../api/UsersApi';
import { getJobWithImages, deleteJob } from '../../api/JobApi';


const UserPostedJobs = () => {
  const navigate = useNavigate();
  const [postedJobs, setPostedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [jobImagesList, setJobImagesList] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const confirmationRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const userId = decoded.userId;
      setUserId(userId);

      fetchUserPostedJobs(userId);
    } catch (error) {
      console.error('Error decoding token:', error);
      setError('Something went wrong. Please login again.');
      setLoading(false);
    }
  }, [navigate]);

  const fetchUserPostedJobs = async (userId) => {
    try {
      const response = await getUserWithPostedJobs(userId)
      
      let extractedJobs = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          extractedJobs = response.data;
        } else {         
          if (response.data.jobs && Array.isArray(response.data.jobs)) {
            extractedJobs = response.data.jobs;
          } else {
            for (const key of Object.keys(response.data)) {
              const value = response.data[key];
              if (Array.isArray(value)) {
                if (value.length > 0 && value[0].jobId) {
                  extractedJobs = value;
                  break;
                }
              }
            }
          }
        }
      }
      
      setPostedJobs(extractedJobs);
      
      if (extractedJobs.length > 0) {
        fetchJobImages(extractedJobs);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching posted jobs:', error);
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response error status:', error.response.status);
      }
      setError('Failed to load your posted jobs. Please try again later.');
      setLoading(false);
    }
  };

  const fetchJobImages = async (jobs) => {
    
    try {
      const imagePromises = jobs.map(job => {
        return getJobWithImages(job.jobId)
          .then(response => {
            return { jobId: job.jobId, data: response.data };
          })
          .catch(error => {
            console.error(`Error fetching images for job ${job.jobId}:`, error);
            return { jobId: job.jobId, data: null };
          });
      });
      
      const results = await Promise.all(imagePromises);
      
      const imagesMap = {};
      
      results.forEach(result => {
        const { jobId, data } = result;
        
        if (!data) {
          return;
        }
        
        if (data.jobImages && Array.isArray(data.jobImages) && data.jobImages.length > 0) {
          imagesMap[jobId] = `http://localhost:8080/api/images/${data.jobImages[0].id}`;
        } else if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          imagesMap[jobId] = `http://localhost:8080/api/images/${data.images[0].id}`;
        } else {
          for (const key in data) {
            const value = data[key];
            if (Array.isArray(value) && value.length > 0 && value[0].id) {
              imagesMap[jobId] = `http://localhost:8080/api/images/${value[0].id}`;
              break;
            }
          }
        }
      });
      
      setJobImagesList(imagesMap);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (jobId) => {
    return jobImagesList[jobId] || '/images/defaultImage.jpg';
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleDeleteClick = (job) => {
  if (jobToDelete && jobToDelete.jobId === job.jobId) {
    setJobToDelete(null);
  } else {
    setJobToDelete(job);
  }
};

useEffect(() => {
  const handleClickOutside = (event) => {
    if (confirmationRef.current && !confirmationRef.current.contains(event.target)) {
      setJobToDelete(null);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

  

  // Function to confirm and process deletion
  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    
    setDeleteLoading(true);
    
    try {
      await deleteJob(jobToDelete.jobId);
      
      setPostedJobs(prevJobs => prevJobs.filter(job => job.jobId !== jobToDelete.jobId));
      
      setSuccessMessage(`"${jobToDelete.title}" has been successfully deleted.`);
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error deleting job:', error);
      setError('Failed to delete the job. Please try again later.');
    } finally {
      setJobToDelete(null);
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex justify-center items-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-md">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your posted jobs...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-700 font-medium">
          {postedJobs.length} {postedJobs.length === 1 ? 'job' : 'jobs'} posted
        </div>
        <button
          onClick={() => navigate('/add-job')}
          className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Post New Job
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-full p-1.5 mr-3">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl shadow-sm animate-fadeIn">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-full p-1.5 mr-3">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* No Jobs Message */}
      {postedJobs.length === 0 && !error ? (
        <div className="bg-white rounded-2xl shadow-md p-10 text-center border border-gray-100">
          <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">You haven't posted any jobs yet</h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">Start creating job listings to find help with your tasks!</p>
          <button
            onClick={() => navigate('/add-job')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Post Your First Job
          </button>
        </div>
      ) : (
        /* Jobs List */
        <div className="space-y-6">
          {postedJobs.map((job) => (
            <div key={job.jobId} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
              <div className="md:flex">
                {/* Job Image */}
                <div className="md:w-1/4 h-56 md:h-auto relative overflow-hidden group">
                  <img
                    src={getImageUrl(job.jobId)}
                    alt={job.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${getStatusColor(job.status)}`}>
                      {job.status || 'Open'}
                    </span>
                  </div>
                </div>
                
                {/* Job Details */}
                <div className="md:w-3/4 p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2 hover:text-blue-600 transition-colors">{job.title}</h2>
                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Posted on {formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">{job.price} RON</div>
                  </div>
                  
                  <p className="text-gray-600 mb-6 line-clamp-2">{job.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {job.categoryName && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {job.categoryName}
                      </span>
                    )}
                    
                    {job.locationDto?.city && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.locationDto.city}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap justify-end gap-3">
                    <button 
                      onClick={() => navigate(`/job/${job.jobId}`)}
                      className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors duration-200 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                    <button 
                      className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl shadow-sm transition-colors duration-200 flex items-center border border-gray-200"
                      onClick={() => navigate(`/edit-job/${job.jobId}`)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    
                    {/* Delete Button with Inline Confirmation */}
                    <div className="relative inline-block">
                    <button 
                      className="px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl shadow-sm transition-colors duration-200 flex items-center border border-red-200"
                      onClick={(e) => {
                        e.stopPropagation();  // Prevent event bubbling
                        handleDeleteClick(job);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                    
                    {/* Inline confirmation popup */}
                    {jobToDelete && jobToDelete.jobId === job.jobId && (
                      <div 
                        ref={confirmationRef}
                        className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 animate-popup"
                      >
                        <div className="flex items-start mb-3">
                          <div className="flex-shrink-0 bg-red-100 rounded-full p-1 mr-2">
                            <svg className="h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-gray-700">
                            Are you sure you want to delete this job?
                          </p>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => setJobToDelete(null)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                            disabled={deleteLoading}
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleConfirmDelete}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 flex items-center"
                            disabled={deleteLoading}
                          >
                            {deleteLoading ? (
                              <>
                                <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                              </>
                            ) : (
                              'Confirm'
                            )}
                          </button>
                        </div>
                        
                        {/* Add a small triangle pointer at the bottom */}
                        <div className="absolute bottom-0 right-5 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-gray-200"></div>
                      </div>
                    )}

                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
  );
};

export default UserPostedJobs;