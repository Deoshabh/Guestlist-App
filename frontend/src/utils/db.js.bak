// IndexedDB wrapper for offline data storage

// Database configuration
const DB_NAME = 'guest-manager-db';
const DB_VERSION = 3; // Incrementing version to trigger schema updates

// Standardize store names to avoid mismatches between different files
const STORES = {
  GUESTS: 'guests',
  PENDING_ACTIONS: 'actionQueue',
  GUEST_GROUPS: 'groups', // Changed from 'guestGroups' to match 'groups' in dbSetup.js
  MESSAGE_TEMPLATES: 'messageTemplates',
  CONTACTS: 'contacts'
};

// Initialize the database with safe error handling
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Database initialization error:', event.target.error);
      reject(`Database error: ${event.target.error}`);
    };
    
    request.onsuccess = (event) => {
      console.log('Database initialized successfully');
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log(`Upgrading database from version ${event.oldVersion} to ${event.newVersion}`);
      
      // Create object stores if they don't exist
      // Using consistent store names from STORES object
      if (!db.objectStoreNames.contains(STORES.GUESTS)) {
        console.log(`Creating ${STORES.GUESTS} store`);
        const guestStore = db.createObjectStore(STORES.GUESTS, { keyPath: '_id' });
        guestStore.createIndex('groupId', 'groupId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
        console.log(`Creating ${STORES.PENDING_ACTIONS} store`);
        const pendingStore = db.createObjectStore(STORES.PENDING_ACTIONS, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        pendingStore.createIndex('action', 'action', { unique: false });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.GUEST_GROUPS)) {
        console.log(`Creating ${STORES.GUEST_GROUPS} store`);
        const groupStore = db.createObjectStore(STORES.GUEST_GROUPS, { keyPath: '_id' });
        groupStore.createIndex('by_name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MESSAGE_TEMPLATES)) {
        console.log(`Creating ${STORES.MESSAGE_TEMPLATES} store`);
        db.createObjectStore(STORES.MESSAGE_TEMPLATES, { keyPath: '_id' });
      }

      if (!db.objectStoreNames.contains(STORES.CONTACTS)) {
        console.log(`Creating ${STORES.CONTACTS} store`);
        const contactStore = db.createObjectStore(STORES.CONTACTS, { keyPath: '_id' });
        contactStore.createIndex('name', 'name', { unique: false });
        contactStore.createIndex('email', 'email', { unique: false });
        contactStore.createIndex('phone', 'phone', { unique: false });
      }
    };
  });
};

