import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get all templates
export const getTemplates = async () => {
  try {
    const response = await axios.get(`${API_URL}/templates`);
    return response.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

// Get a template by ID
export const getTemplateById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/templates/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
};

// Create a new template
export const createTemplate = async (templateData) => {
  try {
    const response = await axios.post(`${API_URL}/templates`, templateData);
    return response.data;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

// Update a template
export const updateTemplate = async (id, templateData) => {
  try {
    const response = await axios.put(`${API_URL}/templates/${id}`, templateData);
    return response.data;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

// Delete a template
export const deleteTemplate = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/templates/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};
