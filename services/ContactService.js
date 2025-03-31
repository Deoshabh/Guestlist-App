/**
 * ContactService for handling device contacts integration
 */
const ContactService = {
  /**
   * Check if the Contact Picker API is supported in this browser
   */
  isContactPickerSupported() {
    return 'contacts' in navigator && 'ContactsManager' in window;
  },

  /**
   * Open the device contacts picker and allow user to select multiple contacts
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
   */
  formatContactsAsGuests(contacts) {
    if (!contacts || !contacts.length) return [];

    return contacts.map(contact => {
      // Get the first name, email and phone available
      const name = contact.name && contact.name[0] ? contact.name[0] : 'Unknown';
      const email = contact.email && contact.email[0] ? contact.email[0] : '';
      const phone = contact.tel && contact.tel[0] ? contact.tel[0] : '';

      return {
        id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        email,
        phone,
        status: 'Pending',
        lastUpdated: new Date().toISOString()
      };
    });
  }
};

export default ContactService;
