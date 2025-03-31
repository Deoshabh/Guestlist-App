import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastManager';
import haptic from '../utils/haptic';
import db from '../utils/db';
import PlaceholderHelp from '../components/PlaceholderHelp';

const WhatsAppTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', message: '' });
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlaceholderHelp, setShowPlaceholderHelp] = useState(false);
  
  const toast = useToast();
  const navigate = useNavigate();

  // Load templates from IndexedDB
  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const allTemplates = await db.getAllMessageTemplates();
      setTemplates(allTemplates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load all templates on component mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Save a new template
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    
    if (!newTemplate.name.trim() || !newTemplate.message.trim()) {
      toast.error('Please fill in both name and message');
      haptic.errorFeedback();
      return;
    }
    
    try {
      const templateToSave = {
        ...newTemplate,
        createdAt: new Date().toISOString()
      };
      
      if (editingTemplate) {
        templateToSave._id = editingTemplate._id;
      }
      
      await db.saveMessageTemplate(templateToSave);
      
      toast.success(editingTemplate ? 'Template updated' : 'Template saved');
      haptic.successFeedback();
      
      // Reset form and refresh templates
      setNewTemplate({ name: '', message: '' });
      setEditingTemplate(null);
      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
      haptic.errorFeedback();
    }
  };

  // Delete a template
  const handleDeleteTemplate = async (id) => {
    try {
      await db.deleteMessageTemplate(id);
      toast.success('Template deleted');
      haptic.successFeedback();
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
      haptic.errorFeedback();
    }
  };

  // Edit a template
  const handleEditTemplate = (template) => {
    setNewTemplate({
      name: template.name,
      message: template.message
    });
    setEditingTemplate(template);
    haptic.lightFeedback();
    
    // Scroll to form
    document.getElementById('template-form').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  };

  // Navigate back
  const handleBack = () => {
    navigate(-1);
  };

  // Calculate template statistics
  const getTemplateStats = (message) => {
    const placeholderCount = (message.match(/{{[^}]+}}/g) || []).length;
    const wordCount = message.split(/\s+/).filter(Boolean).length;
    const charCount = message.length;
    
    return { placeholderCount, wordCount, charCount };
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">WhatsApp Templates</h1>
        <button 
          onClick={handleBack}
          className="btn btn-outline btn-sm"
        >
          Back
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Template List Section */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Your Templates ({templates.length})
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="spinner"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                You haven&apos;t created any WhatsApp templates yet.
              </p>
              <p className="text-gray-500 dark:text-gray-500">
                Templates help you send consistent messages quickly.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map(template => {
                const stats = getTemplateStats(template.message);
                
                return (
                  <div key={template._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                        {template.name}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          title="Edit template"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template._id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          title="Delete template"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md whitespace-pre-line text-gray-700 dark:text-gray-300">
                      {template.message}
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span title="Created on">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                      <span title="Placeholders">
                        {stats.placeholderCount} placeholder{stats.placeholderCount !== 1 ? 's' : ''}
                      </span>
                      <span title="Word count">
                        {stats.wordCount} word{stats.wordCount !== 1 ? 's' : ''}
                      </span>
                      <span title="Character count">
                        {stats.charCount} character{stats.charCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Template Form Section */}
        <div>
          <div id="template-form" className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 sticky top-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </h2>
            
            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name*
                </label>
                <input
                  id="template-name"
                  type="text"
                  className="input w-full"
                  placeholder="E.g., Welcome Message"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="template-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message Template*
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPlaceholderHelp(!showPlaceholderHelp)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showPlaceholderHelp ? 'Hide Placeholders' : 'Show Placeholders'}
                  </button>
                </div>
                <textarea
                  id="template-message"
                  className="input w-full"
                  rows={6}
                  placeholder="Hello {{name}}, welcome to our event!"
                  value={newTemplate.message}
                  onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                  required
                ></textarea>
                
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {/* eslint-disable-next-line */}
                  Use placeholders like {{name}}, {{email}}, etc. that will be replaced with actual guest data.
                </p>
              </div>
              
              {showPlaceholderHelp && (
                <PlaceholderHelp compact={true} />
              )}
              
              <div className="flex justify-end space-x-3">
                {editingTemplate && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setNewTemplate({ name: '', message: '' });
                      setEditingTemplate(null);
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingTemplate ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTemplatesPage;
