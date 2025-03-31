import React, { useState } from 'react';
import { importContactsFromFile, importGoogleContacts } from '../../services/contactService';

const ContactImporter = ({ onContactsImported, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [importMethod, setImportMethod] = useState('device');
  const [vcfFile, setVcfFile] = useState(null);

  // Check if Contact Picker API is supported
  const isContactPickerSupported = 'contacts' in navigator && 'ContactsManager' in window;

  const handleDeviceContactImport = async () => {
    try {
      setIsLoading(true);
      
      if (!isContactPickerSupported) {
        throw new Error('Contact Picker API not supported in this browser. Please try uploading a VCF file instead.');
      }

      const props = ['name', 'tel'];
      const opts = { multiple: true };
      
      const contacts = await navigator.contacts.select(props, opts);
      
      if (contacts.length) {
        // Format contacts for our application
        const formattedContacts = contacts.map(contact => ({
          name: contact.name[0] || 'Unknown',
          phone: contact.tel[0] || '',
          importedFrom: 'device_contacts'
        }));
        
        // Pass the contacts to parent component
        onContactsImported(formattedContacts);
      }
    } catch (error) {
      onError(error.message || 'Failed to import contacts from device');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setVcfFile(e.target.files[0]);
  };

  const handleVcfImport = async (e) => {
    e.preventDefault();
    
    if (!vcfFile) {
      onError('Please select a VCF file to import');
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await importContactsFromFile(vcfFile);
      onContactsImported(result.contacts);
    } catch (error) {
      onError(error.response?.data?.message || 'Failed to import contacts from file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleImport = async () => {
    try {
      setIsLoading(true);
      const result = await importGoogleContacts();
      onContactsImported(result.contacts);
    } catch (error) {
      onError(error.response?.data?.message || 'Failed to import contacts from Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contact-importer">
      <h3>Import Contacts</h3>
      
      <div className="import-method-selector">
        <div className="form-group">
          <label>Import Method</label>
          <select 
            value={importMethod} 
            onChange={(e) => setImportMethod(e.target.value)}
            className="import-method-select"
          >
            <option value="device">Device Contacts</option>
            <option value="vcf">VCF File Upload</option>
            <option value="google">Google Contacts</option>
          </select>
        </div>
      </div>
      
      {importMethod === 'device' && (
        <div className="device-import-section">
          <p>Import contacts directly from your device's contact list.</p>
          <button 
            onClick={handleDeviceContactImport} 
            disabled={isLoading || !isContactPickerSupported}
            className="submit-button"
          >
            {isLoading ? 'Importing...' : 'Select Contacts'}
          </button>
          
          {!isContactPickerSupported && (
            <p className="browser-support-warning">
              Your browser doesn't support the Contact Picker API. 
              Please use VCF import or try on a supported browser (Chrome on Android).
            </p>
          )}
        </div>
      )}
      
      {importMethod === 'vcf' && (
        <div className="vcf-import-section">
          <p>Upload a VCF (vCard) file with your contacts.</p>
          <form onSubmit={handleVcfImport}>
            <div className="form-group">
              <input 
                type="file"
                accept=".vcf"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading || !vcfFile}
              className="submit-button"
            >
              {isLoading ? 'Importing...' : 'Import Contacts'}
            </button>
          </form>
        </div>
      )}
      
      {importMethod === 'google' && (
        <div className="google-import-section">
          <p>Import contacts from your Google account.</p>
          <button 
            onClick={handleGoogleImport} 
            disabled={isLoading}
            className="submit-button"
          >
            {isLoading ? 'Connecting...' : 'Connect to Google'}
          </button>
          <small>
            You'll be redirected to Google to authorize access to your contacts.
          </small>
        </div>
      )}
    </div>
  );
};

export default ContactImporter;
