import React, { useState } from 'react';
import ContactsHelper from '../../utils/ContactsHelper';

/**
 * A button component that handles importing contacts from the phonebook
 */
const ContactButton = ({ onContactSelected, buttonText = "Import from Phonebook", className = "" }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleContactSelect = async () => {
    setIsLoading(true);
    try {
      const contact = await ContactsHelper.selectContact(['name', 'email', 'tel']);
      if (contact) {
        onContactSelected(contact);
      }
    } catch (error) {
      console.error('Error selecting contact:', error);
      // You could add error toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleContactSelect}
      disabled={isLoading}
      className={`flex items-center justify-center px-4 py-2 border border-gray-300 
                 shadow-sm text-sm font-medium rounded-md text-gray-700 
                 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
                 focus:ring-offset-2 focus:ring-indigo-500 ${className}`}
      aria-label="Import contact from phonebook"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {buttonText}
        </>
      )}
    </button>
  );
};

export default ContactButton;
