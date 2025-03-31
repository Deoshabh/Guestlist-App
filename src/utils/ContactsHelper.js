/**
 * ContactsHelper - Utility for handling phonebook integration
 * Provides methods to access contact information across different platforms
 */

class ContactsHelper {
  /**
   * Check if the Contacts API is supported in this browser
   * @returns {boolean} True if supported
   */
  static isSupported() {
    return 'contacts' in navigator && 'ContactsManager' in window;
  }

  /**
   * Fallback method for browsers that don't support the Contacts API
   * @returns {Promise<Object|null>} Contact data or null if canceled
   */
  static async fallbackContactSelection() {
    // Create a simple file input method as fallback
    return new Promise((resolve) => {
      // Create temporary elements
      const modal = document.createElement('div');
      modal.className = 'contacts-fallback-modal';
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;';
      
      const modalContent = document.createElement('div');
      modalContent.style.cssText = 'background:white;padding:20px;border-radius:8px;width:90%;max-width:500px;';
      modalContent.innerHTML = `
        <h3 style="margin-top:0">Import Contact</h3>
        <p>Your browser doesn't support direct contacts access. Please enter contact details manually:</p>
        <div style="margin-bottom:15px">
          <label style="display:block;margin-bottom:5px">Name:</label>
          <input type="text" id="fallback-name" style="width:100%;padding:8px;box-sizing:border-box;" />
        </div>
        <div style="margin-bottom:15px">
          <label style="display:block;margin-bottom:5px">Phone:</label>
          <input type="tel" id="fallback-tel" style="width:100%;padding:8px;box-sizing:border-box;" />
        </div>
        <div style="margin-bottom:15px">
          <label style="display:block;margin-bottom:5px">Email:</label>
          <input type="email" id="fallback-email" style="width:100%;padding:8px;box-sizing:border-box;" />
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px">
          <button id="fallback-cancel" style="padding:8px 16px;background:#f1f1f1;border:none;border-radius:4px;cursor:pointer">Cancel</button>
          <button id="fallback-import" style="padding:8px 16px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">Import</button>
        </div>
      `;
      
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
      
      // Add event listeners
      document.getElementById('fallback-cancel').addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(null);
      });
      
      document.getElementById('fallback-import').addEventListener('click', () => {
        const contact = {
          name: document.getElementById('fallback-name').value,
          tel: document.getElementById('fallback-tel').value,
          email: document.getElementById('fallback-email').value
        };
        document.body.removeChild(modal);
        resolve(contact);
      });
    });
  }

  /**
   * Select a contact from the device's phonebook
   * @param {Array<string>} properties - Properties to request (e.g., ['name', 'email', 'tel'])
   * @returns {Promise<Object|null>} Contact data or null if selection was canceled
   */
  static async selectContact(properties = ['name', 'email', 'tel']) {
    try {
      // Check if Contacts API is supported
      if (!this.isSupported()) {
        console.log('Contacts API not supported, using fallback');
        return this.fallbackContactSelection();
      }

      // Request contact from the device
      const contacts = await navigator.contacts.select(properties, {multiple: false});
      
      if (!contacts || contacts.length === 0) {
        console.log('No contact selected');
        return null;
      }

      // Format the contact data for our application
      const contact = contacts[0];
      return this.formatContactData(contact);
    } catch (error) {
      console.error('Error selecting contact:', error);
      
      // If there's an error with the Contacts API, fall back to manual entry
      return this.fallbackContactSelection();
    }
  }

  /**
   * Format contact data into a structure our app can use
   * @param {Object} contact - The raw contact data
   * @returns {Object} Formatted contact data
   */
  static formatContactData(contact) {
    // Extract the first values from arrays or provide empty strings
    const name = contact.name && contact.name.length > 0 ? contact.name[0] : '';
    const email = contact.email && contact.email.length > 0 ? contact.email[0] : '';
    const phone = contact.tel && contact.tel.length > 0 ? contact.tel[0] : '';
    
    // Some contacts might have name as "Last, First" format, so let's handle that
    let firstName = '';
    let lastName = '';
    
    if (name.includes(',')) {
      const parts = name.split(',');
      lastName = parts[0].trim();
      firstName = parts[1].trim();
    } else {
      const parts = name.split(' ');
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }
    
    return {
      firstName,
      lastName,
      fullName: name,
      email,
      phone,
      // Original data for debugging
      _original: contact
    };
  }
}

export default ContactsHelper;
