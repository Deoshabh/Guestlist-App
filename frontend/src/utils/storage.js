/**
 * Consolidated storage utilities
 * Combines functionality from safeStorage.js, safeAccess.js, and db.js
 */

// Safe object property access utilities
export const safeAccess = {
  /**
   * Safely access a nested property of an object
   * @param {Object} obj - The object to access
   * @param {string|Array} path - The property path (e.g., 'user.profile.name' or ['user', 'profile', 'name'])
   * @param {*} defaultValue - The default value to return if the property doesn't exist
   * @returns {*} The property value or the default value
   */
  get(obj, path, defaultValue = null) {
    if (!obj) return defaultValue;
    
    const parts = Array.isArray(path) ? path : path.split('.');
    let result = obj;
    
    for (const part of parts) {
      if (result == null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[part];
    }
    
    return result === undefined ? defaultValue : result;
  },
  
  /**
   * Safely set a nested property of an object
   * @param {Object} obj - The object to modify
   * @param {string|Array} path - The property path
   * @param {*} value - The value to set
   * @returns {Object} The modified object
   */
  set(obj, path, value) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const parts = Array.isArray(path) ? path : path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || current[part] === null) {
        current[part] = {};
      }
      current = current[part];
    }
    
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
    
    return obj;
  }
};

// LocalStorage wrapper with error handling
export const localStorage = {
  /**
   * Get an item from localStorage
   * @param {string} key - The storage key
   * @param {*} defaultValue - The default value if the key doesn't exist or there's an error
   * @returns {*} The stored value or the default value
   */
  get(key, defaultValue = null) {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return defaultValue;
    }
  },
  
  /**
   * Set an item in localStorage
   * @param {string} key - The storage key
   * @param {*} value - The value to store
   * @returns {boolean} Whether the operation was successful
   */
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
      return false;
    }
  },
  
  /**
   * Remove an item from localStorage
   * @param {string} key - The storage key
   * @returns {boolean} Whether the operation was successful
   */
  remove(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  },
  
  /**
   * Clear all items from localStorage
   * @returns {boolean} Whether the operation was successful
   */
  clear() {
    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

// Database abstraction for more complex data storage
export const db = {
  _storeName: 'appData',
  _version: 1,
  _db: null,
  
  /**
   * Initialize the database
   * @returns {Promise} Promise that resolves when the database is ready
   */
  init() {
    return new Promise((resolve, reject) => {
      if (this._db) {
        resolve(this._db);
        return;
      }
      
      const request = indexedDB.open('appDatabase', this._version);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this._storeName)) {
          db.createObjectStore(this._storeName, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        this._db = event.target.result;
        resolve(this._db);
      };
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  },
  
  /**
   * Get an item from the database
   * @param {string} id - The item ID
   * @returns {Promise} Promise that resolves with the item or null
   */
  async get(id) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this._db.transaction([this._storeName], 'readonly');
        const store = transaction.objectStore(this._storeName);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error getting item ${id} from database:`, error);
      return null;
    }
  },
  
  /**
   * Save an item to the database
   * @param {Object} item - The item to save (must have an id property)
   * @returns {Promise} Promise that resolves when the item is saved
   */
  async save(item) {
    if (!item || !item.id) {
      throw new Error('Item must have an id property');
    }
    
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this._db.transaction([this._storeName], 'readwrite');
        const store = transaction.objectStore(this._storeName);
        const request = store.put(item);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error saving item to database:`, error);
      return false;
    }
  },
  
  /**
   * Remove an item from the database
   * @param {string} id - The item ID
   * @returns {Promise} Promise that resolves when the item is removed
   */
  async remove(id) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this._db.transaction([this._storeName], 'readwrite');
        const store = transaction.objectStore(this._storeName);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error removing item ${id} from database:`, error);
      return false;
    }
  }
};
