import React, { useState, useRef } from 'react';
import { useToast } from './ToastManager';
import haptic from '../utils/haptic';
import ContactService from '../utils/ContactService';
import { useNetwork } from '../contexts/NetworkContext';
import GooglePeopleService from '../utils/GooglePeopleService';
import { parseContactFile } from '../utils/ContactFileParser';

const GuestContactManager = ({ onContactsImported }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  const { isOnline } = useNetwork();
  const fileInputRef = useRef(null);

  const handleImportContacts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (ContactService.isContactPickerSupported()) {
        const contacts = await ContactService.pickContacts();
        // Pass the online status to set appropriate default status
        const formattedGuests = ContactService.formatContactsAsGuests(contacts, isOnline);
        
        // Only notify parent component if we have contacts
        if (formattedGuests.length > 0) {
          onContactsImported(formattedGuests);
          toast.success(`${formattedGuests.length} contacts imported successfully!`);
          haptic.successFeedback();
        } else {
          setError('No contacts were selected');
          toast.info('No contacts were selected');
          haptic.warningFeedback();
        }
      } else {
        const errorMsg = 'Your browser does not support contacts integration. Please use Google contacts or file upload instead.';
        setError(errorMsg);
        toast.warning(errorMsg);
        haptic.warningFeedback();
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to import contacts';
      setError(errorMsg);
      toast.error(errorMsg);
      haptic.errorFeedback();
      console.error('Contact import error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleImport = async () => {
    if (!isOnline) {
      toast.warning('Google import requires an internet connection');
      haptic.warningFeedback();
      return;
    }

    setIsGoogleLoading(true);
    setError(null);
    
    try {
      // First authenticate with Google
      const accessToken = await GooglePeopleService.authorize();
      
      // Then fetch contacts
      const contacts = await GooglePeopleService.fetchContacts(accessToken);
      
      if (contacts && contacts.length > 0) {
        const formattedGuests = ContactService.formatContactsAsGuests(contacts, true);
        onContactsImported(formattedGuests);
        toast.success(`${formattedGuests.length} Google contacts imported successfully!`);
        haptic.successFeedback();
      } else {
        toast.info('No contacts found in your Google account');
        haptic.warningFeedback();
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to import Google contacts';
      setError(errorMsg);
      toast.error(errorMsg);
      haptic.errorFeedback();
      console.error('Google contact import error:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleFileImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const contacts = await parseContactFile(file);
      
      if (contacts && contacts.length > 0) {
        const formattedGuests = ContactService.formatContactsAsGuests(contacts, isOnline);
        onContactsImported(formattedGuests);
        toast.success(`${contacts.length} contacts imported from file successfully!`);
        haptic.successFeedback();
      } else {
        toast.info('No valid contacts found in the file');
        haptic.warningFeedback();
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to import contacts from file';
      setError(errorMsg);
      toast.error(errorMsg);
      haptic.errorFeedback();
      console.error('File import error:', err);
    } finally {
      setIsLoading(false);
      // Reset the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium mb-4 dark:text-white">Import Guests from Contacts</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Native Contact Picker */}
        <button
          onClick={handleImportContacts}
          disabled={isLoading || isGoogleLoading}
          className="btn btn-primary flex items-center justify-center touch-manipulation"
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
              Device Contacts
            </>
          )}
        </button>
        
        {/* Google People API Integration */}
        <button
          onClick={handleGoogleImport}
          disabled={isLoading || isGoogleLoading || !isOnline}
          className={`btn flex items-center justify-center touch-manipulation ${!isOnline ? 'btn-disabled' : 'btn-secondary'}`}
        >
          {isGoogleLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Google Contacts
            </>
          )}
        </button>
        
        {/* File Upload Integration */}
        <button
          onClick={handleFileImport}
          disabled={isLoading || isGoogleLoading}
          className="btn btn-success flex items-center justify-center touch-manipulation"
        >
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload CSV/VCF
        </button>
        
        {/* Hidden file input */}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.vcf"
          className="hidden"
        />
      </div>
      
      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 dark:bg-red-900 dark:text-red-200 p-2 rounded">
          {error}
        </div>
      )}
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-400">
        <div>
          <p><strong>Device Contacts:</strong> Import directly from your phone&apos;s contacts (requires browser support).</p>
        </div>
        <div>
          <p><strong>Google Contacts:</strong> Import contacts from your Google account (requires internet connection).</p>
        </div>
        <div>
          <p><strong>Upload File:</strong> Import from a CSV or VCF file exported from your email or contacts app.</p>
        </div>
      </div>
    </div>
  );
};

export default GuestContactManager;
