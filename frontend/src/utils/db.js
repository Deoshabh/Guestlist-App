/**
 * Simple IndexedDB wrapper without external dependencies
 * This implementation provides basic CRUD operations without requiring Dexie
 */

// Database name and version
const DB_NAME = 'GuestManagerDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  GUESTS: 'guests',
  USERS: 'users',
  SETTINGS: 'settings',
  SYNC_QUEUE: 'syncQueue'
};

// In-memory cache for offline mode
const memoryCache = {
  guests: [],
  users: [],
  settings: [],
  syncQueue: []
};

// Initialize with some sample data
memoryCache.guests = [
  {
    id: '1',
    name: 'John Doe',
    phone: '123-456-7890',
    email: 'john@example.com',
    status: 'checked-in',
    checkinTime: new Date().toISOString(),
    notes: 'VIP guest, needs special attention'
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '987-654-3210',
    email: 'jane@example.com',
    status: 'pending',
    notes: 'Coming with family of 4'
  },
  {
    id: '3',
    name: 'Robert Johnson',
    phone: '555-123-4567',
    email: 'robert@example.com',
    status: 'no-show',
    notes: 'Called to apologize for not showing up'
  }
];

memoryCache.users = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    isCurrentUser: true
  }
];

// Open database connection
const openDB = () => {
  return new Promise((resolve, reject) => {
    try {
      // Use localStorage as a fallback if IndexedDB is not available
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, using localStorage fallback');
        return resolve(null);
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Error opening database:', event);
        // Return null to use memory cache instead
        resolve(null);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.GUESTS)) {
          db.createObjectStore(STORES.GUESTS, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORES.USERS)) {
          db.createObjectStore(STORES.USERS, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        console.log('Database opened successfully');
        resolve(db);
      };
    } catch (err) {
      console.error('Failed to open database:', err);
      // Return null to use memory cache
      resolve(null);
    }
  });
};