// Safe transaction helper to verify object store exists before transaction
const safeTransaction = async (storeName, mode, callback) => {
  try {
    const db = await initDB();
    
    // Check if the object store exists
    if (!db.objectStoreNames.contains(storeName)) {
      console.error(`Object store "${storeName}" does not exist`);
      throw new Error(`Object store "${storeName}" does not exist. DB schema may be outdated.`);
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      
      transaction.oncomplete = () => {
        console.log(`Transaction on ${storeName} completed successfully`);
      };
      
      transaction.onerror = (event) => {
        console.error(`Transaction error on ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
      
      try {
        callback(store, resolve, reject, transaction);
      } catch (error) {
        console.error('Error in transaction callback:', error);
        reject(error);
      }
    });
  } catch (error) {
    console.error('Safe transaction failed:', error);
    // Try to help the user by checking if the database needs to be rebuilt
    if (error.name === 'NotFoundError' || 
        (error.message && error.message.includes('object store') && error.message.includes('does not exist'))) {
      // This might be a schema version mismatch
      if (confirm('Database schema is outdated. Would you like to reset the database to fix this issue?')) {
        await resetDatabase();
        alert('Database has been reset. The page will now reload.');
        window.location.reload();
      }
    }
    throw error;
  }
};

// Helper function to reset the database when schema issues are detected
const resetDatabase = async () => {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    
    deleteRequest.onsuccess = () => {
      console.log('Database deleted successfully');
      resolve(true);
    };
    
    deleteRequest.onerror = (event) => {
      console.error('Error deleting database:', event.target.error);
      reject(event.target.error);
    };
    
    deleteRequest.onblocked = () => {
      console.warn('Database deletion blocked');
      alert('Please close all other tabs with this app open, then try again.');
      reject(new Error('Database deletion blocked'));
    };
  });
};

// Get all guests from local database using the safe transaction helper
const getAllGuests = async () => {
  try {
    return await safeTransaction(STORES.GUESTS, 'readonly', (store, resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        console.log(`Retrieved ${request.result.length} guests from IndexedDB`);
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Error getting guests:', event.target.error);
        reject(`Error getting guests: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error('Error in getAllGuests:', error);
    // Return empty array as fallback to prevent UI errors
    return [];
  }
};

// Save guests to local database with improved error handling
const saveGuests = async (guests) => {
  if (!Array.isArray(guests)) {
    console.error('saveGuests expects an array of guests');
    return false;
  }
  
  try {
    return await safeTransaction(STORES.GUESTS, 'readwrite', (store, resolve, reject) => {
      // Clear existing guests
      store.clear();
      
      // Add all guests
      let successCount = 0;
      const promises = guests.map(guest => new Promise((res, rej) => {
        if (!guest._id) {
          console.warn('Guest missing _id, generating one:', guest);
          guest._id = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
        
        const request = store.add(guest);
        
        request.onsuccess = () => {
          successCount++;
          res();
        };
        
        request.onerror = (event) => {
          console.error('Error adding guest:', guest, event.target.error);
          rej(event.target.error);
        };
      }));
      
      Promise.allSettled(promises).then(results => {
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`Saved ${successCount} guests, ${failed} failed`);
        resolve(successCount);
      }).catch(error => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error in saveGuests:', error);
    return false;
  }
};

// Save a single guest
const saveGuest = async (guest) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.GUESTS], 'readwrite');
    const store = transaction.objectStore(STORES.GUESTS);
    const request = store.put(guest);
    
    request.onsuccess = () => {
      resolve(guest);
    };
    
    request.onerror = (event) => {
      reject(`Error saving guest: ${event.target.error}`);
    };
  });
};

// Queue an action for later sync when offline
const queueAction = async (action, data) => {
  try {
    return await safeTransaction(STORES.PENDING_ACTIONS, 'readwrite', (store, resolve, reject) => {
      const request = store.add({
        action,
        data,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });
      
      request.onsuccess = () => {
        console.log(`Action ${action} queued successfully`);
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error(`Error queueing action ${action}:`, event.target.error);
        reject(`Error queueing action: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error('Error in queueAction:', error);
    return false;
  }
};

// Get all pending actions for sync
const getPendingActions = async () => {
  try {
    return await safeTransaction(STORES.PENDING_ACTIONS, 'readonly', (store, resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        console.log(`Retrieved ${request.result.length} pending actions`);
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Error getting pending actions:', event.target.error);
        reject(`Error getting pending actions: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error('Error in getPendingActions:', error);
    return [];
  }
};

// Mark pending action as completed or failed
const updatePendingAction = async (id, status, result = null) => {
  try {
    return await safeTransaction(STORES.PENDING_ACTIONS, 'readwrite', (store, resolve, reject) => {
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (!action) {
          reject(`Pending action with ID ${id} not found`);
          return;
        }
        
        action.status = status;
        action.result = result;
        action.processedAt = new Date().toISOString();
        
        const updateRequest = store.put(action);
        
        updateRequest.onsuccess = () => {
          resolve(true);
        };
        
        updateRequest.onerror = (event) => {
          reject(`Error updating pending action: ${event.target.error}`);
        };
      };
      
      getRequest.onerror = (event) => {
        reject(`Error getting pending action: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error('Error in updatePendingAction:', error);
    return false;
  }
};

// Remove a pending action after it's been processed
const removePendingAction = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_ACTIONS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_ACTIONS);
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    request.onerror = (event) => {
      reject(`Error removing pending action: ${event.target.error}`);
    };
  });
};

// Get all guest groups
const getGroups = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.GUEST_GROUPS], 'readonly');
      const store = transaction.objectStore(STORES.GUEST_GROUPS);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting groups from IndexedDB:', error);
    return [];
  }
};

// Save a guest group
const saveGroup = async (group) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.GUEST_GROUPS], 'readwrite');
      const store = transaction.objectStore(STORES.GUEST_GROUPS);
      const request = store.put(group);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error saving group to IndexedDB:', error);
    throw error;
  }
};

// Save multiple guest groups
const saveGroups = async (groups) => {
  if (!Array.isArray(groups) || groups.length === 0) return;
  
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.GUEST_GROUPS], 'readwrite');
    const store = transaction.objectStore(STORES.GUEST_GROUPS);
    
    // Clear existing groups first
    await new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = resolve;
      clearRequest.onerror = reject;
    });
    
    // Add all groups
    const promises = groups.map(group => 
      new Promise((resolve, reject) => {
        const request = store.add(group);
        request.onsuccess = resolve;
        request.onerror = reject;
      })
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error saving groups to IndexedDB:', error);
    throw error;
  }
};

// Delete a guest group
const deleteGroup = async (groupId) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.GUEST_GROUPS], 'readwrite');
      const store = transaction.objectStore(STORES.GUEST_GROUPS);
      const request = store.delete(groupId);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error deleting group from IndexedDB:', error);
    throw error;
  }
};

// Add these functions to support WhatsApp message templates

/**
 * Save a message template to IndexedDB
 * 
 * @param {Object} template - The message template to save
 * @returns {Promise<Object>} The saved template with an ID
 */
const saveMessageTemplate = async (template) => {
  const db = await initDB();
  try {
    const tx = db.transaction(STORES.MESSAGE_TEMPLATES, 'readwrite');
    const store = tx.objectStore(STORES.MESSAGE_TEMPLATES);
    
    // Generate an ID if one doesn't exist
    if (!template._id) {
      template._id = `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    await store.put(template);
    await tx.done;
    
    return template;
  } catch (error) {
    console.error('Error saving message template:', error);
    throw error;
  }
};

/**
 * Get all message templates from IndexedDB
 * 
 * @returns {Promise<Array>} Array of message templates
 */
const getAllMessageTemplates = async () => {
  const db = await initDB();
  try {
    const tx = db.transaction(STORES.MESSAGE_TEMPLATES, 'readonly');
    const store = tx.objectStore(STORES.MESSAGE_TEMPLATES);
    
    const templates = await store.getAll();
    
    // Sort by creation date (newest first)
    return templates.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  } catch (error) {
    console.error('Error getting message templates:', error);
    throw error;
  }
};

/**
 * Get a message template by ID
 * 
 * @param {string} id - The template ID
 * @returns {Promise<Object>} The message template
 */
const getMessageTemplateById = async (id) => {
  const db = await initDB();
  try {
    const tx = db.transaction(STORES.MESSAGE_TEMPLATES, 'readonly');
    const store = tx.objectStore(STORES.MESSAGE_TEMPLATES);
    
    return await store.get(id);
  } catch (error) {
    console.error('Error getting message template:', error);
    throw error;
  }
};

/**
 * Delete a message template
 * 
 * @param {string} id - The template ID to delete
 * @returns {Promise<void>}
 */
const deleteMessageTemplate = async (id) => {
  const db = await initDB();
  try {
    const tx = db.transaction(STORES.MESSAGE_TEMPLATES, 'readwrite');
    const store = tx.objectStore(STORES.MESSAGE_TEMPLATES);
    
    await store.delete(id);
    await tx.done;
  } catch (error) {
    console.error('Error deleting message template:', error);
    throw error;
  }
};

// Save contact to IndexedDB
const saveContact = async (contact) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CONTACTS], 'readwrite');
    const store = transaction.objectStore(STORES.CONTACTS);
    
    // Generate unique ID if not provided
    if (!contact._id) {
      contact._id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const request = store.put(contact);
    
    request.onsuccess = () => {
      resolve(contact);
    };
    
    request.onerror = (event) => {
      reject(`Error saving contact: ${event.target.error}`);
    };
  });
};

// Get all contacts from IndexedDB
const getContacts = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CONTACTS], 'readonly');
    const store = transaction.objectStore(STORES.CONTACTS);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      reject(`Error getting contacts: ${event.target.error}`);
    };
  });
};

