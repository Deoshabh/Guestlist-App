/**
 * ContactService for handling device contacts integration
 */
import { saveContact, getContacts } from '../utils/db';
import ContactsHelper from '../utils/ContactsHelper';

const ContactService = {
  /**
   * Check if the Contact Picker API is supported in this browser
   */
  isContactPickerSupported() {
    return ContactsHelper.isSupported();
  },

  /**
   * Open the device contacts picker and allow user to select multiple contacts
   */
  async pickContacts() {
    try {
      const contacts = await ContactsHelper.selectMultipleContacts(['name', 'email', 'tel']);
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
      return {
        id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: contact.fullName || 'Unknown',
        email: contact.email || '',
        phone: contact.phone || '',
        status: 'Pending',
        lastUpdated: new Date().toISOString()
      };
    });
  },
  
  /**
   * Save contacts to the IndexedDB
   */
  async saveContactsToDB(contacts) {
    const savedContacts = [];
    for (const contact of contacts) {
      const savedContact = await saveContact(contact);
      savedContacts.push(savedContact);
    }
    return savedContacts;
  },
  
  /**
   * Get all contacts from the database
   */
  async getAllContacts() {
    return await getContacts();
  }
};

export default ContactService;
