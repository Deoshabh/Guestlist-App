import apiService from './ApiService';

class TemplateService {
  constructor() {
    this.apiService = apiService;
  }

  /**
   * Get all message templates
   * @returns {Promise<Array>} - Array of template objects
   */
  async getTemplates() {
    const response = await this.apiService.axiosInstance.get('/templates');
    return response.data;
  }

  /**
   * Get a specific template by ID
   * @param {string} id - Template ID
   * @returns {Promise<Object>} - Template object
   */
  async getTemplate(id) {
    const response = await this.apiService.axiosInstance.get(`/templates/${id}`);
    return response.data;
  }

  /**
   * Create a new template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} - Created template
   */
  async createTemplate(templateData) {
    const response = await this.apiService.axiosInstance.post('/templates', templateData);
    return response.data;
  }

  /**
   * Update an existing template
   * @param {string} id - Template ID
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} - Updated template
   */
  async updateTemplate(id, templateData) {
    const response = await this.apiService.axiosInstance.put(`/templates/${id}`, templateData);
    return response.data;
  }

  /**
   * Delete a template
   * @param {string} id - Template ID
   * @returns {Promise<Object>} - Response data
   */
  async deleteTemplate(id) {
    const response = await this.apiService.axiosInstance.delete(`/templates/${id}`);
    return response.data;
  }
}

// Create and export a singleton instance
const templateService = new TemplateService();
export default templateService;
