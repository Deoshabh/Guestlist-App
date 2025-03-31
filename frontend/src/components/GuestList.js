import React, { useEffect, useState } from 'react';
import haptic from '../utils/haptic';
<<<<<<< HEAD
import GuestService from '../services/GuestService';

/**
 * Simplified GuestList Component
 * Focuses solely on displaying guests in a minimalistic way
 */
function GuestList({
  onSelectGuest,
  onAddGuest,
  showCheckboxes = false,
  selectedGuests = [],
  viewMode = 'card'
}) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
=======

function GuestList({ token, guests, onUpdate, apiBaseUrl = '/api', isOnline = true }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'invited', 'notInvited'
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentGuest, setCurrentGuest] = useState(null);
  const [error, setError] = useState('');
>>>>>>> parent of 64b458f (New UI)

  // Use the new GuestService to fetch guests
  useEffect(() => {
    const fetchGuests = async () => {
      try {
        setLoading(true);
        const data = await GuestService.getGuests();
        setGuests(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching guests:', err);
        setError('Unable to load guests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, []);

  const handleGuestClick = (guest) => {
    haptic.lightFeedback();
    if (onSelectGuest) onSelectGuest(guest);
  };

  const handleAddGuest = async (guest) => {
    try {
      setLoading(true);
      const newGuest = await GuestService.addGuest(guest);
      setGuests(prevGuests => [...prevGuests, newGuest]);
      if (onAddGuest) onAddGuest(newGuest);
      setError(null);
    } catch (err) {
      console.error('Error adding guest:', err);
      setError('Unable to add guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading guests...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (guests.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        No guests to display
      </div>
    );
<<<<<<< HEAD
  }

  return (
    <div className="space-y-3 animate-fadeIn">
      {guests.map(guest => (
        <div 
          key={guest._id}
          onClick={() => handleGuestClick(guest)}
          className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 ${
            selectedGuests.some(g => g._id === guest._id) 
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' 
              : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
          } cursor-pointer transition-colors`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {showCheckboxes && (
                <input
                  type="checkbox"
                  checked={selectedGuests.some(g => g._id === guest._id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleGuestClick(guest);
                  }}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {guest.name}
                  {guest._pendingSync && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs rounded-full">
                      Pending
                    </span>
                  )}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4 mt-1">
                  {guest.phone && <span>{guest.phone}</span>}
                  {guest.email && <span>{guest.email}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                guest.invited 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {guest.invited ? 'Invited' : 'Pending'}
              </span>
              
              {guest.phone && (
                <a 
                  href={`https://wa.me/${guest.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
=======
  };

  const updateBulkInvited = async (invited) => {
    if (selected.length === 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      if (isOnline) {
        // Online mode - send directly to server
        await axios.put(`${apiBaseUrl}/guests/bulk-update`, { ids: selected, invited }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        haptic.successFeedback();
      } else {
        // Offline mode - update locally and queue for later
        const guestsToUpdate = guests.filter(g => selected.includes(g._id));
        
        for (const guest of guestsToUpdate) {
          // Update guest in local DB
          const updatedGuest = { ...guest, invited, _pendingSync: true };
          await db.saveGuest(updatedGuest);
          
          // Queue the update for later sync
          await db.queueAction('UPDATE_GUEST', {
            id: guest._id,
            data: { invited }
          });
        }
        
        haptic.successFeedback();
      }
      
      setSelected([]);
      onUpdate();
    } catch (err) {
      console.error(err);
      haptic.errorFeedback();
      setError(isOnline 
        ? 'Error updating guests' 
        : 'Failed to update guests offline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleGuestInvited = async (id, currentStatus) => {
    setLoading(true);
    setError('');
    
    try {
      if (isOnline) {
        // Online mode - send directly to server
        await axios.put(`${apiBaseUrl}/guests/${id}`, { invited: !currentStatus }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        haptic.successFeedback();
      } else {
        // Offline mode - update locally and queue for later
        const guest = guests.find(g => g._id === id);
        if (!guest) {
          throw new Error('Guest not found');
        }
        
        // Update guest in local DB
        const updatedGuest = { ...guest, invited: !currentStatus, _pendingSync: true };
        await db.saveGuest(updatedGuest);
        
        // Queue the update for later sync
        await db.queueAction('UPDATE_GUEST', {
          id,
          data: { invited: !currentStatus }
        });
        
        haptic.successFeedback();
      }
      
      onUpdate();
    } catch (err) {
      console.error(err);
      haptic.errorFeedback();
      setError(isOnline 
        ? 'Error updating guest' 
        : 'Failed to update guest offline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteGuest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this guest?')) return;
    
    setLoading(true);
    setError('');
    
    try {
      if (isOnline) {
        // Online mode - send directly to server
        await axios.delete(`${apiBaseUrl}/guests/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        haptic.successFeedback();
      } else {
        // Offline mode - update locally and queue for later
        const guest = guests.find(g => g._id === id);
        if (!guest) {
          throw new Error('Guest not found');
        }
        
        // Update guest in local DB
        const updatedGuest = { ...guest, deleted: true, _pendingSync: true };
        await db.saveGuest(updatedGuest);
        
        // Queue the delete action for later sync
        await db.queueAction('DELETE_GUEST', { id });
        
        haptic.successFeedback();
      }
      
      onUpdate();
    } catch (err) {
      console.error(err);
      haptic.errorFeedback();
      setError(isOnline 
        ? 'Error deleting guest' 
        : 'Failed to delete guest offline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const undoDelete = async (id) => {
    setLoading(true);
    setError('');
    
    try {
      if (isOnline) {
        // Online mode - send directly to server
        await axios.put(`${apiBaseUrl}/guests/${id}/undo`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        haptic.successFeedback();
      } else {
        // Offline mode - update locally and queue for later
        const guest = guests.find(g => g._id === id);
        if (!guest) {
          throw new Error('Guest not found');
        }
        
        // Update guest in local DB
        const updatedGuest = { ...guest, deleted: false, _pendingSync: true };
        await db.saveGuest(updatedGuest);
        
        // Queue the restore action for later sync
        await db.queueAction('UPDATE_GUEST', {
          id,
          data: { deleted: false }
        });
        
        haptic.successFeedback();
      }
      
      onUpdate();
    } catch (err) {
      console.error(err);
      haptic.errorFeedback();
      setError(isOnline 
        ? 'Error restoring guest' 
        : 'Failed to restore guest offline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!isOnline) {
      setError('Export is only available when online');
      haptic.errorFeedback();
      return;
    }
    
    window.open(`${apiBaseUrl}/guests/export`, '_blank');
    haptic.mediumFeedback();
  };

  const importCSV = async (e) => {
    if (!isOnline) {
      setError('Import is only available when online');
      haptic.errorFeedback();
      e.target.value = null; // Reset file input
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${apiBaseUrl}/guests/import`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      haptic.successFeedback();
      onUpdate();
      e.target.value = null; // Reset file input
    } catch (err) {
      console.error(err);
      haptic.errorFeedback();
      setError('Error importing guests');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (guest) => {
    haptic.lightFeedback();
    setCurrentGuest(guest);
    setEditModalOpen(true);
  };

  const handleGuestUpdate = (updatedGuest) => {
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Guest List</h2>
        
        {!isOnline && (
          <div className="p-3 mb-4 text-sm text-orange-700 bg-orange-100 rounded-lg dark:bg-orange-900 dark:text-orange-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Offline Mode - Some features are limited</span>
          </div>
        )}
        
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}
        
        {/* Search and controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <input 
              type="text"
              placeholder="Search by name or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-10"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select 
              value={sortField} 
              onChange={(e) => setSortField(e.target.value)}
              className="input"
            >
              <option value="name">Sort by Name</option>
              <option value="contact">Sort by Contact</option>
              <option value="invited">Sort by Invited</option>
            </select>
            
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              className="input"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
            
            <div className="flex">
              <button 
                onClick={() => {
                  setViewMode('card');
                  haptic.lightFeedback();
                }}
                className={`px-3 py-2 rounded-l-md border border-r-0 ${
                  viewMode === 'card' 
                    ? 'bg-primary text-white' 
                    : 'bg-white dark:bg-gray-700 dark:text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                onClick={() => {
                  setViewMode('table');
                  haptic.lightFeedback();
                }}
                className={`px-3 py-2 rounded-r-md border ${
                  viewMode === 'table' 
                    ? 'bg-primary text-white' 
                    : 'bg-white dark:bg-gray-700 dark:text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            onClick={() => {
              setFilter('all');
              haptic.lightFeedback();
            }}
            className={`btn ${
              filter === 'all' 
                ? 'btn-primary' 
                : 'btn-outline'
            }`}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              All Guests ({guests.length})
            </span>
          </button>
          <button 
            onClick={() => {
              setFilter('invited');
              haptic.lightFeedback();
            }}
            className={`btn ${
              filter === 'invited' 
                ? 'btn-primary' 
                : 'btn-outline'
            }`}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Invited ({guests.filter(g => g.invited).length})
            </span>
          </button>
          <button 
            onClick={() => {
              setFilter('notInvited');
              haptic.lightFeedback();
            }}
            className={`btn ${
              filter === 'notInvited' 
                ? 'btn-primary' 
                : 'btn-outline'
            }`}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Not Invited ({guests.filter(g => !g.invited).length})
            </span>
          </button>
        </div>
        
        {/* Bulk actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              checked={isAllSelected}
              onChange={toggleAll}
              disabled={filteredAndSortedGuests.length === 0}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
            />
            <label className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              Select All
            </label>
          </div>
          
          <button 
            onClick={() => updateBulkInvited(true)} 
            disabled={selected.length === 0 || loading}
            className="btn btn-outline text-sm"
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark Selected as Invited
            </span>
          </button>
          
          <button 
            onClick={() => updateBulkInvited(false)}
            disabled={selected.length === 0 || loading}
            className="btn btn-outline text-sm"
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Mark Selected as Not Invited
            </span>
          </button>
          
          <button 
            onClick={exportCSV} 
            disabled={loading || guests.length === 0 || !isOnline}
            className={`btn btn-outline text-sm ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </span>
          </button>
          
          <label className={`btn btn-outline text-sm flex items-center ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import CSV
            </span>
            <input 
              type="file" 
              accept=".csv" 
              onChange={importCSV}
              disabled={loading || !isOnline}
              className="hidden"
            />
          </label>
        </div>
        
        {loading && (
          <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-900 dark:text-blue-200 flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        )}
        
        {/* Guest list */}
        {guests.length === 0 ? (
          <div className="text-center py-8 dark:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="mt-2">No guests found. Add your first guest using the form above.</p>
          </div>
        ) : filteredAndSortedGuests.length === 0 ? (
          <div className="text-center py-8 dark:text-white">
            <p>No guests match your search criteria.</p>
          </div>
        ) : viewMode === 'card' ? (
          // Card view
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedGuests.map(guest => (
              <div 
                key={guest._id} 
                className={`card ${selected.includes(guest._id) ? 'ring-2 ring-primary' : ''} hover:shadow-lg transition-shadow active:shadow-md touch-manipulation`}
              >
                <div className="flex justify-between mb-2">
                  <div className="flex items-start space-x-3">
                    <input 
                      type="checkbox"
                      checked={selected.includes(guest._id)}
                      onChange={() => toggleSelect(guest._id)}
                      className="w-5 h-5 mt-1 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {guest.name}
                        {guest._pendingSync && (
                          <span className="ml-2 inline-block w-2 h-2 bg-yellow-400 rounded-full" title="Pending sync"></span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{guest.contact || 'No contact info'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className={`px-2 py-1 text-xs rounded ${
                      guest.invited 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {guest.invited ? 'Invited' : 'Not Invited'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-3">
                  <button
                    onClick={() => openEditModal(guest)}
                    className="px-3 py-1.5 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleGuestInvited(guest._id, guest.invited)}
                    className={`px-3 py-1.5 text-xs rounded ${
                      guest.invited 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                    }`}
                  >
                    {guest.invited ? 'Mark Not Invited' : 'Mark Invited'}
                  </button>
                  <button
                    onClick={() => deleteGuest(guest._id)}
                    className="px-3 py-1.5 text-xs rounded bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                  >
                    Delete
                  </button>
                  {guest.deleted && (
                    <button
                      onClick={() => undoDelete(guest._id)}
                      className="px-3 py-1.5 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Table view
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    <input 
                      type="checkbox" 
                      checked={isAllSelected}
                      onChange={toggleAll}
                      disabled={filteredAndSortedGuests.length === 0}
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {filteredAndSortedGuests.map(guest => (
                  <tr key={guest._id} className={selected.includes(guest._id) ? 'bg-blue-50 dark:bg-blue-900' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox"
                        checked={selected.includes(guest._id)}
                        onChange={() => toggleSelect(guest._id)}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{guest.name}</div>
                        {guest._pendingSync && (
                          <span className="ml-2 inline-block w-2 h-2 bg-yellow-400 rounded-full" title="Pending sync"></span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{guest.contact || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        guest.invited 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {guest.invited ? 'Invited' : 'Not Invited'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(guest)}
                          className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleGuestInvited(guest._id, guest.invited)}
                          className={`px-3 py-1 text-xs rounded ${
                            guest.invited 
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {guest.invited ? 'Uninvite' : 'Invite'}
                        </button>
                        <button
                          onClick={() => deleteGuest(guest._id)}
                          className="px-3 py-1 text-xs rounded bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                        >
                          Delete
                        </button>
                        {guest.deleted && (
                          <button
                            onClick={() => undoDelete(guest._id)}
                            className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditGuestModal 
        guest={currentGuest}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onUpdate={handleGuestUpdate}
        token={token}
        apiBaseUrl={apiBaseUrl}
      />
>>>>>>> parent of 64b458f (New UI)
    </div>
  );
}

export default GuestList;