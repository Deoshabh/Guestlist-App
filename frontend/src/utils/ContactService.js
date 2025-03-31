/**
 * ContactService - Utility for handling device contacts integration
 * This service provides methods to check support and interact with the
 * Contact Picker API, with appropriate fallbacks.
 * This is a frontend utility and should be placed in the frontend src/utils directory
 */
const ContactService = {
  /**
   * Check if the Contact Picker API is supported in this browser
   * @returns {boolean} true if the Contact Picker API is supported
   */
  isContactPickerSupported() {
    return 'contacts' in navigator && 'ContactsManager' in window;
  },

  /**
   * Open the device contacts picker and allow user to select multiple contacts
   * @returns {Promise<Array>} The selected contacts
   */
  async pickContacts() {
    if (!this.isContactPickerSupported()) {
      throw new Error('Contact Picker API is not supported in this browser');
    }

    try {
      // Request contacts with specific properties
      const props = ['name', 'email', 'tel'];
      const opts = { multiple: true };
      
      // Open the contact picker
      const contacts = await navigator.contacts.select(props, opts);
      return contacts;
    } catch (err) {
      console.error('Error picking contacts:', err);
      if (err.name === 'SecurityError') {
        throw new Error('Permission to access contacts was denied');
      } else if (err.name === 'InvalidStateError') {
        throw new Error('Contact picker is already showing');
      } else {
        throw new Error('Failed to access contacts: ' + (err.message || 'Unknown error'));
      }
    }
  },

  /**
   * Format device contacts into guest objects ready for the application
   * @param {Array} contacts Array of contacts from the Contact Picker API
   * @returns {Array} Formatted guest objects
   */
  formatContactsAsGuests(contacts) {
    if (!contacts || !contacts.length) return [];

    return contacts.map(contact => {
      // Get the first name, email and phone available
      const name = contact.name && contact.name[0] ? contact.name[0] : 'Unknown';
      const email = contact.email && contact.email[0] ? contact.email[0] : '';
      const phone = contact.tel && contact.tel[0] ? contact.tel[0] : '';

      // Create a temporary ID that will be replaced when saved
      return {
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name,
        contact: phone || email, // Use phone as primary contact, fall back to email
        email, // Additional data we'll save for reference
        phone, // Additional data we'll save for reference
        invited: false,
        _pendingSync: true,
        createdAt: new Date().toISOString()
      };
    });
  },

  /**
   * Fallback method to manually enter contact information
   * @returns {Object} A blank guest object template
   */
  createEmptyGuest() {
    return {
      id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: '',
      contact: '',
      email: '',
      phone: '',
      invited: false,
      _pendingSync: true,
      createdAt: new Date().toISOString()
    };
  }
};

export default ContactService;