// Export these functions as named exports to fix import errors
export { saveContact, getContacts };

// Define a named const before exporting to avoid anonymous default export warning
const dbOperations = {
  getAllGuests,
  saveGuests,
  saveGuest,
  queueAction,
  getPendingActions,
  removePendingAction,
  getGroups,
  saveGroup,
  saveGroups,
  deleteGroup,
  saveMessageTemplate,
  getAllMessageTemplates,
  getMessageTemplateById,
  deleteMessageTemplate,
  saveContact,
  getContacts
};

export default dbOperations;
```
</copilot-edited-file>  ## Step-by-Step Solution:

1. First, I'll fix the IndexedDB initialization to ensure all required object stores exist
2. Then, I'll add safe transaction handling with store existence checks
3. Next, I'll create a utility to help fix the `getGuests` function error
4. Finally, I'll enhance the API error handling specifically for guest groups

### [db.js](file:///c%3A/Users/gagan/Desktop/guest/frontend/src/utils/db.js)

Let's update the db.js file to fix the IndexedDB schema issues and add safer transaction handling:


</changeDescription>

This is the code block that represents the suggested code change:
```javascript
// IndexedDB wrapper for offline data storage

// Database configuration
const DB_NAME = 'guest-manager-db';
const DB_VERSION = 3; // Incrementing version to trigger schema updates

