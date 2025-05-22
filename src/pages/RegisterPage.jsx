import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import { createUser } from "../api/UsersApi";


const RegisterPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const userRegisterDto = {
        firstName,
        lastName,
        email,
        password
      };
      
      console.log('Sending registration request with data:', userRegisterDto);
      
      const response = await createUser(userRegisterDto);
      
      console.log('Registration response:', response);
      
      if (response.status >= 200 && response.status < 300) {
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error details:', err);
      console.error('Error response:', err.response);
      
      if (err.response) {
        console.log('Error status:', err.response.status);
        console.log('Error data:', err.response.data);
        
        if (err.response.data && typeof err.response.data === 'object' && err.response.data.message && err.response.data.message.includes('Email already in use')) {
          setError('This email is already registered. Please use a different email.');
        } else if (err.response.data && typeof err.response.data === 'string' && err.response.data.includes('Email already in use')) {
          setError('This email is already registered. Please use a different email.');
        } else if (err.response.data && err.response.data.error && err.response.data.error.includes('Email already in use')) {
          setError('This email is already registered. Please use a different email.');
        } else if (err.message && err.message.includes('Email already in use')) {
          setError('This email is already registered. Please use a different email.');
        } else {
          const errorMessage = 
            (err.response.data && typeof err.response.data === 'object' && err.response.data.message) ? 
              err.response.data.message : 
              (typeof err.response.data === 'string' ? 
                err.response.data : 
                'Registration failed. Please try again.');
          
          setError(errorMessage);
        }
      } else {
        setError('This email is already registered. Please use a different email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-400 to-purple-500">
      <div className="w-full max-w-md px-6 py-8 bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Create an Account</h2>
          <p className="mt-2 text-sm text-gray-600">Sign up to start finding jobs</p>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <p className="text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        )}
        
        <form onSubmit={handleRegister} className="mt-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="First Name"
              name="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              iconType="user"
            />
            
            <InputField
              label="Last Name"
              name="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              iconType="user"
            />
          </div>
          
          <InputField
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            iconType="email"
          />
          
          <InputField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            iconType="lock"
          />
          
          <InputField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            iconType="lock"
          />
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>  
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/login" className="font-medium text-blue-600 hover:text-blue-800 transition-colors">
                Log in
              </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;