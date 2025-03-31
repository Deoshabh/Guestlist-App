import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './ToastManager';
import haptic from '../utils/haptic';
import db from '../utils/db';
import { 
  formatMessageWithPlaceholders, 
  openWhatsAppChat
} from '../utils/whatsappUtils';

/**
 * WhatsApp Message Composer
 * 
 * A component that allows users to compose WhatsApp messages with placeholders
 * that will be replaced with guest-specific data, and send them to selected guests.
 */
const WhatsAppMessageComposer = ({ 
  guests = [], 
  selectedGroup = null,
  guestGroups = [],
  isMobile = false,
  onEditGuest = null
}) => {
  const [message, setMessage] = useState('');
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isPlaceholderMenuOpen, setIsPlaceholderMenuOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [guestsWithoutPhone, setGuestsWithoutPhone] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const messageInputRef = useRef(null);
  const toast = useToast();

  // Expanded placeholders with additional options
  const placeholders = [
    { id: 'name', label: 'Guest Name', value: '{{name}}' },
    { id: 'firstname', label: 'First Name', value: '{{firstname}}' },
    { id: 'email', label: 'Email', value: '{{email}}' },
    { id: 'phone', label: 'Phone', value: '{{phone}}' },
    { id: 'group', label: 'Group Name', value: '{{group}}' },
    { id: 'date', label: 'Current Date', value: '{{date}}' },
    { id: 'time', label: 'Current Time', value: '{{time}}' }
  ];

  // Load message templates from IndexedDB
  const loadMessageTemplates = useCallback(async () => {
    try {
      setIsLoadingTemplates(true);
      const templates = await db.getAllMessageTemplates();
      setMessageTemplates(templates || []);
    } catch (error) {
      console.error('Error loading message templates:', error);
      toast.error('Failed to load message templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [toast]);

  // Load saved message templates on component mount
  useEffect(() => {
    loadMessageTemplates();
  }, [loadMessageTemplates]);

  // Reset selections when guests change
  useEffect(() => {
    setSelectedGuests([]);
    setIsSelectAll(false);
    setPreviewIndex(0);
  }, [guests]);

  // Update preview index when selected guests change
  useEffect(() => {
    if (selectedGuests.length > 0 && previewIndex >= selectedGuests.length) {
      setPreviewIndex(0);
    }
  }, [selectedGuests, previewIndex]);

  // Save a new message template
  const saveMessageTemplate = async () => {
    if (!message.trim() || !templateName.trim()) {
      toast.error('Please enter both template name and message');
      return;
    }

    try {
      const newTemplate = {
        name: templateName.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString()
      };

      // Save to IndexedDB
      await db.saveMessageTemplate(newTemplate);
      
      // Reload templates
      await loadMessageTemplates();
      
      // Reset form
      setTemplateName('');
      setShowSaveTemplate(false);
      
      toast.success('Message template saved successfully');
      haptic.successFeedback();
    } catch (error) {
      console.error('Error saving message template:', error);
      toast.error('Failed to save message template');
      haptic.errorFeedback();
    }
  };

  // Save the current message as a quick template
  const saveAsQuickTemplate = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      haptic.errorFeedback();
      return;
    }

    try {
      const quickTemplateId = `quick_template_${Date.now()}`;
      localStorage.setItem(quickTemplateId, message);
      toast.success('Quick template saved');
      haptic.successFeedback();
    } catch (error) {
      console.error('Error saving quick template:', error);
      toast.error('Failed to save quick template');
      haptic.errorFeedback();
    }
  };

  // Load quick templates
  const loadQuickTemplates = () => {
    try {
      const templates = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('quick_template_')) {
          templates.push({
            id: key,
            message: localStorage.getItem(key)
          });
        }
      }
      return templates;
    } catch (error) {
      console.error('Error loading quick templates:', error);
      return [];
    }
  };

  // Delete a quick template
  const deleteQuickTemplate = (id) => {
    try {
      localStorage.removeItem(id);
      toast.success('Quick template deleted');
      haptic.lightFeedback();
      // Force component update
      setShowSaveTemplate(show => !show);
      setShowSaveTemplate(show => !show);
    } catch (error) {
      console.error('Error deleting quick template:', error);
      toast.error('Failed to delete quick template');
    }
  };

  // Insert a quick template
  const insertQuickTemplate = (templateMessage) => {
    setMessage(templateMessage);
    haptic.lightFeedback();
  };

  // Get quick templates
  const quickTemplates = loadQuickTemplates();

  // Load a saved template
  const loadTemplate = (template) => {
    setMessage(template.message);
    haptic.lightFeedback();
    toast.info(`Template "${template.name}" loaded`);
  };

  // Delete a template
  const deleteTemplate = async (id) => {
    try {
      await db.deleteMessageTemplate(id);
      await loadMessageTemplates();
      toast.success('Template deleted');
      haptic.successFeedback();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
      haptic.errorFeedback();
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const insertPlaceholder = (placeholder) => {
    if (!messageInputRef.current) return;
    
    const textarea = messageInputRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newMessage = message.substring(0, start) + 
                      placeholder + 
                      message.substring(end);
    
    setMessage(newMessage);
    
    // Focus back on textarea and set cursor position after the inserted placeholder
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + placeholder.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
    
    setIsPlaceholderMenuOpen(false);
    haptic.lightFeedback();
  };

  const toggleGuestSelection = (guest) => {
    haptic.lightFeedback();
    setSelectedGuests(prev => {
      const isSelected = prev.some(g => g._id === guest._id);
      if (isSelected) {
        return prev.filter(g => g._id !== guest._id);
      } else {
        return [...prev, guest];
      }
    });
  };

  const handleToggleSelectAll = () => {
    haptic.lightFeedback();
    if (isSelectAll) {
      setSelectedGuests([]);
    } else {
      // Only select guests with phone numbers
      const guestsWithPhone = guests.filter(guest => guest.phone);
      setSelectedGuests(guestsWithPhone);
    }
    setIsSelectAll(!isSelectAll);
  };

  // Pre-check for guests missing phone numbers
  const checkGuestsWithoutPhone = () => {
    const withoutPhone = selectedGuests.filter(guest => !guest.phone);
    setGuestsWithoutPhone(withoutPhone);
    return withoutPhone.length > 0;
  };

  const handleSendMessage = () => {
    if (selectedGuests.length === 0) {
      toast.error('Please select at least one guest');
      haptic.errorFeedback();
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      haptic.errorFeedback();
      return;
    }

    // Check for guests without phone numbers first
    if (checkGuestsWithoutPhone()) {
      setConfirmModalVisible(true);
      return;
    }

    sendMessagesToSelectedGuests();
  };

  // Send messages to the selected guests
  const sendMessagesToSelectedGuests = () => {
    // Filter out guests without phone numbers
    const readyGuests = selectedGuests.filter(guest => guest.phone);
    
    if (readyGuests.length === 0) {
      toast.error('None of the selected guests have phone numbers');
      haptic.errorFeedback();
      return;
    }

    // Send to each guest
    let successCount = 0;
    let failureCount = 0;

    readyGuests.forEach(guest => {
      const success = openWhatsAppChat(guest, message, { guestGroups });
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    });

    // Give feedback
    if (successCount > 0) {
      toast.success(`Opening WhatsApp for ${successCount} guest${successCount > 1 ? 's' : ''}`);
      haptic.successFeedback();
    }

    if (failureCount > 0) {
      toast.error(`Failed to open WhatsApp for ${failureCount} guest${failureCount > 1 ? 's' : ''}`);
      haptic.errorFeedback();
    }

    // Close the confirmation modal if it was open
    setConfirmModalVisible(false);
  };

  // Handle editing a guest that doesn't have a phone number
  const handleEditMissingPhone = (guest) => {
    if (onEditGuest && typeof onEditGuest === 'function') {
      onEditGuest(guest);
      haptic.mediumFeedback();
    } else {
      toast.info('Guest editing not available');
      haptic.errorFeedback();
    }
    setConfirmModalVisible(false);
  };

  // Change preview to next guest
  const handleNextPreview = () => {
    if (selectedGuests.length > 0) {
      setPreviewIndex((prevIndex) => (prevIndex + 1) % selectedGuests.length);
      haptic.lightFeedback();
    }
  };

  // Change preview to previous guest
  const handlePrevPreview = () => {
    if (selectedGuests.length > 0) {
      setPreviewIndex((prevIndex) => 
        prevIndex === 0 ? selectedGuests.length - 1 : prevIndex - 1
      );
      haptic.lightFeedback();
    }
  };

  // Get current preview guest
  const previewGuest = selectedGuests[previewIndex];

  // Format message for preview
  const previewMessage = formatMessageWithPlaceholders(message, previewGuest, { guestGroups });

  // Show examples of placeholder usage
  const getPlaceholderExamples = () => {
    if (!previewGuest) return [];
    
    return [
      { label: 'Name', original: '{{name}}', replaced: previewGuest.name || 'Guest' },
      { label: 'First Name', original: '{{firstname}}', replaced: (previewGuest.name || 'Guest').split(' ')[0] },
      { label: 'Email', original: '{{email}}', replaced: previewGuest.email || '(no email)' },
      { label: 'Phone', original: '{{phone}}', replaced: previewGuest.phone || '(no phone)' },
      { label: 'Group', original: '{{group}}', replaced: guestGroups.find(g => g._id === previewGuest.groupId)?.name || '(no group)' },
      { label: 'Date', original: '{{date}}', replaced: new Date().toLocaleDateString() },
      { label: 'Time', original: '{{time}}', replaced: new Date().toLocaleTimeString() }
    ];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 animate-fadeIn whatsapp-composer">
      <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        WhatsApp Message Composer
      </h2>
      
      {/* Message Template Selection */}
      {isLoadingTemplates ? (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Loading templates...
        </div>
      ) : messageTemplates.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Saved Templates
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {messageTemplates.map(template => (
              <div key={template._id} className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1 template-tag">
                <button 
                  onClick={() => loadTemplate(template)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline mr-2"
                >
                  {template.name}
                </button>
                <button
                  onClick={() => deleteTemplate(template._id)}
                  className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                  aria-label={`Delete template ${template.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Templates */}
      {quickTemplates.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quick Templates
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickTemplates.map(template => (
              <div key={template.id} className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1 template-tag">
                <button 
                  onClick={() => insertQuickTemplate(template.message)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline mr-2"
                  title={template.message.length > 30 ? template.message : ''}
                >
                  {template.message.length > 30 
                    ? template.message.substring(0, 27) + '...' 
                    : template.message}
                </button>
                <button
                  onClick={() => deleteQuickTemplate(template.id)}
                  className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                  aria-label="Delete quick template"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Message Composer */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Message
          </label>
          <div className="relative flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowSaveTemplate(!showSaveTemplate)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save as Template
            </button>
            
            <button
              type="button"
              onClick={saveAsQuickTemplate}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              title="Save current message as a quick template"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              Save Quick
            </button>
            
            <button
              type="button"
              onClick={() => setIsPlaceholderMenuOpen(!isPlaceholderMenuOpen)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Placeholder
            </button>
            
            {isPlaceholderMenuOpen && (
              <div className="absolute right-0 top-6 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                <div className="py-1">
                  {placeholders.map(placeholder => (
                    <button
                      key={placeholder.id}
                      onClick={() => insertPlaceholder(placeholder.value)}
                      className="flex justify-between w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span>{placeholder.label}</span>
                      <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{placeholder.value}</code>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Save template form */}
        {showSaveTemplate && (
          <div className="mb-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name"
                className="input flex-grow"
              />
              <button
                onClick={saveMessageTemplate}
                disabled={!templateName.trim() || !message.trim()}
                className="btn btn-sm btn-primary"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveTemplate(false);
                  setTemplateName('');
                }}
                className="btn btn-sm btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <textarea
          id="message"
          rows={4}
          className="input w-full"
          placeholder="Type your message here... Use placeholders like {{name}}"
          value={message}
          onChange={handleMessageChange}
          ref={messageInputRef}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Add placeholders that will be replaced with guest data when sending. 
          Example: &quot;Hello {{name}}, we&apos;d like to invite you to our event.&quot;
        </p>
      </div>

      {/* Message Preview Section */}
      {message && (
        <div className="mb-4 animate-slide-in-right">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Live Preview
            </h3>
            {selectedGuests.length > 0 && (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handlePrevPreview}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  disabled={selectedGuests.length <= 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {selectedGuests.length > 0 ? 
                    `Preview for ${previewGuest?.name || 'Guest'} (${previewIndex + 1}/${selectedGuests.length})` : 
                    'Select a guest to preview'
                  }
                </span>
                <button 
                  onClick={handleNextPreview}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  disabled={selectedGuests.length <= 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          <div className="whatsapp-preview mb-2">
            {selectedGuests.length > 0 ? (
              <div className="whitespace-pre-line">
                {previewMessage}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 italic">
                Select a guest to see a personalized preview
              </div>
            )}
          </div>
          
          {/* Placeholder Help Section - Only show if there's a guest selected */}
          {selectedGuests.length > 0 && (
            <div className="mt-3 text-xs border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800">
              <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">Available Placeholders:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {getPlaceholderExamples().map(example => (
                  <div key={example.original} className="flex justify-between">
                    <div className="flex items-center">
                      <code className="text-blue-600 dark:text-blue-400">{example.original}</code>
                      <span className="text-gray-400 mx-1">→</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 truncate" title={example.replaced}>
                      {example.replaced}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guest Selection */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium dark:text-white">
            Select Guests ({selectedGuests.length}/{guests.length})
          </h3>
          <button 
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            onClick={handleToggleSelectAll}
          >
            {isSelectAll ? 'Unselect All' : 'Select All with Phone Numbers'}
          </button>
        </div>
        
        <div className={`overflow-y-auto ${isMobile ? 'max-h-40' : 'max-h-60'} border border-gray-200 dark:border-gray-700 rounded-md p-2`}>
          {guests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No guests available in {selectedGroup ? selectedGroup.name : 'this group'}
            </p>
          ) : (
            <div className="space-y-2">
              {guests.map(guest => (
                <div 
                  key={guest._id} 
                  className={`p-2 rounded-md flex items-center justify-between ${
                    selectedGuests.some(g => g._id === guest._id) 
                      ? 'bg-blue-50 dark:bg-blue-900' 
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedGuests.some(g => g._id === guest._id)}
                      onChange={() => toggleGuestSelection(guest)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium dark:text-white">{guest.name}</span>
                  </div>
                  
                  {!guest.phone && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-red-500 dark:text-red-400">
                        Missing phone number
                      </span>
                      {onEditGuest && (
                        <button 
                          onClick={() => handleEditMissingPhone(guest)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Send Button */}
      <div className="flex justify-end">
        <button
          className="btn btn-primary"
          onClick={handleSendMessage}
          disabled={selectedGuests.length === 0 || !message.trim()}
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Send WhatsApp Messages
          </div>
        </button>
      </div>

      {/* Confirmation Modal for Guests Without Phone Numbers */}
      {confirmModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
              Missing Phone Numbers
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {guestsWithoutPhone.length === 1 
                ? "1 guest doesn't have a phone number:" 
                : `${guestsWithoutPhone.length} guests don't have phone numbers:`}
            </p>
            
            <div className="mb-4 max-h-40 overflow-y-auto">
              <ul className="list-disc pl-5 space-y-1">
                {guestsWithoutPhone.map(guest => (
                  <li key={guest._id} className="text-gray-600 dark:text-gray-400">
                    {guest.name}
                    {onEditGuest && (
                      <button 
                        onClick={() => handleEditMissingPhone(guest)}
                        className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setConfirmModalVisible(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                onClick={sendMessagesToSelectedGuests}
                className="btn btn-primary"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppMessageComposer;
