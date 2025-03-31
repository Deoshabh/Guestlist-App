import React, { useState } from 'react';
import ContactService from '../services/ContactService';

export default function GuestContactManager({ onGuestsImported }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImportContacts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (ContactService.isContactPickerSupported()) {
        const contacts = await ContactService.pickContacts();
        const formattedGuests = ContactService.formatContactsAsGuests(contacts);
        onGuestsImported(formattedGuests);
      } else {
        setError('Your browser does not support contacts integration. Please add guests manually.');
      }
    } catch (err) {
      setError(err.message || 'Failed to import contacts');
      console.error('Contact import error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium mb-2">Import Guests from Phonebook</h3>
      
      <button
        onClick={handleImportContacts}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 flex items-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Importing...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Import from Phonebook
          </>
        )}
      </button>
      
      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      <p className="mt-2 text-sm text-gray-600">
        Import multiple guests at once from your device's contacts.
        {!ContactService.isContactPickerSupported() && " Unfortunately, your browser doesn't support this feature."}
      </p>
    </div>
  );
}
