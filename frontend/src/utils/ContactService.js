/**
 * ContactService - Provides functionality for integrating with device contacts
 */
class ContactService {
  /**
   * Check if the Contact Picker API is supported by the browser
   * @returns {boolean} True if supported, false otherwise
   */
  static isContactPickerSupported() {
    return 'contacts' in navigator && 'ContactsManager' in window;
  }

  /**
   * Open the contact picker and allow user to select contacts
   * @returns {Promise<Array>} Array of selected contacts
   */
  static async pickContacts() {
    if (!this.isContactPickerSupported()) {
      throw new Error('Contact Picker API not supported in this browser');
    }

    try {
      const props = ['name', 'email', 'tel'];
      const opts = { multiple: true };
      
      const contacts = await navigator.contacts.select(props, opts);
      return contacts;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        throw new Error('Permission to access contacts was denied');
      }
      throw err;
    }
  }

  /**
   * Format contacts from Contact Picker API to guest format
   * @param {Array} contacts - Contacts from the Contact Picker API
   * @param {boolean} isOnline - Whether the app is online
   * @returns {Array} Formatted guest objects
   */
  static formatContactsAsGuests(contacts, isOnline = true) {
    if (!contacts || !contacts.length) return [];

    return contacts.map(contact => {
      // Extract name parts
      let firstName = '', lastName = '';
      if (contact.name && contact.name.length > 0) {
        const nameParts = contact.name[0].split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Get first email and phone if available
      const email = contact.email && contact.email.length > 0 ? contact.email[0] : '';
      const phone = contact.tel && contact.tel.length > 0 ? contact.tel[0] : '';
      
      // Format into guest object
      return {
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: contact.name && contact.name.length > 0 ? contact.name[0] : '',
        firstName,
        lastName,
        email,
        phone,
        contact: phone || email || '',
        invited: false,
        // Set status based on online state
        status: isOnline ? 'Confirmed' : 'Pending',
        lastUpdated: new Date().toISOString()
      };
    });
  }
}

export default ContactService;
