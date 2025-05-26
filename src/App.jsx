import './App.css'
import LoginPage from './pages/LoginPage'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import HomePage from './pages/HomePage'
import JobPage from './pages/JobsRelatedPages/JobPage'
import JobsDisplayPage from './pages/JobsRelatedPages/JobsDisplayPage'
import MyProfile from './pages/UserRelatedPages/MyProfile'
import Navbar from './components/Navbar'
import RegisterPage from './pages/RegisterPage'
import AddJobPage from './pages/JobsRelatedPages/JobAddPage'
import EditProfilePage from './pages/UserRelatedPages/EditProfilePage'
import UserPostedJobs from './pages/UserRelatedPages/UserPostedJobs'
import ProtectedRoute from './security/ProtectedRoute'
import EditJobPage from './pages/JobsRelatedPages/EditJob'
import MessagesPage from './pages/MessagePage'
import UserPage from './pages/UserRelatedPages/UserPage'
import AdminProtectedRoute from './security/AdminProtectedRoute'
import AdminPage from './pages/AdminPage'



function App() {

  return (
   <BrowserRouter>
      <Navbar />
      <Routes>
        
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/job/:id" element={<JobPage />} />
        <Route path="/jobs" element={<JobsDisplayPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/user/:id" element={<UserPage/>} />
        
        <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
        <Route path="/add-job" element={<ProtectedRoute><AddJobPage /></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
        <Route path="/my-jobs" element={<ProtectedRoute><UserPostedJobs /></ProtectedRoute>} />
        <Route path="/edit-job/:id" element={<ProtectedRoute><EditJobPage /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/messages/:conversationId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminProtectedRoute><AdminPage /></AdminProtectedRoute>} />

      </Routes>
    </BrowserRouter>
  );
};

export default App
