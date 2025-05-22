import { useState } from "react";
import { useEffect } from "react";
import { getAllJobs } from "../../api/JobApi";
import { getAllCategories } from "../../api/CategoryApi";
import { getAllLocations } from "../../api/LocationApi";
import { getJobWithImages } from "../../api/JobApi";
import JobCard from "../../components/JobCard";

const JobsDisplayPage = () => {
  const [jobs, setJobs] = useState([]);
  const [jobImagesList, setJobImagesList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const uniqueCities = Array.from(new Set(locations.map(loc => loc.city)))
    .map(city => locations.find(loc => loc.city === city));

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      {/* Search & Filter Section */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8 border border-blue-100">
        <div className="p-6">
          <h5 className="font-semibold mb-5 text-gray-800 flex items-center text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find Your Perfect Job
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            <div className="md:col-span-6">
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1.5">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="searchTerm"
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <div className="md:col-span-4">
              <label htmlFor="locationFilter" className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <select
                  id="locationFilter"
                  value={selectedCity || ''}
                  onChange={(e) => setSelectedCity(e.target.value === '' ? null : e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-colors"
                >
                  <option value="">All Cities</option>
                  {uniqueCities.map(location => (
                    <option key={location.city} value={location.city}>
                      {location.city}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <button
                onClick={clearFilters}
                className="w-full py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8 border border-blue-100">
        <div className="p-6">
          <h5 className="font-semibold mb-4 text-gray-800 flex items-center text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Browse Categories
          </h5>
          <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat.categoryId}
                className={`px-5 py-2 rounded-full font-medium transition-all duration-200 ${
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
      <div className="flex justify-between items-center mb-6 px-2">
        <div>
          <h4 className="font-bold text-blue-700 text-xl flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {filteredJobs.length} {filteredJobs.length === 1 ? 'Opportunity' : 'Opportunities'}
          </h4>
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="text-center py-20 my-8 bg-white rounded-2xl shadow-md">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-5 text-gray-600 text-xl font-medium">Loading opportunities...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center my-8 border border-gray-100">
          <div className="bg-gray-50 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-gray-700">No matching opportunities found</h4>
          <p className="text-gray-500 mb-8 mt-2">Try adjusting your search criteria</p>
          <button 
            onClick={clearFilters}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-300 flex items-center mx-auto shadow-md hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.jobId} className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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

export default JobsDisplayPage;