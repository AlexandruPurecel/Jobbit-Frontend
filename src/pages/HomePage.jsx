import React from 'react'
import { useState, useEffect} from 'react';
import { getAllCategories } from '../api/CategoryApi';
import { getAllLocations } from '../api/LocationApi';
import { getAllJobs, getJobWithImages } from '../api/JobApi';
import JobCard from '../components/JobCard';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [jobs, setJobs] = useState([]);
  const [jobImagesList, setJobImagesList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getAllJobs(),
      getAllCategories(),
      getAllLocations()
    ])
      .then(([jobsRes, categoriesRes, locationsRes]) => {
        setJobs(jobsRes.data);
        setCategories(categoriesRes.data);
        setLocations(locationsRes.data);
        setLoading(false);
      })
      .catch(error => {
        console.log('Error loading initial data:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (jobs.length > 0) {
      listJobImages(jobs);
    }
  }, [jobs]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategoryId === null || job.categoryId === selectedCategoryId;
    const matchesLocation = selectedCity === null || job.locationDto?.city === selectedCity;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  function handleCategoryFilter(categoryId) {
    if (categoryId === selectedCategoryId) {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(categoryId);
    }
  }

  function clearFilters() {
    setSelectedCategoryId(null);
    setSelectedCity(null);
    setSearchTerm('');
  }

  function listJobImages(jobs) {
    Promise.all(jobs.map(job =>
      getJobWithImages(job.jobId)
        .then(response => response.data)
        .catch(() => null)
    ))
      .then(images => {
        const validImages = images.filter(img => img !== null);
        setJobImagesList(validImages);
      })
      .catch(error => {
        console.log(error);
      });
  }

  function getImageUrlByJobId(jobId) {
    const jobWithImages = jobImagesList.find(j => j.jobId === jobId);
    if (jobWithImages && jobWithImages.jobImages && jobWithImages.jobImages.length > 0) {
      return `http://localhost:8080/api/images/${jobWithImages.jobImages[0].id}`;
    }
    return '/images/defaultImage.jpg';
  }

  const navigateToJobs = () => {
    navigate('/jobs');
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-10 px-4 sm:px-6 lg:px-8">
    {/* Hero Section */}
    <div className="mb-14 relative overflow-hidden rounded-3xl shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 z-10"></div>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3')] bg-cover bg-center opacity-30"></div>
      
      <div className="relative z-20 py-16 px-6 md:py-20 md:px-12 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm mb-4">
            Find opportunities near you
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Make today count. Earn more, your way
          </h1>
          <p className="text-xl text-white/90 tracking-wide max-w-2xl mx-auto">
            Discover how easy it is to earn extra money with local flexible jobs.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-white text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center" onClick={() => navigate('/jobs')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Find Jobs
            </button>
            <button className="px-6 py-3 bg-transparent text-white font-medium rounded-xl border-2 border-white/30 hover:bg-white/10 transition-all duration-300 flex items-center justify-center backdrop-blur-sm"  onClick={() => navigate('/add-job')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Post a Job
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Main Content */}
    <div className="max-w-7xl mx-auto">
      {/* Categories Section */}
      <div className="bg-white rounded-2xl shadow-sm p-7 mb-10 border border-blue-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 z-0"></div>
        
        <div className="relative z-10">
          <h5 className="font-semibold mb-5 text-gray-800 flex items-center text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Browse Categories
          </h5>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat.categoryId}
                className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
                  selectedCategoryId === cat.categoryId 
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                }`}
                onClick={() => handleCategoryFilter(cat.categoryId)}
              >
                {cat.categoryName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 px-2 gap-4">
        <div>
          <h4 className="font-bold text-blue-700 text-xl flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {filteredJobs.length} {filteredJobs.length === 1 ? 'Opportunity' : 'Opportunities'}
          </h4>
          <p className="text-gray-500 text-sm mt-1">
            Showing {Math.min(filteredJobs.length, 3)} of {filteredJobs.length} available positions
          </p>
        </div>
        <button 
          onClick={navigateToJobs}
          className="group px-5 py-2.5 rounded-xl text-blue-600 font-medium flex items-center hover:bg-blue-50 transition-all duration-300 border border-blue-200 hover:border-blue-300 shadow-sm"
        >
          View All Jobs
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="text-center py-20 my-8 bg-white rounded-2xl shadow-sm border border-blue-100">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600 text-lg font-medium">Loading opportunities...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center my-8 border border-gray-100">
          <div className="bg-gray-50 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-gray-800 mb-3">No matching opportunities found</h4>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Try adjusting your search criteria or explore different categories to find available jobs</p>
          <button 
            onClick={clearFilters}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-300 flex items-center mx-auto shadow-md hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.slice(0, 3).map((job) => (
            <div key={job.jobId} className="group transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <JobCard 
                job={job} 
                imageUrl={getImageUrlByJobId(job.jobId)} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
};

export default HomePage;