/**
 * Service to handle phonebook/contacts integration
 */
export default class ContactService {
  /**
   * Check if the Contact Picker API is available in this browser
   * @returns {boolean} True if the API is supported
   */
  static isContactPickerSupported() {
    return 'contacts' in navigator && 'ContactsManager' in window;
  }

  /**
   * Opens the device contact picker and returns selected contacts
   * @param {object} options Configuration options
   * @returns {Promise<Array>} Selected contacts
   */
  static async pickContacts(options = { multiple: true }) {
    if (!this.isContactPickerSupported()) {
      throw new Error('Contact Picker API is not supported in this browser');
    }

    try {
      const props = ['name', 'email', 'tel'];
      const opts = { multiple: options.multiple };
      
      const contacts = await navigator.contacts.select(props, opts);
      return contacts.map(contact => ({
        name: contact.name?.[0] || '',
        email: contact.email?.[0] || '',
        phone: contact.tel?.[0] || '',
      }));
    } catch (error) {
      console.error('Error picking contacts:', error);
      throw error;
    }
  }

  /**
   * Formats contacts into the guest data structure
   * @param {Array} contacts Raw contact data
   * @returns {Array} Formatted guest data
   */
  static formatContactsAsGuests(contacts) {
    return contacts.map(contact => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      status: 'Pending',
      lastUpdated: new Date().toISOString()
    }));
  }
}
