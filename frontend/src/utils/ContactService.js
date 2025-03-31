/**
 * ContactService - Provides functionality for integrating with device contacts
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
   * Format contacts from various sources into guest objects
   * Works with Contact Picker API, Google People API, and file imports
   * 
   * @param {Array} contacts - Contacts from any supported source
   * @param {boolean} isOnline - Whether the app is online
   * @returns {Array} Formatted guest objects
   */
  formatContactsAsGuests(contacts, isOnline = true) {
    if (!contacts || !contacts.length) return [];

    return contacts.map(contact => {
      // Extract name parts - handle both formats
      let firstName = contact.firstName || '';
      let lastName = contact.lastName || '';
      let fullName = contact.name || '';
      
      if (!fullName && (firstName || lastName)) {
        fullName = `${firstName} ${lastName}`.trim();
      }
      
      if (!firstName && !lastName && fullName) {
        const nameParts = fullName.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Get email - handle both formats
      const email = contact.email || 
                   (contact.emailAddresses && contact.emailAddresses.length ? 
                    (typeof contact.emailAddresses[0] === 'string' ? contact.emailAddresses[0] : contact.emailAddresses[0].value) : '');
      
      // Get phone - handle both formats
      const phone = contact.phone || 
                   (contact.tel && contact.tel.length ? 
                    (typeof contact.tel[0] === 'string' ? contact.tel[0] : contact.tel[0].value) : '');
      
      // Format into guest object with required fields
      return {
        _id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: fullName,
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
