import React from 'react';
import haptic from '../utils/haptic';

/**
 * PendingGuestsList Component
 * Displays and allows editing of multiple pending guests before final submission
 */
const PendingGuestsList = ({ 
  pendingGuests, 
  onUpdatePendingGuest, 
  onRemovePendingGuest, 
  onSaveAll, 
  onCancelAll 
}) => {
  if (!pendingGuests || pendingGuests.length === 0) {
    return null;
  }

  const handleChange = (index, field, value) => {
    const guest = pendingGuests[index];
    onUpdatePendingGuest(index, {
      ...guest,
      [field]: value
    });
  };

  const handleRemove = (index) => {
    haptic.lightFeedback();
    onRemovePendingGuest(index);
  };

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium dark:text-white">
          Pending Guests ({pendingGuests.length})
        </h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => { 
              haptic.mediumFeedback();
              onSaveAll();
            }}
            className="btn btn-primary text-sm"
          >
            Save All
          </button>
          <button 
            onClick={() => {
              haptic.lightFeedback();
              onCancelAll();
            }}
            className="btn btn-outline text-sm"
          >
            Cancel All
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto p-1">
        {pendingGuests.map((guest, index) => (
          <div key={guest.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative">
            <button
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
              aria-label="Remove guest"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name*
                </label>
                <input
                  type="text"
                  value={guest.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                  required
                  className="input w-full"
                  placeholder="Guest name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={guest.phone || ''}
                  onChange={(e) => {
                    const phone = e.target.value;
                    handleChange(index, 'phone', phone);
                    // Update contact field as well if it was empty or matches the old phone
                    if (!guest.contact || guest.contact === guest.phone) {
                      handleChange(index, 'contact', phone);
                    }
                  }}
                  className="input w-full"
                  placeholder="Phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={guest.email || ''}
                  onChange={(e) => {
                    const email = e.target.value;
                    handleChange(index, 'email', email);
                    // Update contact field if empty and no phone exists
                    if (!guest.contact && !guest.phone) {
                      handleChange(index, 'contact', email);
                    }
                  }}
                  className="input w-full"
                  placeholder="Email address"
                />
              </div>
              
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  checked={guest.invited || false}
                  onChange={(e) => handleChange(index, 'invited', e.target.checked)}
                  className="h-5 w-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Already Invited
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingGuestsList;
