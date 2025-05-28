import { useNavigate } from "react-router-dom";

const JobCard = ({ job, imageUrl }) => {
  const locationLabel = job.locationDto
    ? job.locationDto.city
    : 'Fără locație';
 
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
  
  const navigate = useNavigate();
 
  return (
    <div className="group flex flex-col h-full overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 bg-white border border-gray-100">
      {/* Job Image with Improved Overlay */}
      <div className="relative h-52 w-full overflow-hidden">
        <img
          src={imageUrl || 'https://via.placeholder.com/400x300?text=Job+Image'}
          alt={`${job.title} imagine`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 shadow-sm">
            {locationLabel}
          </span>
          
          {job.categoryName && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 shadow-sm">
              {job.categoryName}
            </span>
          )}
        </div>
      </div>
     
      {/* Job Content */}
      <div className="flex flex-col flex-grow p-6 space-y-4">
        {/* Header*/}
        <div className="flex justify-between items-start gap-3">
          <h3 className="text-lg font-bold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {job.title}
          </h3>
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-lg whitespace-nowrap border border-blue-100">
            {job.price} RON
          </span>
        </div>
       
        {/* Description */}
        <p className="text-gray-600 line-clamp-3 text-sm flex-grow">
          {job.description}
        </p>
       
        {/* Details & Date */}
        <div className="pt-4 mt-auto border-t border-gray-100">
          {job.createdAt && (
            <div className="text-xs text-gray-500 mb-4 flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-gray-700">Posted by:</span> 
              {job.postedByName && (
                <span className="ml-1.5">{job.postedByName} on {formatDate(job.createdAt)}</span>
              )}
            </div>
          )}
         
          <button
            onClick={() => navigate(`/job/${job.jobId}`)}
            className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 shadow-sm hover:shadow-md"
          >
            <span>View Details</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;