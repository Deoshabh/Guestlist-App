import React, { createContext, useContext, useState, useCallback } from 'react';

// Create context
const GuestContext = createContext();

/**
 * Guest provider component
 */
export const GuestProvider = ({ children }) => {
  const [guests, setGuests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Stub fetch guests function
  const fetchGuests = useCallback(async () => {
    console.warn('[STUB] fetchGuests called');
    // Return mock data
    const mockGuests = [
      { _id: 'guest1', name: 'John Doe', phone: '1234567890', invited: true, groupId: 'group1' },
      { _id: 'guest2', name: 'Jane Smith', phone: '0987654321', invited: false, groupId: 'group2' }
    ];
    setGuests(mockGuests);
    return mockGuests;
  }, []);

  // Stub fetch groups function
  const fetchGroups = useCallback(async () => {
    console.warn('[STUB] fetchGroups called');
    // Return mock data
    const mockGroups = [
      { _id: 'group1', name: 'Family' },
      { _id: 'group2', name: 'Friends' }
    ];
    setGroups(mockGroups);
    return mockGroups;
  }, []);

  // Filter guests
  const filteredGuests = useCallback(() => {
    let result = [...guests];
    
    // Apply group filter
    if (selectedGroupId) {
      result = result.filter(guest => guest.groupId === selectedGroupId);
    }
    
    // Apply status filter
    if (filter === 'invited') {
      result = result.filter(guest => guest.invited);
    } else if (filter === 'pending') {
      result = result.filter(guest => !guest.invited);
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(guest => 
        guest.name?.toLowerCase().includes(term) || 
        guest.phone?.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [guests, selectedGroupId, filter, searchTerm]);

  // Context value
  const contextValue = {
    guests,
    setGuests,
    groups,
    setGroups,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    selectedGroupId, 
    setSelectedGroupId,
    fetchGuests,
    fetchGroups,
    filteredGuests: filteredGuests()
  };

  return (
    <GuestContext.Provider value={contextValue}>
      {children}
    </GuestContext.Provider>
  );
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
