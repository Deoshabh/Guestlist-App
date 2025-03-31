/**
 * Generate a WhatsApp link with a prefilled message
 * @param {string} phone - The phone number (with country code but without + or spaces)
 * @param {string} template - The message template with placeholders
 * @param {string} name - The name to replace {{name}} placeholder with
 * @returns {string} WhatsApp link
 */
exports.generateWhatsAppLink = (phone, template, name) => {
  // Format phone number - remove any non-digit characters
  const formattedPhone = phone.replace(/\D/g, '');
  
  // If phone doesn't start with country code, assume Indian number and add 91
  const phoneWithCountryCode = formattedPhone.startsWith('91') 
    ? formattedPhone 
    : `91${formattedPhone}`;
  
  // Replace {{name}} placeholder with actual name
  const message = template.replace(/{{name}}/g, name);
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Generate the WhatsApp link
  return `https://wa.me/${phoneWithCountryCode}?text=${encodedMessage}`;
};