// Standardize store names to avoid mismatches between different files
const STORES = {
  GUESTS: 'guests',
  PENDING_ACTIONS: 'actionQueue',
  GUEST_GROUPS: 'groups', // Changed from 'guestGroups' to match 'groups' in dbSetup.js
  MESSAGE_TEMPLATES: 'messageTemplates',
  CONTACTS: 'contacts'
};

// Initialize the database with safe error handling
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Database initialization error:', event.target.error);
      reject(`Database error: ${event.target.error}`);
    };
    
    request.onsuccess = (event) => {
      console.log('Database initialized successfully');
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log(`Upgrading database from version ${event.oldVersion} to ${event.newVersion}`);
      
      // Create object stores if they don't exist
      // Using consistent store names from STORES object
      if (!db.objectStoreNames.contains(STORES.GUESTS)) {
        console.log(`Creating ${STORES.GUESTS} store`);
        const guestStore = db.createObjectStore(STORES.GUESTS, { keyPath: '_id' });
        guestStore.createIndex('groupId', 'groupId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
        console.log(`Creating ${STORES.PENDING_ACTIONS} store`);
        const pendingStore = db.createObjectStore(STORES.PENDING_ACTIONS, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        pendingStore.createIndex('action', 'action', { unique: false });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.GUEST_GROUPS)) {
        console.log(`Creating ${STORES.GUEST_GROUPS} store`);
        const groupStore = db.createObjectStore(STORES.GUEST_GROUPS, { keyPath: '_id' });
        groupStore.createIndex('by_name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MESSAGE_TEMPLATES)) {
        console.log(`Creating ${STORES.MESSAGE_TEMPLATES} store`);
        db.createObjectStore(STORES.MESSAGE_TEMPLATES, { keyPath: '_id' });
      }

      if (!db.objectStoreNames.contains(STORES.CONTACTS)) {
        console.log(`Creating ${STORES.CONTACTS} store`);
        const contactStore = db.createObjectStore(STORES.CONTACTS, { keyPath: '_id' });
        contactStore.createIndex('name', 'name', { unique: false });
        contactStore.createIndex('email', 'email', { unique: false });
        contactStore.createIndex('phone', 'phone', { unique: false });
      }
    };
  });
};

