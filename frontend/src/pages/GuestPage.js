import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getGuests, deleteGuest, importGuestsFromCsv, generateBulkWhatsAppLinks } from '../services/guestService';
import { getTemplates } from '../services/templateService';
import GuestForm from '../components/guests/GuestForm';
import ContactImporter from '../components/guests/ContactImporter';

const GuestPage = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const [guests, setGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploadError, setCsvUploadError] = useState(null);
  const [csvUploadSuccess, setCsvUploadSuccess] = useState(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState('Hello {{name}}, we invite you to our event.');
  const [whatsappLinks, setWhatsappLinks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentGuest, setCurrentGuest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('custom');
  const [contactImportMode, setContactImportMode] = useState(false);
  const [importedContacts, setImportedContacts] = useState([]);
  const [contactImportSuccess, setContactImportSuccess] = useState(null);

  // Fetch guests when component mounts
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchGuests();
    fetchTemplates();
  }, [isAuthenticated]);

  const fetchGuests = async () => {
    try {
      setIsLoading(true);
      const response = await getGuests();
      setGuests(response.guests);
      setError(null);
    } catch (err) {
      setError('Failed to load guests');
      console.error('Error fetching guests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await getTemplates();
      setTemplates(response.templates || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      // Don't set error here to avoid overwhelming the user
    }
  };

  const handleGuestDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this guest?')) return;
    
    try {
      await deleteGuest(id);
      setGuests(guests.filter(guest => guest._id !== id));
    } catch (error) {
      setError('Failed to delete guest');
    }
  };

  const handleSelectGuest = (id) => {
    if (selectedGuests.includes(id)) {
      setSelectedGuests(selectedGuests.filter(guestId => guestId !== id));
    } else {
      setSelectedGuests([...selectedGuests, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filteredGuests.map(guest => guest._id));
    }
  };

  const handleCsvFileChange = (e) => {
    setCsvFile(e.target.files[0]);
    setCsvUploadError(null);
    setCsvUploadSuccess(null);
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    
    if (!csvFile) {
      setCsvUploadError('Please select a file to upload');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await importGuestsFromCsv(csvFile);
      setCsvUploadSuccess(`Successfully imported ${response.count} guests`);
      setCsvUploadError(null);
      setCsvFile(null);
      // Reset the file input
      document.getElementById('csv-file-input').value = '';
      // Refresh the guest list
      fetchGuests();
    } catch (error) {
      setCsvUploadError(error.response?.data?.message || 'Failed to import guests');
      setCsvUploadSuccess(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    
    if (templateId === 'custom') {
      // Keep current template text if "custom" is selected
      return;
    }
    
    // Find the selected template and use its content
    const selectedTemplate = templates.find(t => t._id === templateId);
    if (selectedTemplate) {
      setWhatsappTemplate(selectedTemplate.content);
    }
  };

  const handleGenerateWhatsAppLinks = async () => {
    if (selectedGuests.length === 0) {
      setError('Please select at least one guest');
      return;
    }
    
    if (!whatsappTemplate) {
      setError('Please enter a message template');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await generateBulkWhatsAppLinks(selectedGuests, whatsappTemplate);
      setWhatsappLinks(response.results);
      setError(null);
    } catch (error) {
      setError('Failed to generate WhatsApp links');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGuest = () => {
    setCurrentGuest(null);
    setShowForm(true);
  };

  const handleEditGuest = (guest) => {
    setCurrentGuest(guest);
    setShowForm(true);
  };

  const handleSaveGuest = (savedGuest) => {
    if (currentGuest) {
      // Update existing guest in the list
      setGuests(guests.map(g => g._id === savedGuest._id ? savedGuest : g));
    } else {
      // Add new guest to the list
      setGuests([savedGuest, ...guests]);
    }
    setShowForm(false);
  };

  const handleContactsImported = (contacts) => {
    setImportedContacts(contacts);
    setContactImportSuccess(`Successfully imported ${contacts.length} contacts`);
    // You might want to show them in a list to review before adding as guests
  };

  const handleAddContactsAsGuests = async () => {
    try {
      setIsLoading(true);
      // Convert contacts to guests format
      const guestsToAdd = importedContacts.map(contact => ({
        name: contact.name,
        phone: contact.phone,
        email: contact.email || '',
        status: 'pending',
        notes: `Imported from contacts on ${new Date().toLocaleDateString()}`
      }));
      
      // Use the bulk import endpoint (need to create this)
      const response = await axios.post(`${API_URL}/guests/bulk`, { guests: guestsToAdd });
      
      // Update the guest list
      fetchGuests();
      
      // Reset the import state
      setImportedContacts([]);
      setContactImportMode(false);
      setContactImportSuccess(`Added ${response.data.count} guests from contacts`);
    } catch (error) {
      setError('Failed to add contacts as guests');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and search guests
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         guest.phone.includes(searchTerm) ||
                         (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || guest.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (loading || isLoading) {
    return <div className="guests-loading">Loading guests...</div>;
  }

  if (showForm) {
    return (
      <GuestForm 
        guest={currentGuest} 
        onSave={handleSaveGuest} 
        onCancel={() => setShowForm(false)} 
      />
    );
  }

  const renderWhatsappSection = () => (
    <div className="whatsapp-section">
      <h2>Generate WhatsApp Links</h2>
      <p>Create WhatsApp message links for selected guests</p>
      
      {templates.length > 0 && (
        <div className="form-group">
          <label htmlFor="template-select">Choose Template</label>
          <select
            id="template-select"
            value={selectedTemplateId}
            onChange={handleTemplateChange}
          >
            <option value="custom">Custom Message</option>
            {templates.map(template => (
              <option key={template._id} value={template._id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="whatsapp-template">Message Template</label>
        <textarea
          id="whatsapp-template"
          value={whatsappTemplate}
          onChange={(e) => setWhatsappTemplate(e.target.value)}
          placeholder="Enter your message with {{name}} placeholder"
          rows="3"
        />
        <small>Use {{name}} as a placeholder for the guest's name</small>
      </div>
      
      <button 
        onClick={handleGenerateWhatsAppLinks}
        className="submit-button"
        disabled={selectedGuests.length === 0}
      >
        Generate WhatsApp Links
      </button>
    </div>
  );

  const renderContactImportSection = () => (
    <div className="contact-import-section">
      <h2>Import from Contacts</h2>
      <p>Import guests from your device contacts or Google</p>
      
      {contactImportSuccess && <div className="success-message">{contactImportSuccess}</div>}
      
      {contactImportMode ? (
        <>
          <ContactImporter 
            onContactsImported={handleContactsImported} 
            onError={setError}
          />
          
          {importedContacts.length > 0 && (
            <div className="imported-contacts-actions">
              <p>{importedContacts.length} contacts ready to import</p>
              <button 
                onClick={handleAddContactsAsGuests}
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add as Guests'}
              </button>
              <button 
                onClick={() => {
                  setImportedContacts([]);
                  setContactImportMode(false);
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      ) : (
        <button 
          onClick={() => setContactImportMode(true)}
          className="submit-button"
        >
          Import from Contacts
        </button>
      )}
    </div>
  );

  return (
    <div className="guest-page">
      <div className="guest-header">
        <h1>Guest Management</h1>
        <p>Add, import, and manage your guests</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="guest-top-actions">
        <button 
          className="add-guest-button"
          onClick={handleAddGuest}
        >
          <i className="fas fa-plus"></i> Add New Guest
        </button>
      </div>

      <div className="guest-actions">
        <div className="csv-import-section">
          <h2>Import Guests from CSV</h2>
          <p>Upload a CSV file with guest data (name, email, phone, status, notes)</p>
          
          {csvUploadError && <div className="error-message">{csvUploadError}</div>}
          {csvUploadSuccess && <div className="success-message">{csvUploadSuccess}</div>}
          
          <form onSubmit={handleCsvUpload} className="csv-upload-form">
            <div className="form-group">
              <input 
                type="file" 
                id="csv-file-input"
                accept=".csv" 
                onChange={handleCsvFileChange}
              />
            </div>
            <button type="submit" className="submit-button">Import Guests</button>
          </form>
        </div>

        {renderContactImportSection()}

        {renderWhatsappSection()}
      </div>

      {whatsappLinks.length > 0 && (
        <div className="whatsapp-links-section">
          <h2>WhatsApp Links</h2>
          <div className="whatsapp-links-list">
            {whatsappLinks.map(link => (
              <div key={link.id} className="whatsapp-link-item">
                <span>{link.name}</span>
                <a 
                  href={link.whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="whatsapp-button"
                >
                  Open WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="guest-list-section">
        <div className="guest-list-controls">
          <h2>Your Guests</h2>
          
          <div className="guest-filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search guests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="status-filter">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
                <option value="attended">Attended</option>
              </select>
            </div>
          </div>
        </div>
        
        {filteredGuests.length === 0 ? (
          <p className="no-guests">
            {guests.length === 0 
              ? 'No guests added yet. Import or add guests to get started.' 
              : 'No guests match your search criteria.'}
          </p>
        ) : (
          <>
            <div className="guest-list-header">
              <div className="guest-select-all">
                <input 
                  type="checkbox" 
                  checked={selectedGuests.length === filteredGuests.length && filteredGuests.length > 0}
                  onChange={handleSelectAll}
                />
                <span>Select All</span>
              </div>
              <span>{selectedGuests.length} guests selected</span>
            </div>
            
            <div className="guest-list">
              {filteredGuests.map(guest => (
                <div key={guest._id} className="guest-item">
                  <div className="guest-select">
                    <input 
                      type="checkbox" 
                      checked={selectedGuests.includes(guest._id)}
                      onChange={() => handleSelectGuest(guest._id)}
                    />
                  </div>
                  <div className="guest-details">
                    <h3>{guest.name}</h3>
                    <p><strong>Phone:</strong> {guest.phone}</p>
                    {guest.email && <p><strong>Email:</strong> {guest.email}</p>}
                    <p><strong>Status:</strong> 
                      <span className={`status-badge ${guest.status}`}>
                        {guest.status.charAt(0).toUpperCase() + guest.status.slice(1)}
                      </span>
                    </p>
                    {guest.notes && <p><strong>Notes:</strong> {guest.notes}</p>}
                  </div>
                  <div className="guest-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEditGuest(guest)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleGuestDelete(guest._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GuestPage;
