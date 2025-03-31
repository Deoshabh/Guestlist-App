import React, { useState, useEffect } from 'react';
import GuestContactManager from './GuestContactManager';
import GuestForm from './GuestForm';
import Notification from './Notification';

export default function GuestManager() {
  const [guests, setGuests] = useState([]);
  const [pendingGuests, setPendingGuests] = useState([]);
  const [editingGuest, setEditingGuest] = useState(null);
  const [notification, setNotification] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Load guests from localStorage on component mount
  useEffect(() => {
    const savedGuests = localStorage.getItem('guests');
    if (savedGuests) {
      try {
        setGuests(JSON.parse(savedGuests));
      } catch (e) {
        console.error('Failed to parse saved guests', e);
      }
    }
  }, []);

  // Save guests to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem('guests', JSON.stringify(guests));
  }, [guests]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleContactsImported = (importedGuests) => {
    if (importedGuests.length === 0) {
      showNotification('No contacts were imported', 'info');
      return;
    }
    
    setPendingGuests(importedGuests);
    showNotification(`${importedGuests.length} contacts imported successfully!`);
  };

  const handleAddNewGuest = () => {
    setPendingGuests([...pendingGuests, {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      name: '',
      email: '',
      phone: '',
      status: 'Pending',
      lastUpdated: new Date().toISOString()
    }]);
  };

  const handleSaveGuest = (guest) => {
    if (editingGuest) {
      // Update existing guest
      setGuests(current => 
        current.map(g => g.id === guest.id ? guest : g)
      );
      setEditingGuest(null);
      showNotification('Guest updated successfully!');
    } else {
      // Add a new guest from the pending list
      setGuests(current => [...current, guest]);
      setPendingGuests(current => 
        current.filter(g => g.id !== guest.id)
      );
      showNotification('Guest added successfully!');
    }
  };

  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
  };

  const handleRemoveGuest = (guestId) => {
    setGuests(current => current.filter(g => g.id !== guestId));
    showNotification('Guest removed', 'info');
  };

  const handleRemovePendingGuest = (guestId) => {
    setPendingGuests(current => current.filter(g => g.id !== guestId));
  };

  const handleSaveAllPending = () => {
    if (pendingGuests.length === 0) return;
    
    setGuests(current => [...current, ...pendingGuests]);
    setPendingGuests([]);
    showNotification(`${pendingGuests.length} guests added successfully!`);
  };

  // Filter guests based on search text and status
  const filteredGuests = guests.filter(guest => {
    const matchesText = 
      filterText === '' || 
      guest.name.toLowerCase().includes(filterText.toLowerCase()) ||
      (guest.email && guest.email.toLowerCase().includes(filterText.toLowerCase())) ||
      (guest.phone && guest.phone.toLowerCase().includes(filterText.toLowerCase()));
    
    const matchesStatus = 
      filterStatus === 'All' || 
      guest.status === filterStatus;
    
    return matchesText && matchesStatus;
  });

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Guest Management</h1>
      
      {notification && <Notification message={notification.message} type={notification.type} />}
      
      <GuestContactManager onGuestsImported={handleContactsImported} />
      
      {editingGuest ? (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Edit Guest</h2>
          <GuestForm 
            guest={editingGuest} 
            onSave={handleSaveGuest} 
            onCancel={() => setEditingGuest(null)} 
          />
        </div>
      ) : (
        <>
          {pendingGuests.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Pending Guests ({pendingGuests.length})</h2>
                <div className="space-x-2">
                  <button 
                    onClick={handleSaveAllPending}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Save All
                  </button>
                  <button 
                    onClick={() => setPendingGuests([])}
                    className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
                  >
                    Cancel All
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {pendingGuests.map(guest => (
                  <div key={guest.id} className="p-4 bg-white rounded-lg shadow">
                    <GuestForm 
                      guest={guest} 
                      onSave={handleSaveGuest} 
                      onCancel={() => handleRemovePendingGuest(guest.id)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        
          <div className="mb-6">
            <button 
              onClick={handleAddNewGuest}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Add New Guest
            </button>
          </div>
        </>
      )}
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Guest List ({filteredGuests.length})</h2>
          
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search guests..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md"
            />
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        {filteredGuests.length === 0 ? (
          <p className="text-gray-500 italic">No guests match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGuests.map(guest => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{guest.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {guest.email && <div>{guest.email}</div>}
                        {guest.phone && <div>{guest.phone}</div>}
                        {!guest.email && !guest.phone && <div className="italic text-red-400">No contact info</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${guest.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 
                          guest.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {guest.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(guest.lastUpdated).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEditGuest(guest)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleRemoveGuest(guest.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
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
