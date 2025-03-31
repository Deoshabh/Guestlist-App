import React, { useEffect, useState } from 'react';
import GuestService from '../services/GuestService';

const GroupList = ({ onSelectGroup, onAddGroup }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const data = await GuestService.getGuestGroups();
        setGroups(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching guest groups:', err);
        
        if (!navigator.onLine) {
          setError('You are currently offline. Some features may be limited.');
        } else if (err.response && err.response.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError('Unable to load groups. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  return (
    <div className="group-list">
      {isOffline && (
        <div className="offline-banner">
          You are offline. Some features may be limited.
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            disabled={!navigator.onLine}
          >
            Retry
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="loading">Loading groups...</div>
      ) : (
        // Render groups here
      )}
    </div>
  );
};

export default GroupList;