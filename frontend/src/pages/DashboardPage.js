import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getUserProfile } from '../services/userService';

const DashboardPage = () => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoading(true);
        const response = await getUserProfile();
        setProfileData(response.user);
        setError(null);
      } catch (err) {
        setError('Failed to load profile data');
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated]);

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (loading || isLoading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome to Your Dashboard</h1>
        <p>Manage your account and business from here</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-grid">
        <div className="dashboard-card profile-card">
          <h2>Profile Information</h2>
          {profileData && (
            <div className="profile-details">
              <p><strong>Name:</strong> {profileData.name}</p>
              <p><strong>Email:</strong> {profileData.email}</p>
              <p><strong>Account Type:</strong> {profileData.role}</p>
              <p><strong>Member Since:</strong> {new Date(profileData.createdAt).toLocaleDateString()}</p>
            </div>
          )}
          <button className="edit-profile-btn">Edit Profile</button>
        </div>

        <div className="dashboard-card stats-card">
          <h2>Your Activity</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Connections</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Messages</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Resources</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Events</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card recent-activity">
        <h2>Recent Activity</h2>
        <p className="no-activity">No recent activity to display.</p>
      </div>
    </div>
  );
};

export default DashboardPage;
