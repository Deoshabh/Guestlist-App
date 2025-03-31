import React, { useState, useEffect } from 'react';
import GuestItem from './GuestItem';
import { useGuests } from '../contexts/GuestContext';
import { useNetwork } from '../contexts/NetworkContext';
import { useToast } from './ToastManager';
import haptic from '../utils/haptic';

const GuestList = ({ viewMode = 'list', searchTerm = '', filterStatus = 'all' }) => {
  const { guests, loading, error } = useGuests();
  const { isOnline } = useNetwork();
  const toast = useToast();
  const [filteredGuests, setFilteredGuests] = useState([]);

  // Apply filters whenever guests, searchTerm, or filterStatus changes
  useEffect(() => {
    if (!guests) return;
    
    try {
      let filtered = [...guests];
      
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(guest => 
          guest.name.toLowerCase().includes(searchLower) || 
          guest.phone.includes(searchTerm) ||
          (guest.email && guest.email.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply status filter
      if (filterStatus !== 'all') {
        filtered = filtered.filter(guest => guest.status === filterStatus);
      }
      
      // Sort by check-in time or name
      filtered.sort((a, b) => {
        if (a.checkinTime && b.checkinTime) {
          return new Date(b.checkinTime) - new Date(a.checkinTime);
        } else if (a.checkinTime) {
          return -1;
        } else if (b.checkinTime) {
          return 1;
        } else {
          return a.name.localeCompare(b.name);
        }
      });
      
      setFilteredGuests(filtered);
    } catch (err) {
      console.error('Error filtering guests:', err);
      // Use original guests as fallback
      setFilteredGuests(guests);
    }
  }, [guests, searchTerm, filterStatus]);

  // Handle list scroll to provide haptic feedback
  const handleScroll = (e) => {
    // Optional: Add haptic feedback on scroll start/end
    try {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      
      // At the bottom
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        haptic.lightFeedback();
      }
      
      // At the top
      if (scrollTop <= 10) {
        haptic.lightFeedback();
      }
    } catch (err) {
      // Ignore haptic errors
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400 mb-2">Failed to load guest list</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{error.message || 'Unknown error'}</p>
        {!isOnline && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            You appear to be offline. Please check your connection.
          </p>
        )}
      </div>
    );
  }

  if (!filteredGuests || filteredGuests.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {searchTerm || filterStatus !== 'all' ? (
          <p className="text-gray-600 dark:text-gray-400">No guests match your filters</p>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No guests added yet</p>
        )}
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20" onScroll={handleScroll}>
        {filteredGuests.map(guest => (
          <GuestItem 
            key={guest.id} 
            guest={guest} 
            viewMode={viewMode}
          />
        ))}
      </div>
    );
  }

  // Default list view
  return (
    <div className="space-y-3 pb-20 overflow-auto" onScroll={handleScroll}>
      {filteredGuests.map(guest => (
        <GuestItem 
          key={guest.id} 
          guest={guest} 
          viewMode={viewMode}
        />
      ))}
    </div>
  );
};

export default GuestList;