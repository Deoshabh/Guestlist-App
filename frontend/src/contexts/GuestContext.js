import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';
import db from '../utils/db';
import { useToast } from '../components/ToastManager';
import { useNetwork } from './NetworkContext';
import { useAuth } from './AuthContext';
import haptic from '../utils/haptic';

const GuestContext = createContext();

export function useGuests() {
  return useContext(GuestContext);
}

// Calculate stats from guest data
const calculateStats = (guests) => {
  try {
    if (!Array.isArray(guests)) return { total: 0, invited: 0, pending: 0 };
    const total = guests.filter((g) => !g?.deleted).length;
    const invited = guests.filter((g) => g?.invited && !g?.deleted).length;
    return { total, invited, pending: total - invited };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return { total: 0, invited: 0, pending: 0 };
  }
};

export function GuestProvider({ children }) {
  const { isOnline, API_BASE_URL, setError } = useNetwork();
  const { token } = useAuth();
  const toast = useToast();
  
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({ total: 0, invited: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [guestGroups, setGuestGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [pendingGuests, setPendingGuests] = useState([]);

  // Fetch guests with improved error handling
  const fetchGuests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    
    try {
      if (navigator.onLine) {
        console.log('📡 Fetching guests from server...');
        try {
          const res = await axios.get(`${API_BASE_URL}/guests`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000 // 15 second timeout for mobile networks
          });
          setGuests(res.data);
          
          // Save to IndexedDB for offline access
          await db.saveGuests(res.data).catch((dbErr) =>
            console.warn('Failed to save to local DB:', dbErr)
          );
          
          try {
            // Fetch stats separately for performance
            const statsRes = await axios.get(`${API_BASE_URL}/guests/stats`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000 // Shorter timeout for stats
            });
            setStats(statsRes.data);
          } catch (statsErr) {
            console.error('Error fetching stats, using calculated:', statsErr);
            setStats(calculateStats(res.data));
          }
        } catch (apiErr) {
          console.error('API Error:', apiErr);
          
          // Fall back to cached data if available
          const cachedGuests = await db.getGuests();
          if (cachedGuests && cachedGuests.length > 0) {
            console.log('Using cached guest data...');
            setGuests(cachedGuests);
            setStats(calculateStats(cachedGuests));
            setError('Could not update from server. Showing cached data.');
          } else {
            setError(apiErr.response?.data?.error || 'Failed to load guests. Please try again.');
          }
        }
      } else {
        // Offline mode - use cached data from IndexedDB
        console.log('🔄 Loading guests from cache...');
        const cachedGuests = await db.getGuests();
        if (cachedGuests && cachedGuests.length > 0) {
          setGuests(cachedGuests);
          setStats(calculateStats(cachedGuests));
          setError('You are offline. Showing cached guest data.');
        } else {
          setError('You are offline and no cached data is available.');
        }
      }
    } catch (err) {
      console.error('Error in fetchGuests:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL, setError]);

  const fetchGuestGroups = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/guest-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGuestGroups(response.data);
      
      // Set default selected group if none is selected
      if (!selectedGroup && response.data.length > 0) {
        setSelectedGroup(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching guest groups:', error);
      // Use offline data if available
      const offlineGroups = await db.getGroups();
      if (offlineGroups.length > 0) {
        setGuestGroups(offlineGroups);
        if (!selectedGroup && offlineGroups.length > 0) {
          setSelectedGroup(offlineGroups[0]);
        }
      }
    }
  }, [token, API_BASE_URL, selectedGroup]);

  // Load guests and groups when token changes
  useEffect(() => {
    if (token) {
      fetchGuests();
      fetchGuestGroups();
    }
  }, [token, fetchGuests, fetchGuestGroups]);

  // Handle imported contacts from phonebook
  const handleContactsImported = (contacts) => {
    if (!contacts || contacts.length === 0) {
      return;
    }
    
    // Add the current selected group to imported contacts
    const contactsWithGroup = contacts.map(contact => ({
      ...contact,
      groupId: selectedGroup ? selectedGroup._id : ''
    }));
    
    // Add contacts to pending list
    setPendingGuests(contactsWithGroup);
    
    // Show toast notification
    toast.success(`${contacts.length} contacts imported!`);
    haptic.successFeedback();
  };
  
  // Handle updating a pending guest
  const handleUpdatePendingGuest = (index, updatedGuest) => {
    const newPendingGuests = [...pendingGuests];
    newPendingGuests[index] = updatedGuest;
    setPendingGuests(newPendingGuests);
  };
  
  // Handle removing a pending guest
  const handleRemovePendingGuest = (index) => {
    const newPendingGuests = [...pendingGuests];
    newPendingGuests.splice(index, 1);
    setPendingGuests(newPendingGuests);
    haptic.lightFeedback();
  };
  
  // Add a new guest to the pending list
  const handleAddToPendingList = (guest) => {
    // Create a proper temporary guest object
    const newGuest = {
      ...guest,
      id: guest.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      // Set default values if not provided
      name: guest.name || '',
      contact: guest.contact || '',
      email: guest.email || '',
      phone: guest.phone || '',
      invited: guest.invited || false,
      groupId: guest.groupId || (selectedGroup ? selectedGroup._id : '')
    };
    
    setPendingGuests([...pendingGuests, newGuest]);
    haptic.lightFeedback();
    toast.success('Guest added to pending list');
  };
  
  // Save all pending guests
  const handleSaveAllPendingGuests = async () => {
    if (pendingGuests.length === 0) return;
    
    setLoading(true);
    
    try {
      if (isOnline) {
        // Online mode: Save all guests to server
        const promises = pendingGuests.map(guest => 
          axios.post(`${API_BASE_URL}/guests`, {
            name: guest.name,
            contact: guest.contact,
            email: guest.email,
            phone: guest.phone,
            invited: guest.invited,
            groupId: guest.groupId
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
        
        const responses = await Promise.all(promises);
        const savedGuests = responses.map(res => res.data);
        
        // Save to IndexedDB for offline access
        try {
          await Promise.all(savedGuests.map(guest => db.saveGuest(guest)));
        } catch (dbErr) {
          console.warn('Failed to save some guests to local DB:', dbErr);
        }
      } else {
        // Offline mode: Save to IndexedDB and queue for later sync
        await Promise.all(pendingGuests.map(async guest => {
          const tempGuest = {
            ...guest,
            _id: guest.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            _pendingSync: true,
            deleted: false,
            createdAt: new Date().toISOString()
          };
          
          // Save to local DB
          await db.saveGuest(tempGuest);
          
          // Queue for later sync (without the temp ID)
          const { id, _id, _pendingSync, ...syncData } = guest;
          await db.queueAction('ADD_GUEST', syncData);
        }));
      }
      
      // Clear pending guests after saving
      setPendingGuests([]);
      
      // Refresh guest list
      fetchGuests();
      
      // Provide feedback
      haptic.successFeedback();
      toast.success(`${pendingGuests.length} guests added successfully!`);
    } catch (err) {
      console.error('Error saving guests:', err);
      haptic.errorFeedback();
      toast.error(
        isOnline 
          ? 'Failed to save some guests. Please try again.' 
          : 'Failed to save guests offline. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel all pending guests
  const handleCancelAllPendingGuests = () => {
    setPendingGuests([]);
    haptic.lightFeedback();
  };

  const value = {
    guests,
    stats,
    loading,
    guestGroups,
    selectedGroup,
    setSelectedGroup,
    pendingGuests,
    fetchGuests,
    fetchGuestGroups,
    handleContactsImported,
    handleUpdatePendingGuest,
    handleRemovePendingGuest,
    handleAddToPendingList,
    handleSaveAllPendingGuests,
    handleCancelAllPendingGuests
  };

  return (
    <GuestContext.Provider value={value}>
      {children}
    </GuestContext.Provider>
  );
}
