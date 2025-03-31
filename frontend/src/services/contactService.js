import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Import contacts from VCF file
export const importContactsFromFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/contacts/import/vcf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error importing contacts from file:', error);
    throw error;
  }
};

// Import contacts from Google
export const importGoogleContacts = async () => {
  try {
    // First, start the OAuth flow
    const response = await axios.get(`${API_URL}/contacts/import/google/start`);
    
    // Open the OAuth URL in a new window
    const authWindow = window.open(response.data.authUrl, '_blank', 'width=600,height=700');
    
    // Create a promise that resolves when we get the contacts
    return new Promise((resolve, reject) => {
      // Set up a listener for messages from the OAuth window
      window.addEventListener('message', async (event) => {
        // Make sure the message is from our application
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_CODE') {
          try {
            // Exchange the auth code for contacts
            const contactsResponse = await axios.post(`${API_URL}/contacts/import/google/callback`, {
              code: event.data.code
            });
            
            // Close the OAuth window
            if (authWindow) authWindow.close();
            
            resolve(contactsResponse.data);
          } catch (error) {
            reject(error);
          }
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          if (authWindow) authWindow.close();
          reject(new Error(event.data.error || 'Google authentication failed'));
        }
      });
      
      // Set a timeout in case the window is closed without authentication
      setTimeout(() => {
        if (authWindow && !authWindow.closed) {
          authWindow.close();
        }
      }, 120000); // 2 minutes timeout
    });
  } catch (error) {
    console.error('Error starting Google contacts import:', error);
    throw error;
  }
};

// Update a guest's contact info from phone book
export const updateGuestFromContact = async (guestId, contactData) => {
  try {
    const response = await axios.put(`${API_URL}/guests/${guestId}/update-from-contact`, contactData);
    return response.data;
  } catch (error) {
    console.error('Error updating guest from contact:', error);
    throw error;
  }
};

// Get a list of contacts from the phone book that match guests
export const matchGuestsWithContacts = async (contacts) => {
  try {
    const response = await axios.post(`${API_URL}/contacts/match-guests`, { contacts });
    return response.data;
  } catch (error) {
    console.error('Error matching guests with contacts:', error);
    throw error;
  }
};
