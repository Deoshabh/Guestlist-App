/**
 * Service for Google People API integration
 * Handles OAuth flow and contact fetching
 */
import axios from 'axios';

// Configuration for Google OAuth
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '148710439418-f1r3q8rmpaunu30bvc0i69e0vpsr8gm2.apps.googleusercontent.com'; 
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/contacts.readonly';
// Use the authorized JavaScript origins from your OAuth client configuration
const AUTHORIZED_ORIGIN = 'http://bhavyasangh.com';

class GooglePeopleService {
  /**
   * Initialize Google OAuth client
   */
  static init() {
    if (window.gapi) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: GOOGLE_CLIENT_ID,
            scope: GOOGLE_SCOPE,
            // Make sure cookiepolicy matches your domain structure
            cookiepolicy: 'single_host_origin',
            // Include the ux_mode to match your setup
            ux_mode: 'popup'
          }).then(resolve, reject);
        });
      };
      
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  /**
   * Start the OAuth flow for Google
   * @returns {Promise<string>} The access token
   */
  static async authorize() {
    try {
      await this.init();
      
      const auth2 = window.gapi.auth2.getAuthInstance();
      const user = await auth2.signIn({
        prompt: 'select_account',
        // Add authentication parameters to ensure proper flow
        hosted_domain: window.location.hostname,
        // Use the popup flow for better mobile experience
        ux_mode: 'popup'
      });
      
      const authResponse = user.getAuthResponse();
      return authResponse.access_token;
    } catch (error) {
      console.error('Google auth error:', error);
      if (error.error === 'popup_blocked_by_browser') {
        throw new Error('Popup blocked. Please allow popups for this site.');
      } else if (error.error === 'access_denied') {
        throw new Error('Access denied. Please grant permission to access your contacts.');
      } else if (error.error === 'immediate_failed') {
        throw new Error('Authentication failed. Please try again.');
      } else {
        throw new Error('Failed to authenticate with Google: ' + (error.error || 'Unknown error'));
      }
    }
  }

  /**
   * Fetch contacts from Google People API
   * @param {string} accessToken - The OAuth access token
   * @returns {Promise<Array>} - The contacts from Google
   */
  static async fetchContacts(accessToken) {
    try {
      const response = await axios.get('https://people.googleapis.com/v1/people/me/connections', {
        params: {
          personFields: 'names,emailAddresses,phoneNumbers',
          pageSize: 100
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      return this.parseContacts(response.data.connections || []);
    } catch (error) {
      console.error('Error fetching Google contacts:', error);
      
      // Handle specific API errors
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Authentication expired. Please try again.');
        } else if (error.response.status === 403) {
          throw new Error('Permission denied to access your contacts.');
        }
      }
      
      throw new Error('Failed to fetch contacts from Google');
    }
  }

  /**
   * Parse contacts from Google People API format
   * @param {Array} connections - The connections from Google People API
   * @returns {Array} - Parsed contacts in our app's format
   */
  static parseContacts(connections) {
    return connections.map(person => {
      // Extract name information
      const nameInfo = person.names && person.names.length > 0 ? person.names[0] : null;
      const name = nameInfo ? nameInfo.displayName : 'Unknown';
      const firstName = nameInfo ? nameInfo.givenName || '' : '';
      const lastName = nameInfo ? nameInfo.familyName || '' : '';
      
      // Extract contact information
      const emails = person.emailAddresses || [];
      const phones = person.phoneNumbers || [];
      
      // Format to match expected structure for our app
      return {
        name,
        firstName,
        lastName,
        email: emails.length > 0 ? emails[0].value : '',
        phone: phones.length > 0 ? phones[0].value : '',
        // Format to match existing ContactsHelper output format
        tel: phones.length > 0 ? [phones[0].value] : [],
        emailAddresses: emails.length > 0 ? [emails[0].value] : []
      };
    });
  }
}

export default GooglePeopleService;
