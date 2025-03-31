import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import db from '../utils/db';
import { useAuth } from './AuthContext';
import { useNetwork } from './NetworkContext';
import { useToast } from '../components/ToastManager';

// Create context
const GuestContext = createContext();

/**
 * Guest provider component
 */
export const GuestProvider = ({ children }) => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const { isOnline } = useNetwork();
  const toast = useToast();

  // Load guests from IndexedDB
  useEffect(() => {
    async function loadGuests() {
      try {
        setLoading(true);
        setError(null);
        
        // Get data from IndexedDB
        const storedGuests = await db.guests.toArray();
        
        if (storedGuests.length > 0) {
          setGuests(storedGuests);
        } else {
          // Create some sample guests for demo if no guests exist
          const sampleGuests = [
            {
              id: '1',
              name: 'John Doe',
              phone: '123-456-7890',
              email: 'john@example.com',
              status: 'checked-in',
              checkinTime: new Date().toISOString(),
              notes: 'VIP guest, needs special attention'
            },
            {
              id: '2',
              name: 'Jane Smith',
              phone: '987-654-3210',
              email: 'jane@example.com',
              status: 'pending',
              notes: 'Coming with family of 4'
            },
            {
              id: '3',
              name: 'Robert Johnson',
              phone: '555-123-4567',
              email: 'robert@example.com',
              status: 'no-show',
              notes: 'Called to apologize for not showing up'
            }
          ];
          
          // Add sample guests to database
          await db.guests.bulkAdd(sampleGuests);
          setGuests(sampleGuests);
        }
      } catch (err) {
        console.error('Error loading guests:', err);
        setError(err);
        toast.error('Failed to load guests: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadGuests();
    }
  }, [token, toast]);

  // Add a new guest
  const addGuest = useCallback(async (guest) => {
    try {
      // Generate an ID if none provided
      const guestWithId = {
        ...guest,
        id: guest.id || Date.now().toString(),
        // Set default status if not provided
        status: guest.status || 'pending'
      };
      
      // Add to IndexedDB
      await db.guests.add(guestWithId);
      
      // Update state
      setGuests(prevGuests => [...prevGuests, guestWithId]);
      
      return guestWithId;
    } catch (err) {
      console.error('Error adding guest:', err);
      throw err;
    }
  }, []);

  // Update an existing guest
  const updateGuest = useCallback(async (updatedGuest) => {
    try {
      // Update in IndexedDB
      await db.guests.update(updatedGuest.id, updatedGuest);
      
      // Update state
      setGuests(prevGuests => 
        prevGuests.map(g => g.id === updatedGuest.id ? updatedGuest : g)
      );
      
      return updatedGuest;
    } catch (err) {
      console.error('Error updating guest:', err);
      throw err;
    }
  }, []);

  // Delete a guest
  const deleteGuest = useCallback(async (guestId) => {
    try {
      // Delete from IndexedDB
      await db.guests.delete(guestId);
      
      // Update state
      setGuests(prevGuests => prevGuests.filter(g => g.id !== guestId));
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting guest:', err);
      throw err;
    }
  }, []);

  // Bulk import guests
  const bulkImportGuests = useCallback(async (guestList) => {
    try {
      // Add IDs to guests if they don't have them
      const guestsWithIds = guestList.map(guest => ({
        ...guest,
        id: guest.id || Date.now() + Math.random().toString(36).substring(2, 9),
        status: guest.status || 'pending'
      }));
      
      // Add to IndexedDB
      await db.guests.bulkAdd(guestsWithIds);
      
      // Update state - append to existing guests
      setGuests(prevGuests => [...prevGuests, ...guestsWithIds]);
      
      return { success: true, count: guestsWithIds.length };
    } catch (err) {
      console.error('Error bulk importing guests:', err);
      throw err;
    }
  }, []);

  // Search for guests
  const searchGuests = useCallback((searchTerm) => {
    if (!searchTerm) return guests;
    
    const term = searchTerm.toLowerCase();
    return guests.filter(guest => 
      guest.name.toLowerCase().includes(term) ||
      guest.phone.includes(term) ||
      (guest.email && guest.email.toLowerCase().includes(term))
    );
  }, [guests]);

  // Values to expose through context
  const value = {
    guests,
    loading,
    error,
    addGuest,
    updateGuest,
    deleteGuest,
    bulkImportGuests,
    searchGuests
  };

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
};

/**
 * Hook to use the guest context
 */
export const useGuests = () => {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error('useGuests must be used within a GuestProvider');
  }
  return context;
};

export default GuestContext;
