import React, { useEffect, useState } from 'react';
import haptic from '../utils/haptic';
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
    </div>
  );
}

export default GuestList;