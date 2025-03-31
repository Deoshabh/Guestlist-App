/**
 * Utility functions for WhatsApp message handling
 */

/**
 * Format a phone number for WhatsApp API
 * Removes any non-numeric characters and adds country code if needed
 * 
 * @param {string} phoneNumber - The phone number to format
 * @param {string} defaultCountryCode - The default country code to add if missing (default: '91' for India)
 * @returns {string} Formatted phone number for WhatsApp API
 */
export const formatPhoneForWhatsApp = (phoneNumber, defaultCountryCode = '91') => {
  if (!phoneNumber) return '';
  
  // Remove all non-numeric characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If number doesn't start with +, add default country code
  if (!phoneNumber.startsWith('+')) {
    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, '');
    
    // If number doesn't start with country code, add it
    if (cleaned.length <= 10) {
      cleaned = defaultCountryCode + cleaned;
    }
  } else {
    // If starts with +, just remove the +
    cleaned = cleaned.replace(/^\+/, '');
  }
  
  return cleaned;
};

/**
 * Replace placeholders in a message template with actual guest data
 * 
 * @param {string} messageTemplate - The message template with placeholders
 * @param {Object} guest - The guest object with data to replace placeholders
 * @param {Object} options - Additional options (like group info)
 * @returns {string} The formatted message with placeholders replaced
 */
export const formatMessageWithPlaceholders = (messageTemplate, guest, options = {}) => {
  if (!guest || !messageTemplate) return messageTemplate || '';
  
  const { guestGroups = [] } = options;
  
  let formatted = messageTemplate;
  
  // Replace common placeholders
  formatted = formatted.replace(/{{name}}/g, guest.name || 'Guest');
  
  // Add first name placeholder
  const firstName = guest.name ? guest.name.split(' ')[0] : 'Guest';
  formatted = formatted.replace(/{{firstname}}/g, firstName);
  
  formatted = formatted.replace(/{{email}}/g, guest.email || '');
  formatted = formatted.replace(/{{phone}}/g, guest.phone || '');
  
  // Replace group name if available
  if (guest.groupId && guestGroups.length > 0) {
    const groupName = guestGroups.find(g => g._id === guest.groupId)?.name || '';
    formatted = formatted.replace(/{{group}}/g, groupName);
  } else {
    formatted = formatted.replace(/{{group}}/g, '');
  }
  
  // Replace date and time placeholders
  const now = new Date();
  formatted = formatted.replace(/{{date}}/g, now.toLocaleDateString());
  formatted = formatted.replace(/{{time}}/g, now.toLocaleTimeString());
  
  // Replace other dynamic placeholders
  formatted = formatted.replace(/{{year}}/g, now.getFullYear().toString());
  formatted = formatted.replace(/{{month}}/g, (now.getMonth() + 1).toString());
  formatted = formatted.replace(/{{day}}/g, now.getDate().toString());
  
  return formatted;
};

/**
 * Generate a WhatsApp API URL for sending a message
 * 
 * @param {Object} guest - The guest to send the message to
 * @param {string} messageTemplate - The message template with placeholders
 * @param {Object} options - Additional options
 * @returns {string} WhatsApp API URL for opening chat with prefilled message
 */
export const generateWhatsAppURL = (guest, messageTemplate, options = {}) => {
  if (!guest || !guest.phone) return null;
  
  const formattedPhone = formatPhoneForWhatsApp(guest.phone);
  const personalizedMessage = formatMessageWithPlaceholders(messageTemplate, guest, options);
  
  // Encode the message for a URL
  const encodedMessage = encodeURIComponent(personalizedMessage);
  
  // Generate the WhatsApp API URL
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
};

/**
 * Open WhatsApp with a prepared message
 * 
 * @param {Object} guest - The guest to send a message to
 * @param {string} messageTemplate - The message template
 * @param {Object} options - Additional options
 * @returns {boolean} True if successful, false otherwise
 */
export const openWhatsAppChat = (guest, messageTemplate, options = {}) => {
  try {
    if (!guest || !guest.phone) {
      console.error('Cannot open WhatsApp: Guest has no phone number');
      return false;
    }
    
    const whatsappURL = generateWhatsAppURL(guest, messageTemplate, options);
    
    if (!whatsappURL) {
      console.error('Failed to generate WhatsApp URL');
      return false;
    }
    
    // Open in a new tab
    window.open(whatsappURL, '_blank');
    return true;
  } catch (error) {
    console.error('Error opening WhatsApp chat:', error);
    return false;
  }
};
