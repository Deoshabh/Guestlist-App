/**
 * Helper functions to assist with migrating from the old offline-capable code
 * to the new online-only services.
 */
import { apiService, guestService } from '../services';

/**
 * Compatibility layer to replace the old "db" object that was used for offline storage
 * This helps components that still try to use db.* methods to transition smoothly
 */
export const dbCompat = {
  // Guest compatibility methods
  guests: {
    async get(id) {
      console.warn('Using deprecated db.guests.get - please update to guestService.getGuest');
      return guestService.getGuest(id);
    },
    
    async put(guest) {
      console.warn('Using deprecated db.guests.put - please update to guestService.updateGuest');
      return guestService.updateGuest(guest._id, guest);
    },
    
    async add(guest) {
      console.warn('Using deprecated db.guests.add - please update to guestService.createGuest');
      return guestService.createGuest(guest);
    },
    
    async delete(id) {
      console.warn('Using deprecated db.guests.delete - please update to guestService.deleteGuest');
      return guestService.deleteGuest(id);
    },
    
    async toArray() {
      console.warn('Using deprecated db.guests.toArray - please update to guestService.getGuests');
      return guestService.getGuests();
    }
  },
  
  // Group compatibility methods
  groups: {
    async get(id) {
      console.warn('Using deprecated db.groups.get - please update to guestService.getGuestGroup');
      const groups = await guestService.getGuestGroups();
      return groups.find(group => group._id === id);
    },
    
    async toArray() {
      console.warn('Using deprecated db.groups.toArray - please update to guestService.getGuestGroups');
      return guestService.getGuestGroups();
    }
  },
  
  // Stub methods that no longer do anything
  queueAction: async () => {
    console.warn('Using deprecated db.queueAction - offline functionality has been removed');
    return true;
  },
  
  removePendingAction: async () => {
    console.warn('Using deprecated db.removePendingAction - offline functionality has been removed');
    return true;
  },
  
  getPendingActions: async () => {
    console.warn('Using deprecated db.getPendingActions - offline functionality has been removed');
    return [];
  },
  
  // Always return true for isOnline checks
  isOnline: () => true
};

// Export the compatibility layer as the default export
export default dbCompat;
