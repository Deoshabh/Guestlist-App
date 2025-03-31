import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  getTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate 
} from '../services/templateServiceemplateService';

const TemplatePage = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    description: ''
  });

  // Fetch templates when component mounts
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchTemplates();
  }, [isAuthenticated]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await getTemplates();
      setTemplates(response.templates);
      setError(null);
    } catch (err) {
      setError('Failed to load templates');
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      if (isEditing && currentTemplate) {
        // Update existing template
        await updateTemplate(currentTemplate._id, formData);
      } else {
        // Create new template
        await createTemplate(formData);
      }
      
      // Reset form and refetch templates
      setFormData({ name: '', content: '', description: '' });
      setIsEditing(false);
      setCurrentTemplate(null);
      fetchTemplates();
      
    } catch (err) {
      setError('Failed to save template');
      console.error('Error saving template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (template) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      description: template.description || ''
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      setIsLoading(true);
      await deleteTemplate(id);
      fetchTemplates();
    } catch (err) {
      setError('Failed to delete template');
      console.error('Error deleting template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', content: '', description: '' });
    setIsEditing(false);
    setCurrentTemplate(null);
  };

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (loading || isLoading) {
    return <div className="templates-loading">Loading templates...</div>;
  }

  return (
    <div className="template-page">
      <div className="template-header">
        <h1>Message Templates</h1>
        <p>Create and manage templates for WhatsApp messages</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="template-content">
        <div className="template-form-section">
          <h2>{isEditing ? 'Edit Template' : 'Create New Template'}</h2>
          <form onSubmit={handleSubmit} className="template-form">
            <div className="form-group">
              <label htmlFor="name">Template Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Message Content</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows="5"
                placeholder="Enter your message with {{name}} placeholder"
                required
              />
              <small>Use {{name}} as a placeholder for the guest's name</small>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Add a description for this template"
              />
            </div>

            <div className="form-buttons">
              {isEditing && (
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit" 
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : (isEditing ? 'Update Template' : 'Save Template')}
              </button>
            </div>
          </form>
        </div>

        <div className="template-list-section">
          <h2>Your Templates</h2>
          
          {templates.length === 0 ? (
            <p className="no-templates">No templates created yet. Create your first template to get started.</p>
          ) : (
            <div className="template-list">
              {templates.map(template => (
                <div key={template._id} className="template-item">
                  <div className="template-details">
                    <h3>{template.name}</h3>
                    <p className="template-content">{template.content}</p>
                    {template.description && (
                      <p className="template-description">{template.description}</p>
                    )}
                  </div>
                  <div className="template-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(template)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(template._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatePage;
