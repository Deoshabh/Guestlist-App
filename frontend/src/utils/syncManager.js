import axios from 'axios';
import db from './db';
import haptic from './haptic';

/**
 * SyncManager handles synchronization of pending actions when app comes back online
 */
class SyncManager {
  constructor(apiBaseUrl = '/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.isSyncing = false;
    this.setupEventListeners();
  }

  /**
   * Sets up event listeners for online/offline status
   */
  setupEventListeners() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * Sets the auth token for API requests
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Handles when the device comes back online
   */
  handleOnline() {
    console.log('🌐 Device is online. Starting sync...');
    this.syncPendingActions();
  }

  /**
   * Handles when the device goes offline
   */
  handleOffline() {
    console.log('📴 Device is offline. Changes will be synced later.');
  }

  /**
   * Syncs all pending actions with the server
   */
  async syncPendingActions() {
    if (this.isSyncing || !navigator.onLine || !this.token) return;
    
    try {
      this.isSyncing = true;
      const pendingActions = await db.getPendingActions();
      
      if (pendingActions.length === 0) {
        console.log('No pending actions to sync');
        return;
      }
      
      console.log(`Syncing ${pendingActions.length} pending actions...`);
      
      // Process actions sequentially to avoid race conditions
      for (const action of pendingActions) {
        await this.processAction(action);
      }
      
      // Notify the user
      if (pendingActions.length > 0) {
        haptic.successFeedback();
        this.showSyncNotification(pendingActions.length);
      }
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process a single pending action
   * @param {Object} action - Pending action to process
   */
  async processAction(action) {
    try {
      const { id, action: actionType, data } = action;
      
      switch (actionType) {
        case 'ADD_GUEST':
          await this.syncAddGuest(data);
          break;
        case 'UPDATE_GUEST':
          await this.syncUpdateGuest(data.id, data.data);
          break;
        case 'DELETE_GUEST':
          await this.syncDeleteGuest(data.id);
          break;
        default:
          console.warn(`Unknown action type: ${actionType}`);
      }
      
      // Remove processed action
      await db.removePendingAction(id);
    } catch (error) {
      console.error(`Failed to process action:`, error);
      // We don't remove the action so it can be retried
    }
  }

  /**
   * Sync a guest creation with the server
   * @param {Object} guestData - Guest data to send
   */
  async syncAddGuest(guestData) {
    const response = await axios.post(
      `${this.apiBaseUrl}/guests`, 
      guestData,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    return response.data;
  }

  /**
   * Sync a guest update with the server
   * @param {string} id - Guest ID
   * @param {Object} updateData - Update data
   */
  async syncUpdateGuest(id, updateData) {
    const response = await axios.put(
      `${this.apiBaseUrl}/guests/${id}`, 
      updateData,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    return response.data;
  }

  /**
   * Sync a guest deletion with the server
   * @param {string} id - Guest ID
   */
  async syncDeleteGuest(id) {
    const response = await axios.delete(
      `${this.apiBaseUrl}/guests/${id}`,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    return response.data;
  }

  /**
   * Shows a notification about successful sync
   * @param {number} count - Number of actions synced
   */
  showSyncNotification(count) {
    // Check if the browser supports notifications
    if ('Notification' in window) {
      // Check if permission is already granted
      if (Notification.permission === 'granted') {
        new Notification('Guest Manager Sync Complete', {
          body: `Successfully synced ${count} changes while you were offline.`,
          icon: '/logo512.svg'
        });
      } 
      // Otherwise, ask for permission
      else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Guest Manager Sync Complete', {
              body: `Successfully synced ${count} changes while you were offline.`,
              icon: '/logo512.svg'
            });
          }
        });
      }
    }
  }
}

/**
 * Function to sync guest groups
 * @returns {Promise<{synced: number, error?: Error}>}
 */
const syncGuestGroups = async () => {
  try {
    // Check if there are any pending group actions
    const pendingActions = await db.getPendingActions();
    const groupActions = pendingActions.filter(action => 
      action.action === 'CREATE_GROUP' || 
      action.action === 'UPDATE_GROUP' || 
      action.action === 'DELETE_GROUP'
    );
    
    if (groupActions.length === 0) return { synced: 0 };
    
    let syncCount = 0;
    
    const syncManager = new SyncManager();
    const apiBaseUrl = syncManager.apiBaseUrl;
    
    // Process each action
    for (const action of groupActions) {
      try {
        switch (action.action) {
          case 'CREATE_GROUP':
            await axios.post(
              `${apiBaseUrl}/guest-groups`, 
              action.data, 
              { headers: { Authorization: `Bearer ${syncManager.token}` } }
            );
            break;
            
          case 'UPDATE_GROUP':
            await axios.put(
              `${apiBaseUrl}/guest-groups/${action.data.id}`, 
              action.data.data, 
              { headers: { Authorization: `Bearer ${syncManager.token}` } }
            );
            break;
            
          case 'DELETE_GROUP':
            await axios.delete(
              `${apiBaseUrl}/guest-groups/${action.data.id}`, 
              { headers: { Authorization: `Bearer ${syncManager.token}` } }
            );
            break;
        }
        
        // Remove the action after it's been processed
        await db.removePendingAction(action.id);
        syncCount++;
      } catch (err) {
        console.error(`Error processing group action ${action.action}:`, err);
      }
    }
    
    return { synced: syncCount };
  } catch (error) {
    console.error('Error syncing guest groups:', error);
    return { synced: 0, error };
  }
};

// Create and export a singleton instance
const syncManager = new SyncManager();

// Export the syncManager as default and syncGuestGroups as a named export
export { syncGuestGroups };
export default syncManager;
