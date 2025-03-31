// IndexedDB wrapper for offline data storage

// Database configuration
const DB_NAME = 'guest-manager-db';
const DB_VERSION = 1;
const STORES = {
  GUESTS: 'guests',
  PENDING_ACTIONS: 'pendingActions'
};

// Initialize the database
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject(`Database error: ${event.target.error}`);
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.GUESTS)) {
        db.createObjectStore(STORES.GUESTS, { keyPath: '_id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_ACTIONS, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        pendingStore.createIndex('action', 'action', { unique: false });
      }
    };
  });
};

// Get all guests from local database
const getAllGuests = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.GUESTS], 'readonly');
    const store = transaction.objectStore(STORES.GUESTS);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      reject(`Error getting guests: ${event.target.error}`);
    };
  });
};

// Save guests to local database
const saveGuests = async (guests) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.GUESTS], 'readwrite');
    const store = transaction.objectStore(STORES.GUESTS);
    
    // Clear existing guests
    store.clear();
    
    // Add all guests
    let count = 0;
    guests.forEach(guest => {
      const request = store.add(guest);
      request.onsuccess = () => {
        count++;
        if (count === guests.length) {
          resolve(true);
        }
      };
      request.onerror = (event) => {
        reject(`Error saving guest: ${event.target.error}`);
      };
    });
    
    transaction.oncomplete = () => {
      console.log('All guests have been stored locally');
    };
  });
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
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_ACTIONS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_ACTIONS);
    const request = store.add({
      action,
      data,
      timestamp: new Date().toISOString()
    });
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    request.onerror = (event) => {
      reject(`Error queueing action: ${event.target.error}`);
    };
  });
};

// Get all pending actions
const getPendingActions = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_ACTIONS], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_ACTIONS);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      reject(`Error getting pending actions: ${event.target.error}`);
    };
  });
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

export default {
  getAllGuests,
  saveGuests,
  saveGuest,
  queueAction,
  getPendingActions,
  removePendingAction
};
