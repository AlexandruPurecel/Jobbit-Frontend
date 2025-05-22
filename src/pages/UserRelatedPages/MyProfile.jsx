import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { getUser } from "../../api/UsersApi";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user ID from JWT token
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError("Please log in to view your profile");
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentUserId = decoded.userId;
      
      if (currentUserId) {
        
        getUser(currentUserId)
          .then((response) => {
            setUser(response.data);
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error fetching user:", error);
            setError("Failed to load your profile. Please try again.");
            setLoading(false);
          });
      } else {
        setError("User ID not found in authentication token");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      setError("Invalid authentication token. Please log in again.");
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
          <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
          <button 
            onClick={() => navigate('/login')} 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 mr-2"
          >
            Log In
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
          {/* Profile Banner */}
          <div className="h-36 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
            <div className="absolute w-96 h-96 bg-white/10 rounded-full -top-20 -right-20"></div>
            <div className="absolute w-64 h-64 bg-indigo-500/20 rounded-full top-20 left-20 backdrop-blur-3xl"></div>
            <div className="absolute w-32 h-32 bg-blue-400/20 rounded-full bottom-0 right-1/4 backdrop-blur-3xl"></div>
          </div>

          {/* Profile Picture Container */}
          <div className="flex justify-center">
            <div className="relative -mt-20 mb-2">
              <img
                src={
                  user.profilePictureId
                    ? `http://localhost:8080/api/images/${user.profilePictureId}`
                    : "/images/defaultImage.jpg"
                }
                alt="My Profile"
                className="rounded-full w-40 h-40 object-cover border-4 border-white shadow-lg bg-white"
              />
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-1">
                {user.firstName} {user.lastName}
              </h2>
              <p className="inline-flex items-center text-gray-600 bg-blue-50 px-4 py-1.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {user.email}
              </p>
              
              {/* Show role badge if user is admin */}
              {user.roleName === 'ADMIN' && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Administrator
                  </span>
                </div>
              )}
              
              <div className="mt-4 space-x-3">
                <button 
                  onClick={() => navigate('/edit-profile')} 
                  className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-medium text-sm shadow-sm hover:shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
                
                {user.roleName === 'ADMIN' && (
                  <button 
                    onClick={() => navigate('/admin')} 
                    className="inline-flex items-center px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-300 font-medium text-sm shadow-sm hover:shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin Panel
                  </button>
                )}
              </div>
            </div>
            
            {/* Rest of your existing profile content... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* About Section */}
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-sm border border-blue-100 overflow-hidden relative">
                <div className="absolute w-32 h-32 bg-blue-100 rounded-full -top-16 -right-16 opacity-50"></div>
                
                <h3 className="text-lg font-bold text-gray-800 flex items-center mb-5 relative">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  About Me
                </h3>
                
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative">
                  {user.bio ? (
                    <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-6">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">No bio provided</p>
                      <button 
                        onClick={() => navigate('/edit-profile')}
                        className="text-blue-600 text-sm mt-2 hover:underline"
                      >
                        Add a bio about yourself
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Personal Information */}
              <div className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl p-6 shadow-sm border border-indigo-100 overflow-hidden relative">
                <div className="absolute w-32 h-32 bg-indigo-100 rounded-full -top-16 -right-16 opacity-50"></div>
                
                <h3 className="text-lg font-bold text-gray-800 flex items-center mb-5 relative">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Personal Information
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 flex items-center gap-4 border border-gray-100 shadow-sm">
                    <div className="bg-indigo-100 p-3 rounded-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-indigo-500 uppercase tracking-wider">First Name</div>
                      <div className="mt-1 font-medium text-gray-800">{user.firstName}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 flex items-center gap-4 border border-gray-100 shadow-sm">
                    <div className="bg-indigo-100 p-3 rounded-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-indigo-500 uppercase tracking-wider">Last Name</div>
                      <div className="mt-1 font-medium text-gray-800">{user.lastName}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 flex items-center gap-4 border border-gray-100 shadow-sm">
                    <div className="bg-indigo-100 p-3 rounded-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-indigo-500 uppercase tracking-wider">Email</div>
                      <div className="mt-1 font-medium text-gray-800">{user.email}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}