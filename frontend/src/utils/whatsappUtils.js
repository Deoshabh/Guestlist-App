/**
 * Utilities for WhatsApp message handling and URL generation
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
 * Generate a WhatsApp URL for opening directly in the app/web
 * @param {string} phone - Phone number to message (should not include the + prefix)
 * @param {string} message - Message text, will be URL encoded
 * @returns {string} WhatsApp URL
 */
export const generateWhatsAppUrl = (phone, message = '') => {
  // Normalize phone number - remove spaces, dashes, brackets, and +
  const normalizedPhone = phone.replace(/[\s\-()]/g, '');
  
  // URL encode the message
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
};

/**
 * Open WhatsApp chat with given phone number and message
 * @param {string|Object} recipient - Phone number or guest object
 * @param {string} messageTemplate - Message template with placeholders: {{name}}, {{phone}}, etc
 * @param {Object} options - Additional options
 * @returns {boolean} Success status
 */
export const openWhatsAppChat = (recipient, messageTemplate = '', options = {}) => {
  try {
    let phone, message;
    
    // Handle recipient as guest object
    if (typeof recipient === 'object') {
      const { name, phone: guestPhone } = recipient;
      
      if (!guestPhone) {
        console.error('No phone number found for guest', recipient);
        return false;
      }
      
      phone = guestPhone;
      
      // Replace placeholders in template
      message = messageTemplate.replace(/{{name}}/g, name || 'Guest')
                              .replace(/{{phone}}/g, guestPhone || '')
                              .replace(/{{email}}/g, recipient.email || '');
      
      // Handle additional fields if provided
      if (recipient.groupId && options.guestGroups) {
        const group = options.guestGroups.find(g => g._id === recipient.groupId);
        if (group) {
          message = message.replace(/{{group}}/g, group.name || 'Unknown Group');
        }
      }
    } else {
      // Handle recipient as plain phone number
      phone = recipient;
      message = messageTemplate;
    }
    
    // Generate and open URL
    const whatsappUrl = generateWhatsAppUrl(phone, message);
    window.open(whatsappUrl, '_blank');
    
    return true;
  } catch (error) {
    console.error('Error opening WhatsApp chat:', error);
    return false;
  }
};

/**
 * Format a phone number for display
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's valid
  if (cleaned.length < 10) return phone;
  
  // Format based on length
  if (cleaned.length === 10) {
    // US format: (xxx) xxx-xxxx
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  } else if (cleaned.length > 10) {
    // International format
    const countryCode = cleaned.substring(0, cleaned.length - 10);
    const areaCode = cleaned.substring(cleaned.length - 10, cleaned.length - 7);
    const firstPart = cleaned.substring(cleaned.length - 7, cleaned.length - 4);
    const lastPart = cleaned.substring(cleaned.length - 4);
    
    return `+${countryCode} (${areaCode}) ${firstPart}-${lastPart}`;
  }
  
  return phone;
};

/**
 * Check if a phone number is valid
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid
 */
export const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  
  // Remove formatting
  const cleaned = phone.replace(/\D/g, '');
  
  // Basic validation - at least 10 digits
  return cleaned.length >= 10;
};

export default {
  formatPhoneForWhatsApp,
  formatMessageWithPlaceholders,
  generateWhatsAppUrl,
  openWhatsAppChat,
  formatPhoneNumber,
  isValidPhoneNumber
};
