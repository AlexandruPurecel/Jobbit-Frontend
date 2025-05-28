import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Shield, AlertCircle } from 'lucide-react';

const AdminProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
   
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
   
    try {
      const decoded = jwtDecode(token);
     
      const currentTime = Date.now() / 1000;
      if (decoded.exp && decoded.exp < currentTime) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
    
        const userRole = decoded.role || decoded.authorities || decoded.scope;
        
        if (Array.isArray(userRole)) {
          setIsAdmin(userRole.includes('ADMIN') || userRole.includes('ROLE_ADMIN'));
        } else if (typeof userRole === 'string') {
          setIsAdmin(userRole === 'ADMIN' || userRole === 'ROLE_ADMIN' || userRole.includes('ADMIN'));
        } else {
          setIsAdmin(decoded.isAdmin === true || decoded.admin === true);
        }
      }
    } catch (error) {
      console.error('Invalid token:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    }
   
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex justify-center items-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-md">
          <Shield className="animate-pulse h-14 w-14 text-blue-600 mx-auto mb-4" />
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Verify if user is admin</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex justify-center items-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-md max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Forbidden</h2>
          <p className="text-gray-600 mb-6">
            Only admins can access this page
          </p>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminProtectedRoute;