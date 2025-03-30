import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

function GuestList({ token, guests, onUpdate, apiBaseUrl = '/api' }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'invited', 'notInvited'
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

  // Reset selected guests when the guests list changes
  useEffect(() => {
    setSelected([]);
  }, [guests]);

  // Filtered and sorted guests
  const filteredAndSortedGuests = useMemo(() => {
    // Apply search filter
    let result = guests.filter(g => 
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.contact && g.contact.toLowerCase().includes(search.toLowerCase()))
    );
    
    // Apply invited/not invited filter
    if (filter === 'invited') {
      result = result.filter(g => g.invited);
    } else if (filter === 'notInvited') {
      result = result.filter(g => !g.invited);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let valueA, valueB;
      
      // Handle different field types
      if (sortField === 'name' || sortField === 'contact') {
        valueA = (a[sortField] || '').toLowerCase();
        valueB = (b[sortField] || '').toLowerCase();
      } else if (sortField === 'invited') {
        valueA = a.invited ? 1 : 0;
        valueB = b.invited ? 1 : 0;
      } else {
        valueA = a[sortField];
        valueB = b[sortField];
      }
      
      // Determine sort direction
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    return result;
  }, [guests, search, filter, sortField, sortOrder]);

  const isAllSelected = filteredAndSortedGuests.length > 0 && 
    filteredAndSortedGuests.every(g => selected.includes(g._id));

  const toggleAll = () => {
    if (isAllSelected) {
      setSelected([]);
    } else {
      setSelected(filteredAndSortedGuests.map(g => g._id));
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const updateBulkInvited = async (invited) => {
    if (selected.length === 0) return;
    
    setLoading(true);
    try {
      await axios.put(`${apiBaseUrl === '/api' ? '/guests/bulk-update' : '/guests/bulk-update'}`, { ids: selected, invited }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelected([]);
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Error updating guests');
    } finally {
      setLoading(false);
    }
  };

  const toggleGuestInvited = async (id, currentStatus) => {
    setLoading(true);
    try {
      await axios.put(`${apiBaseUrl === '/api' ? '/guests/' : '/guests/'}${id}`, { invited: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Error updating guest');
    } finally {
      setLoading(false);
    }
  };

  const deleteGuest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this guest?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`${apiBaseUrl === '/api' ? '/guests/' : '/guests/'}${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Error deleting guest');
    } finally {
      setLoading(false);
    }
  };

  const undoDelete = async (id) => {
    setLoading(true);
    try {
      await axios.put(`${apiBaseUrl === '/api' ? '/guests/' : '/guests/'}${id}/undo`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Error restoring guest');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    window.open(`${apiBaseUrl === '/api' ? '/guests/export' : '/guests/export'}`, '_blank');
  };

  const importCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setLoading(true);
    try {
      await axios.post(`${apiBaseUrl === '/api' ? '/guests/import' : '/guests/import'}`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      onUpdate();
      e.target.value = null; // Reset file input
    } catch (err) {
      console.error(err);
      alert('Error importing guests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Guest List</h2>
        
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
                onClick={() => setViewMode('card')}
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
                onClick={() => setViewMode('table')}
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
            onClick={() => setFilter('all')}
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
            onClick={() => setFilter('invited')}
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
            onClick={() => setFilter('notInvited')}
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
            disabled={loading || guests.length === 0}
            className="btn btn-outline text-sm"
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </span>
          </button>
          
          <label className="btn btn-outline text-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import CSV
            <input 
              type="file" 
              accept=".csv" 
              onChange={importCSV}
              disabled={loading}
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
                      <h3 className="font-medium text-gray-900 dark:text-white">{guest.name}</h3>
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
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{guest.name}</div>
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
    </div>
  );
}

export default GuestList;
