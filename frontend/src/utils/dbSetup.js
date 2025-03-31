import { openDB } from 'idb';

/**
 * Initialize or upgrade the IndexedDB database
 * 
 * @param {string} dbName - The database name
 * @param {number} version - The database version
 * @returns {Promise<IDBDatabase>} The database instance
 */
export const setupDatabase = async (dbName = 'guestManagerDB', version = 1) => {
  return openDB(dbName, version, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
      
      // Create object stores if they don't exist
      
      // Guests store
      if (!db.objectStoreNames.contains('guests')) {
        const guestStore = db.createObjectStore('guests', { keyPath: '_id' });
        guestStore.createIndex('groupId', 'groupId', { unique: false });
        console.log('Created guests store');
      }
      
      // Groups store
      if (!db.objectStoreNames.contains('groups')) {
        db.createObjectStore('groups', { keyPath: '_id' });
        console.log('Created groups store');
      }
      
      // Message templates store
      if (!db.objectStoreNames.contains('messageTemplates')) {
        db.createObjectStore('messageTemplates', { keyPath: '_id' });
        console.log('Created message templates store');
      }
      
      // Action queue store for offline operations
      if (!db.objectStoreNames.contains('actionQueue')) {
        const actionStore = db.createObjectStore('actionQueue', { 
          keyPath: 'id',
          autoIncrement: true
        });
        actionStore.createIndex('type', 'type', { unique: false });
        actionStore.createIndex('status', 'status', { unique: false });
        console.log('Created action queue store');
      }
      
      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
        console.log('Created settings store');
      }
    },
    
    blocked() {
      console.warn('Database upgrade was blocked');
    },
    
    blocking() {
      console.warn('This connection is blocking a database upgrade');
    },
    
    terminated() {
      console.warn('Database connection was terminated');
    }
  });
};

export default setupDatabase;
