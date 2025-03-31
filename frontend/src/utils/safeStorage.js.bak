/**
 * Safe storage utilities to prevent mobile storage errors
 */

/**
 * Creates a safe wrapper around localStorage or sessionStorage
 * with error handling and fallbacks
 *
 * @param {Storage} storageType - localStorage or sessionStorage
 * @returns {Object} Safe storage API
 */
const createSafeStorage = (storageType = localStorage) => {
  // Fallback in-memory storage if browser storage is unavailable
  const memoryStorage = new Map();
  
  // Check if storage is available
  const isStorageAvailable = () => {
    try {
      const testKey = '__storage_test__';
      storageType.setItem(testKey, testKey);
      storageType.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  const storageAvailable = isStorageAvailable();
  
  if (!storageAvailable) {
    console.warn(`Browser ${storageType === localStorage ? 'localStorage' : 'sessionStorage'} is not available, using in-memory fallback.`);
  }
  
  return {
    /**
     * Safely get an item from storage
     *
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key not found
     * @returns {*} Stored value or default
     */
    getItem(key, defaultValue = null) {
      try {
        if (!key) return defaultValue;
        
        if (storageAvailable) {
          const item = storageType.getItem(key);
          
          if (item === null) return defaultValue;
          
          try {
            // Attempt to parse as JSON
            return JSON.parse(item);
          } catch (e) {
            // If not valid JSON, return as string
            return item;
          }
        } else {
          return memoryStorage.has(key) ? memoryStorage.get(key) : defaultValue;
        }
      } catch (error) {
        console.error(`Error getting item '${key}' from storage:`, error);
        return defaultValue;
      }
    },
    
    /**
     * Safely set an item in storage
     *
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    setItem(key, value) {
      try {
        if (!key) return false;
        
        const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
        
        if (storageAvailable) {
          storageType.setItem(key, valueToStore);
        } else {
          memoryStorage.set(key, value);
        }
        return true;
      } catch (error) {
        console.error(`Error setting item '${key}' in storage:`, error);
        
        // Try to store in memory as fallback
        try {
          memoryStorage.set(key, value);
          return true;
        } catch (fallbackError) {
          return false;
        }
      }
    },
    
    /**
     * Safely remove an item from storage
     *
     * @param {string} key - Storage key to remove
     * @returns {boolean} Success status
     */
    removeItem(key) {
      try {
        if (!key) return false;
        
        if (storageAvailable) {
          storageType.removeItem(key);
        } 
        
        // Always try memory storage too
        memoryStorage.delete(key);
        return true;
      } catch (error) {
        console.error(`Error removing item '${key}' from storage:`, error);
        return false;
      }
    },
    
    /**
     * Safely clear all items in storage
     *
     * @returns {boolean} Success status
     */
    clear() {
      try {
        if (storageAvailable) {
          storageType.clear();
        }
        
        memoryStorage.clear();
        return true;
      } catch (error) {
        console.error('Error clearing storage:', error);
        return false;
      }
    },
    
    /**
     * Safely get all keys in storage
     *
     * @returns {Array<string>} Array of storage keys
     */
    keys() {
      try {
        if (storageAvailable) {
          return Object.keys(storageType);
        }
        
        return Array.from(memoryStorage.keys());
      } catch (error) {
        console.error('Error getting storage keys:', error);
        return [];
      }
    },
    
    /**
     * Check if a key exists in storage
     *
     * @param {string} key - Key to check
     * @returns {boolean} Whether key exists
     */
    hasItem(key) {
      try {
        if (!key) return false;
        
        if (storageAvailable) {
          return storageType.getItem(key) !== null;
        }
        
        return memoryStorage.has(key);
      } catch (error) {
        console.error(`Error checking if key '${key}' exists:`, error);
        return false;
      }
    }
  };
};

// Create safe localStorage and sessionStorage wrappers
export const safeLocalStorage = createSafeStorage(localStorage);
export const safeSessionStorage = createSafeStorage(sessionStorage);

export default {
  local: safeLocalStorage,
  session: safeSessionStorage
};
