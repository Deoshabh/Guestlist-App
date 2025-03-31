import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get all guests
export const getGuests = async () => {
  try {
    const response = await axios.get(`${API_URL}/guests`);
    return response.data;
  } catch (error) {
    console.error('Error fetching guests:', error);
    throw error;
  }
};

// Get a guest by ID
export const getGuestById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/guests/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching guest:', error);
    throw error;
  }
};

// Create a new guest
export const createGuest = async (guestData) => {
  try {
    const response = await axios.post(`${API_URL}/guests`, guestData);
    return response.data;
  } catch (error) {
    console.error('Error creating guest:', error);
    throw error;
  }
};

// Update a guest
export const updateGuest = async (id, guestData) => {
  try {
    const response = await axios.put(`${API_URL}/guests/${id}`, guestData);
    return response.data;
  } catch (error) {
    console.error('Error updating guest:', error);
    throw error;
  }
};

// Delete a guest
export const deleteGuest = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/guests/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting guest:', error);
    throw error;
  }
};

// Import guests from CSV
export const importGuestsFromCsv = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/guests/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error importing guests:', error);
    throw error;
  }
};

// Generate WhatsApp link for a guest
export const generateWhatsAppLink = async (id, template) => {
  try {
    const response = await axios.post(`${API_URL}/guests/${id}/whatsapp`, { template });
    return response.data;
  } catch (error) {
    console.error('Error generating WhatsApp link:', error);
    throw error;
  }
};

// Generate WhatsApp links for multiple guests
export const generateBulkWhatsAppLinks = async (guestIds, template) => {
  try {
    const response = await axios.post(`${API_URL}/guests/whatsapp/bulk`, { 
      guestIds, 
      template 
    });
    return response.data;
  } catch (error) {
    console.error('Error generating bulk WhatsApp links:', error);
    throw error;
  }
};