// Add these functions as standalone for direct imports
export const saveContact = async (contact) => {
  // Generate an ID if not provided
  if (!contact._id) {
    contact._id = `contact_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  // Add to memory cache
  if (!memoryCache.contacts) {
    memoryCache.contacts = [];
  }
  memoryCache.contacts.push(contact);
  
  try {
    // Store in localStorage as fallback
    try {
      localStorage.setItem(`contact_${contact._id}`, JSON.stringify(contact));
    } catch (err) {
      console.warn('Failed to save contact to localStorage:', err);
    }
    
    return contact;
  } catch (err) {
    console.error('Failed to save contact:', err);
    return contact;
  }
};

export const getContacts = async () => {
  try {
    // Return memory cache if available
    if (memoryCache.contacts && memoryCache.contacts.length) {
      return memoryCache.contacts;
    }
    
    // Initialize contacts cache
    memoryCache.contacts = [];
    
    // Look for contacts in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('contact_')) {
        try {
          const contact = JSON.parse(localStorage.getItem(key));
          if (contact) {
            memoryCache.contacts.push(contact);
          }
        } catch (err) {
          console.warn('Failed to parse contact from localStorage:', err);
        }
      }
    }
    
    return memoryCache.contacts;
  } catch (err) {
    console.error('Failed to get contacts:', err);
    return [];
  }
};

// Simple CRUD operations
const dbOperations = {
  // Guest operations
  guests: {
    async toArray() {
      try {
        // Try to get from IndexedDB first
        const db = await openDB();
        if (!db) return memoryCache.guests;
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORES.GUESTS, 'readonly');
          const store = transaction.objectStore(STORES.GUESTS);
          const request = store.getAll();
          
          request.onsuccess = () => {
            resolve(request.result.length > 0 ? request.result : memoryCache.guests);
          };
          
          request.onerror = (event) => {
            console.error('Error getting guests:', event);
            resolve(memoryCache.guests);
          };
        });
      } catch (err) {
        console.error('Failed to get guests:', err);
        return memoryCache.guests;
      }
    },
    
    async get(query) {
      // Support simple query by id or object with criteria
      const id = typeof query === 'string' ? query : query.id;
      
      try {
        // If we have criteria other than ID, filter the memory cache
        if (typeof query === 'object' && !id) {
          const results = memoryCache.guests.filter(item => {
            // Match all properties in the query
            return Object.entries(query).every(([key, value]) => item[key] === value);
          });
          return results[0] || null;
        }
        
        // Try to get from IndexedDB first
        const db = await openDB();
        if (!db) {
          return memoryCache.guests.find(g => g.id === id) || null;
        }
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORES.GUESTS, 'readonly');
          const store = transaction.objectStore(STORES.GUESTS);
          const request = store.get(id);
          
          request.onsuccess = () => {
            if (request.result) {
              resolve(request.result);
            } else {
              // Fall back to memory cache if not found in DB
              resolve(memoryCache.guests.find(g => g.id === id) || null);
            }
          };
          
          request.onerror = (event) => {
            console.error('Error getting guest:', event);
            resolve(memoryCache.guests.find(g => g.id === id) || null);
          };
        });
      } catch (err) {
        console.error('Failed to get guest:', err);
        return memoryCache.guests.find(g => g.id === id) || null;
      }
    },
    
    async add(guest) {
      // Add to memory cache
      memoryCache.guests.push(guest);
      
      try {
        // Try to add to IndexedDB
        const db = await openDB();
        if (!db) return guest;
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORES.GUESTS, 'readwrite');
          const store = transaction.objectStore(STORES.GUESTS);
          const request = store.add(guest);
          
          transaction.oncomplete = () => {
            resolve(guest);
          };
          
          transaction.onerror = (event) => {
            console.error('Error adding guest:', event);
            resolve(guest);
          };
        });
      } catch (err) {
        console.error('Failed to add guest:', err);
        return guest;
      }
    },
    
    async update(id, guestData) {
      // Update in memory cache
      const index = memoryCache.guests.findIndex(g => g.id === id);
      if (index !== -1) {
        memoryCache.guests[index] = { ...memoryCache.guests[index], ...guestData };
      }
      
      try {
        // Try to update in IndexedDB
        const db = await openDB();
        if (!db) return guestData;
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORES.GUESTS, 'readwrite');
          const store = transaction.objectStore(STORES.GUESTS);
          
          // First get the existing guest
          const getRequest = store.get(id);
          
          getRequest.onsuccess = () => {
            const existingGuest = getRequest.result;
            const updatedGuest = { ...existingGuest, ...guestData };
            
            // Now update with the merged data
            const updateRequest = store.put(updatedGuest);
            
            updateRequest.onsuccess = () => {
              resolve(updatedGuest);
            };
            
            updateRequest.onerror = (event) => {
              console.error('Error updating guest:', event);
              resolve(guestData);
            };
          };
          
          getRequest.onerror = (event) => {
            console.error('Error getting guest for update:', event);
            resolve(guestData);
          };
        });
      } catch (err) {
        console.error('Failed to update guest:', err);
        return guestData;
      }
    },
    
    async delete(id) {
      // Delete from memory cache
      const index = memoryCache.guests.findIndex(g => g.id === id);
      if (index !== -1) {
        memoryCache.guests.splice(index, 1);
      }
      
      try {
        // Try to delete from IndexedDB
        const db = await openDB();
        if (!db) return true;
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORES.GUESTS, 'readwrite');
          const store = transaction.objectStore(STORES.GUESTS);
          const request = store.delete(id);
          
          transaction.oncomplete = () => {
            resolve(true);
          };
          
          transaction.onerror = (event) => {
            console.error('Error deleting guest:', event);
            resolve(true);
          };
        });
      } catch (err) {
        console.error('Failed to delete guest:', err);
        return true;
      }
    },
    
    async bulkAdd(guests) {
      // Add to memory cache
      memoryCache.guests = [...memoryCache.guests, ...guests];
      
      try {
        // Try to add to IndexedDB
        const db = await openDB();
        if (!db) return guests;
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORES.GUESTS, 'readwrite');
          const store = transaction.objectStore(STORES.GUESTS);
          
          guests.forEach(guest => {
            store.add(guest);
          });
          
          transaction.oncomplete = () => {
            resolve(guests);
          };
          
          transaction.onerror = (event) => {
            console.error('Error bulk adding guests:', event);
            resolve(guests);
          };
        });
      } catch (err) {
        console.error('Failed to bulk add guests:', err);
        return guests;
      }
    },
    
    async filter(filterFn) {
      // Filter the memory cache
      return memoryCache.guests.filter(filterFn);
    }
  },
  
  // User operations
  users: {
    async get(query) {
      const id = typeof query === 'string' ? query : null;
      
      try {
        // For criteria-based query (e.g., isCurrentUser: true)
        if (typeof query === 'object') {
          const results = memoryCache.users.filter(item => {
            return Object.entries(query).every(([key, value]) => item[key] === value);
          });
          return results[0] || null;
        }
        
        // For ID-based query
        if (id) {
          const db = await openDB();
          if (!db) {
            return memoryCache.users.find(u => u.id === id) || null;
          }
          
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORES.USERS, 'readonly');
            const store = transaction.objectStore(STORES.USERS);
            const request = store.get(id);
            
            request.onsuccess = () => {
              if (request.result) {
                resolve(request.result);
              } else {
                resolve(memoryCache.users.find(u => u.id === id) || null);
              }
            };
            
            request.onerror = (event) => {
              console.error('Error getting user:', event);
              resolve(memoryCache.users.find(u => u.id === id) || null);
            };
          });
        }
        
        // Return all users if no query
        return memoryCache.users[0] || null;
      } catch (err) {
        console.error('Failed to get user:', err);
        return memoryCache.users[0] || null;
      }
    },
    
    async put(user) {
      // Update in memory cache
      const index = memoryCache.users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        memoryCache.users[index] = user;
      } else {
        memoryCache.users.push(user);
      }
      
      try {
        // Try to update in IndexedDB
        const db = await openDB();
        if (!db) return user;
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORES.USERS, 'readwrite');
          const store = transaction.objectStore(STORES.USERS);
          const request = store.put(user);
          
          transaction.oncomplete = () => {
            resolve(user);
          };
          
          transaction.onerror = (event) => {
            console.error('Error putting user:', event);
            resolve(user);
          };
        });
      } catch (err) {
        console.error('Failed to put user:', err);
        return user;
      }
    },
    
    async update(id, userData) {
      // Update in memory cache
      const index = memoryCache.users.findIndex(u => u.id === id);
      if (index !== -1) {
        memoryCache.users[index] = { ...memoryCache.users[index], ...userData };
      }
      
      try {
        // Try to update in IndexedDB
        const db = await openDB();
        if (!db) return userData;
        
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORES.USERS, 'readwrite');
          const store = transaction.objectStore(STORES.USERS);
          
          // First get the existing user
          const getRequest = store.get(id);
          
          getRequest.onsuccess = () => {
            const existingUser = getRequest.result;
            if (existingUser) {
              const updatedUser = { ...existingUser, ...userData };
              const updateRequest = store.put(updatedUser);
              
              updateRequest.onsuccess = () => {
                resolve(updatedUser);
              };
              
              updateRequest.onerror = (event) => {
                console.error('Error updating user:', event);
                resolve(userData);
              };
            } else {
              resolve(userData);
            }
          };
          
          getRequest.onerror = (event) => {
            console.error('Error getting user for update:', event);
            resolve(userData);
          };
        });
      } catch (err) {
        console.error('Failed to update user:', err);
        return userData;
      }
    },
    
    async where(criteria) {
      // Filter the memory cache based on criteria
      return {
        toArray: async () => {
          return memoryCache.users.filter(user => {
            return Object.entries(criteria).every(([key, value]) => user[key] === value);
          });
        }
      };
    },
    
    async toArray() {
      return memoryCache.users;
    }
  },
  
  // Settings operations
  settings: {
    async get(id) {
      return null; // Simplified for now
    },
    async put(setting) {
      return setting; // Simplified for now
    }
  },
  
  // Reference contact operations in dbOperations
  saveContact,
  getContacts,
  
  // Helper functions
  transaction: async (mode, tables, callback) => {
    try {
      // Mock transaction using memory cache
      const result = await callback();
      return result;
    } catch (err) {
      console.error('Transaction failed:', err);
      throw err;
    }
  },
  
  reset: async () => {
    try {
      // Clear memory cache
      memoryCache.guests = [];
      memoryCache.users = [];
      memoryCache.settings = [];
      memoryCache.syncQueue = [];
      
      // Try to delete IndexedDB
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      
      return new Promise((resolve) => {
        deleteRequest.onsuccess = () => {
          console.log('Database deleted successfully');
          resolve(true);
        };
        
        deleteRequest.onerror = () => {
          console.error('Error deleting database');
          resolve(true);
        };
      });
    } catch (err) {
      console.error('Failed to reset database:', err);
      return true;
    }
  },
  
  open: () => Promise.resolve()
};

// Initialize default data if needed
const initDefaultData = async () => {
  try {
    // Add a default user if none exists
    const users = await dbOperations.users.toArray();
    if (users.length === 0) {
      await dbOperations.users.put({
        id: '1',
        name: 'Demo User',
        email: 'demo@example.com',
        isCurrentUser: true
      });
    }
  } catch (err) {
    console.error('Failed to initialize default data:', err);
  }
};

// Initialize
initDefaultData();

// Export the database operations
export default dbOperations;