// Safe transaction helper to verify object store exists before transaction
const safeTransaction = async (storeName, mode, callback) => {
  try {
    const db = await initDB();
    
    // Check if the object store exists
    if (!db.objectStoreNames.contains(storeName)) {
      console.error(`Object store "${storeName}" does not exist`);
      throw new Error(`Object store "${storeName}" does not exist. DB schema may be outdated.`);
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      
      transaction.oncomplete = () => {
        console.log(`Transaction on ${storeName} completed successfully`);
      };
      
      transaction.onerror = (event) => {
        console.error(`Transaction error on ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
      
      try {
        callback(store, resolve, reject, transaction);
      } catch (error) {
        console.error('Error in transaction callback:', error);
        reject(error);
      }
    });
  } catch (error) {
    console.error('Safe transaction failed:', error);
    // Try to help the user by checking if the database needs to be rebuilt
    if (error.name === 'NotFoundError' || 
        (error.message && error.message.includes('object store') && error.message.includes('does not exist'))) {
      // This might be a schema version mismatch
      if (confirm('Database schema is outdated. Would you like to reset the database to fix this issue?')) {
        await resetDatabase();
        alert('Database has been reset. The page will now reload.');
        window.location.reload();
      }
    }
    throw error;
  }
};

// Helper function to reset the database when schema issues are detected
const resetDatabase = async () => {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    
    deleteRequest.onsuccess = () => {
      console.log('Database deleted successfully');
      resolve(true);
    };
    
    deleteRequest.onerror = (event) => {
      console.error('Error deleting database:', event.target.error);
      reject(event.target.error);
    };
    
    deleteRequest.onblocked = () => {
      console.warn('Database deletion blocked');
      alert('Please close all other tabs with this app open, then try again.');
      reject(new Error('Database deletion blocked'));
    };
  });
};

// Get all guests from local database using the safe transaction helper
const getAllGuests = async () => {
  try {
    return await safeTransaction(STORES.GUESTS, 'readonly', (store, resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        console.log(`Retrieved ${request.result.length} guests from IndexedDB`);
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Error getting guests:', event.target.error);
        reject(`Error getting guests: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error('Error in getAllGuests:', error);
    // Return empty array as fallback to prevent UI errors
    return [];
  }
};

// Save guests to local database with improved error handling
const saveGuests = async (guests) => {
  if (!Array.isArray(guests)) {
    console.error('saveGuests expects an array of guests');
    return false;
  }
  
  try {
    return await safeTransaction(STORES.GUESTS, 'readwrite', (store, resolve, reject) => {
      // Clear existing guests
      store.clear();
      
      // Add all guests
      let successCount = 0;
      const promises = guests.map(guest => new Promise((res, rej) => {
        if (!guest._id) {
          console.warn('Guest missing _id, generating one:', guest);
          guest._id = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
        
        const request = store.add(guest);
        
        request.onsuccess = () => {
          successCount++;
          res();
        };
        
        request.onerror = (event) => {
          console.error('Error adding guest:', guest, event.target.error);
          rej(event.target.error);
        };
      }));
      
      Promise.allSettled(promises).then(results => {
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`Saved ${successCount} guests, ${failed} failed`);
        resolve(successCount);
      }).catch(error => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error in saveGuests:', error);
    return false;
  }
};

// Save a single guest
const saveGuest = async (guest) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.GUESTS], 'readwrite');
    const store = transaction.objectStore(STORES.GUESTS);
    const request = store.put(guest);
    
    request.onsuccess = () => {
      resolve(guest);
    };
    
    request.onerror = (event) => {
      reject(`Error saving guest: ${event.target.error}`);
    };
  });
};

// Queue an action for later sync when offline
const queueAction = async (action, data) => {
  try {
    return await safeTransaction(STORES.PENDING_ACTIONS, 'readwrite', (store, resolve, reject) => {
      const request = store.add({
        action,
        data,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });
      
      request.onsuccess = () => {
        console.log(`Action ${action} queued successfully`);
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error(`Error queueing action ${action}:`, event.target.error);
        reject(`Error queueing action: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error('Error in queueAction:', error);
    return false;
  }
};

// Get all pending actions for sync
const getPendingActions = async () => {
  try {
    return await safeTransaction(STORES.PENDING_ACTIONS, 'readonly', (store, resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        console.log(`Retrieved ${request.result.length} pending actions`);
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Error getting pending actions:', event.target.error);
        reject(`Error getting pending actions: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error('Error in getPendingActions:', error);
    return [];
  }
};

// Mark pending action as completed or failed
const updatePendingAction = async (id, status, result = null) => {
  try {
    return await safeTransaction(STORES.PENDING_ACTIONS, 'readwrite', (store, resolve, reject) => {
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (!action) {
          reject(`Pending action with ID ${id} not found`);
          return;
        }
        
        action.status = status;
        action.result = result;
        action.processedAt = new Date().toISOString();
        
        const updateRequest = store.put(action);
        
        updateRequest.onsuccess = () => {
          resolve(true);
        };
        
        updateRequest.onerror = (event) => {
          reject(`Error updating pending action: ${event.target.error}`);
        };
      };
      
      getRequest.onerror = (event) => {
        reject(`Error getting pending action: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error('Error in updatePendingAction:', error);
    return false;
  }
};

// Remove a pending action after it's been processed
const removePendingAction = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_ACTIONS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_ACTIONS);
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    request.onerror = (event) => {
      reject(`Error removing pending action: ${event.target.error}`);
    };
  });
};

// Get all guest groups
const getGroups = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.GUEST_GROUPS], 'readonly');
      const store = transaction.objectStore(STORES.GUEST_GROUPS);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting groups from IndexedDB:', error);
    return [];
  }
};

// Save a guest group
const saveGroup = async (group) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.GUEST_GROUPS], 'readwrite');
      const store = transaction.objectStore(STORES.GUEST_GROUPS);
      const request = store.put(group);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error saving group to IndexedDB:', error);
    throw error;
  }
};

// Save multiple guest groups
const saveGroups = async (groups) => {
  if (!Array.isArray(groups) || groups.length === 0) return;
  
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.GUEST_GROUPS], 'readwrite');
    const store = transaction.objectStore(STORES.GUEST_GROUPS);
    
    // Clear existing groups first
    await new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = resolve;
      clearRequest.onerror = reject;
    });
    
    // Add all groups
    const promises = groups.map(group => 
      new Promise((resolve, reject) => {
        const request = store.add(group);
        request.onsuccess = resolve;
        request.onerror = reject;
      })
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error saving groups to IndexedDB:', error);
    throw error;
  }
};

// Delete a guest group
const deleteGroup = async (groupId) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.GUEST_GROUPS], 'readwrite');
      const store = transaction.objectStore(STORES.GUEST_GROUPS);
      const request = store.delete(groupId);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error deleting group from IndexedDB:', error);
    throw error;
  }
};

// Add these functions to support WhatsApp message templates

/**
 * Save a message template to IndexedDB
 * 
 * @param {Object} template - The message template to save
 * @returns {Promise<Object>} The saved template with an ID
 */
const saveMessageTemplate = async (template) => {
  const db = await initDB();
  try {
    const tx = db.transaction(STORES.MESSAGE_TEMPLATES, 'readwrite');
    const store = tx.objectStore(STORES.MESSAGE_TEMPLATES);
    
    // Generate an ID if one doesn't exist
    if (!template._id) {
      template._id = `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    await store.put(template);
    await tx.done;
    
    return template;
  } catch (error) {
    console.error('Error saving message template:', error);
    throw error;
  }
};

/**
 * Get all message templates from IndexedDB
 * 
 * @returns {Promise<Array>} Array of message templates
 */
const getAllMessageTemplates = async () => {
  const db = await initDB();
  try {
    const tx = db.transaction(STORES.MESSAGE_TEMPLATES, 'readonly');
    const store = tx.objectStore(STORES.MESSAGE_TEMPLATES);
    
    const templates = await store.getAll();
    
    // Sort by creation date (newest first)
    return templates.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  } catch (error) {
    console.error('Error getting message templates:', error);
    throw error;
  }
};

/**
 * Get a message template by ID
 * 
 * @param {string} id - The template ID
 * @returns {Promise<Object>} The message template
 */
const getMessageTemplateById = async (id) => {
  const db = await initDB();
  try {
    const tx = db.transaction(STORES.MESSAGE_TEMPLATES, 'readonly');
    const store = tx.objectStore(STORES.MESSAGE_TEMPLATES);
    
    return await store.get(id);
  } catch (error) {
    console.error('Error getting message template:', error);
    throw error;
  }
};

/**
 * Delete a message template
 * 
 * @param {string} id - The template ID to delete
 * @returns {Promise<void>}
 */
const deleteMessageTemplate = async (id) => {
  const db = await initDB();
  try {
    const tx = db.transaction(STORES.MESSAGE_TEMPLATES, 'readwrite');
    const store = tx.objectStore(STORES.MESSAGE_TEMPLATES);
    
    await store.delete(id);
    await tx.done;
  } catch (error) {
    console.error('Error deleting message template:', error);
    throw error;
  }
};

// Save contact to IndexedDB
const saveContact = async (contact) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CONTACTS], 'readwrite');
    const store = transaction.objectStore(STORES.CONTACTS);
    
    // Generate unique ID if not provided
    if (!contact._id) {
      contact._id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const request = store.put(contact);
    
    request.onsuccess = () => {
      resolve(contact);
    };
    
    request.onerror = (event) => {
      reject(`Error saving contact: ${event.target.error}`);
    };
  });
};

// Get all contacts from IndexedDB
const getContacts = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CONTACTS], 'readonly');
    const store = transaction.objectStore(STORES.CONTACTS);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      reject(`Error getting contacts: ${event.target.error}`);
    };
  });
};

// Export these functions as named exports to fix import errors
export { saveContact, getContacts };

// Define a named const before exporting to avoid anonymous default export warning
const dbOperations = {
  getAllGuests,
  saveGuests,
  saveGuest,
  queueAction,
  getPendingActions,
  removePendingAction,
  getGroups,
  saveGroup,
  saveGroups,
  deleteGroup,
  saveMessageTemplate,
  getAllMessageTemplates,
  getMessageTemplateById,
  deleteMessageTemplate,
  saveContact,
  getContacts
};

export default dbOperations;
