import { getJobById } from "../../api/JobApi";
import { useParams} from "react-router-dom";
import { useEffect, useState } from "react";
import { getJobWithImages } from "../../api/JobApi";
import { jwtDecode } from "jwt-decode";
import MessageButton from "../../components/chat/MessageButton";
import { useNavigate } from "react-router-dom";

const JobPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const[userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const jobResponse = await getJobById(id);
        setJob(jobResponse.data);
        
        const imagesResponse = await getJobWithImages(id);
        if (imagesResponse.data.jobImages?.length > 0) {
          const urls = imagesResponse.data.jobImages.map(img => `http://localhost:8080/api/images/${img.id}`);
          setImageUrls(urls);
        }
      } catch (error) {
        console.error("Error fetching job data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobData();
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.userId);
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    if (imageUrls.length <= 1) return;
    
    const interval = setInterval(() => {
      nextImage();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [imageUrls.length, currentImageIndex]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-yellow-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-yellow-700">Job not found or unable to load job details.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50" >
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">        
        <div className="flex flex-col lg:flex-row gap-8">
          {/*Images and Description */}
          <div className="lg:w-2/3">
            {/* Image Carousel */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8 border border-gray-100">
              <div className="relative">
                {imageUrls.length > 0 ? (
                  <>
                    <div className="h-[450px] relative">
                      {imageUrls.map((url, idx) => (
                        <div 
                          key={idx} 
                          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                        >
                          <img
                            src={url}
                            alt={`Job image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    {imageUrls.length > 1 && (
                      <>
                        {/* Navigation buttons */}
                        <button 
                          onClick={prevImage} 
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/50 transition-all duration-200 focus:outline-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button 
                          onClick={nextImage} 
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/50 transition-all duration-200 focus:outline-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        {/* Indicators */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {imageUrls.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                                idx === currentImageIndex 
                                ? 'bg-white w-6' 
                                : 'bg-white/50 hover:bg-white/80'
                              }`}
                              aria-label={`Go to slide ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="h-[350px] flex items-center justify-center bg-gray-100">
                    <div className="text-center px-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500">No images available for this job</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Description
              </h2>
              <div className="prose max-w-none text-gray-600 leading-relaxed">
                {job.description ? (
                  job.description
                ) : (
                  <p className="text-gray-500 italic">No detailed description provided for this job.</p>
                )}
              </div>
              
              {/* Price */}
              {job.price && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">Budget:</span>
                    <span className="text-2xl font-bold text-blue-600">{job.price} RON</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/*Job Details */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-sm p-8 lg:sticky lg:top-5 border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">{job.title}</h1>
              <div className="border-t border-gray-200 my-6"></div>

              {/* Posted by */}
              <div className="mb-6">
                <span className="text-sm text-gray-500 block mb-2">Posted by</span>
                <div 
                  onClick={() => navigate(`/user/${job.postedById}`)}
                  className="flex items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors duration-200"
                >
                  <div className="bg-blue-100 text-blue-600 rounded-full overflow-hidden w-10 h-10 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 block hover:text-blue-600">{job.postedByName}</span>
                  </div>
                </div>
              </div>

              {/* Category */}
              {job.categoryName && (
                <div className="mb-6">
                  <span className="text-sm text-gray-500 block mb-2">Category</span>
                  <span className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {job.categoryName}
                  </span>
                </div>
              )}

              {/* Location */}
              {job.locationDto && (
                <div className="mb-6">
                  <span className="text-sm text-gray-500 block mb-2">Location</span>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-gray-800 font-medium block">{job.locationDto.city}</span>
                      {job.locationDto.streetName && (
                        <div className="text-gray-600 text-sm mt-1">
                          {job.locationDto.streetName} {job.locationDto.streetNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {job.createdAt && (
                <div className="mb-8">
                  <span className="text-sm text-gray-500 block mb-2">Posted on</span>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-800">{formatDate(job.createdAt)}</span>
                  </div>
                </div>
              )}

              {/* Contact Button */}
              {userId && userId !== job.postedById ? (
                <MessageButton 
                  jobPostedBy={job.postedById} 
                  buttonText="Contact Poster" 
                  className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                />
              ) : userId === job.postedById ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                  <button 
                    onClick={() => navigate(`/edit-job/${job.jobId}`)}
                    className="mt-4 w-full py-2.5 bg-gray-100 text-gray-700 border border-gray-300 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Job
                  </button>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-blue-700 mb-2">Sign in to contact the job poster</p>
                  <button 
                    onClick={() => navigate("/login")}
                    className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPage;