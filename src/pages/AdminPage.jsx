
import React, { useState, useEffect } from 'react';
import { Users, Briefcase, Shield, Trash2, UserCheck, UserX, BarChart3, AlertCircle } from 'lucide-react';
import { getAdminStats, getAllUsers, 
  getAllJobs, 
  promoteUser, 
  demoteUser, 
  deleteUser, 
  deleteJob  } from '../api/AdminApi';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalJobs: 0, usersByRole: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsResponse, usersResponse, jobsResponse] = await Promise.all([
        getAdminStats(),
        getAllUsers(),
        getAllJobs()
      ]);
      setStats(statsResponse.data);
      setUsers(usersResponse.data);
      setJobs(jobsResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load admin data. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteUser = async (userId) => {
    try {
      setError(null);
      await promoteUser(userId);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error promoting user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to promote user. Please try again.';
      setError(errorMessage);
    }
  };

  const handleDemoteUser = async (userId) => {
    try {
      setError(null);
      await demoteUser(userId);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error demoting user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to demote user. Please try again.';
      setError(errorMessage);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      await deleteUser(userId);
      await loadData(); 
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete user. Please try again.';
      setError(errorMessage);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      await deleteJob(jobId);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error deleting job:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete job. Please try again.';
      setError(errorMessage);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
    </div>
  );

  const ErrorAlert = ({ message, onDismiss }) => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <div className="ml-3">
          <p className="text-sm text-red-700">{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600"
          >
            <span className="sr-only">Dismiss</span>
            ×
          </button>
        </div>
      </div>
    </div>
  );

  const UserRow = ({ user }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
        <div className="text-sm text-gray-500">{user.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          user.roleName === 'ADMIN' 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {user.roleName}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex space-x-2 justify-end">
          {user.roleName === 'USER' ? (
            <button
              onClick={() => handlePromoteUser(user.userId)}
              className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
              title="Promote to Admin"
            >
              <UserCheck className="h-4 w-4" />
              <span>Promote</span>
            </button>
          ) : (
            <button
              onClick={() => handleDemoteUser(user.userId)}
              className="text-orange-600 hover:text-orange-900 flex items-center space-x-1"
              title="Demote to User"
            >
              <UserX className="h-4 w-4" />
              <span>Demote</span>
            </button>
          )}
          <button
            onClick={() => handleDeleteUser(user.userId)}
            className="text-red-600 hover:text-red-900 flex items-center space-x-1"
            title="Delete User"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </td>
    </tr>
  );

  const JobRow = ({ job }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{job.title}</div>
        <div className="text-sm text-gray-500 truncate max-w-xs">{job.description}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${job.price}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {job.postedByName}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {job.categoryName}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => handleDeleteJob(job.jobId)}
          className="text-red-600 hover:text-red-900 flex items-center space-x-1"
          title="Delete Job"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete</span>
        </button>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <button
              onClick={loadData}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'jobs', label: 'Jobs', icon: Briefcase }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <ErrorAlert 
            message={error} 
            onDismiss={() => setError(null)} 
          />
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={Users}
                color="#3B82F6"
              />
              <StatCard
                title="Total Jobs"
                value={stats.totalJobs}
                icon={Briefcase}
                color="#10B981"
              />
              <StatCard
                title="Admin Users"
                value={stats.usersByRole?.ADMIN || 0}
                icon={Shield}
                color="#8B5CF6"
              />
            </div>

            {/* Role Distribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Role Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Regular Users</span>
                  <span className="text-sm text-gray-900">{stats.usersByRole?.USER || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: stats.totalUsers > 0 
                        ? `${((stats.usersByRole?.USER || 0) / stats.totalUsers) * 100}%` 
                        : '0%' 
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Administrators</span>
                  <span className="text-sm text-gray-900">{stats.usersByRole?.ADMIN || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: stats.totalUsers > 0 
                        ? `${((stats.usersByRole?.ADMIN || 0) / stats.totalUsers) * 100}%` 
                        : '0%' 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Manage Users</p>
                      <p className="text-sm text-gray-500">View and modify user roles</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center">
                    <Briefcase className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Manage Jobs</p>
                      <p className="text-sm text-gray-500">Monitor and delete job postings</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage user roles and permissions. Click promote/demote to change user roles.
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Total: {users.length} users
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length > 0 ? (
                    users.map(user => (
                      <UserRow key={user.userId} user={user} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Job Management</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    View and manage all jobs posted on the platform.
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Total: {jobs.length} jobs
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posted By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.length > 0 ? (
                    jobs.map(job => (
                      <JobRow key={job.jobId} job={job} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No jobs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;