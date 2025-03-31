const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Get all guests
router.get('/', guestController.getGuests);

// Get a specific guest
router.get('/:id', guestController.getGuestById);

// Create a new guest
router.post('/', guestController.createGuest);

// Update a guest
router.put('/:id', guestController.updateGuest);

// Delete a guest (soft delete)
router.delete('/:id', guestController.deleteGuest);

// Restore a deleted guest
router.put('/:id/undo', guestController.undoDeleteGuest);

// Get guests by group
router.get('/group/:groupId', guestController.getGuestsByGroup);

// Bulk update guests group
router.put('/bulk-update-group', guestController.updateGuestsGroup);

// Bulk update guests (for invited status, etc.)
router.put('/bulk-update', guestController.bulkUpdateGuests);

// Export guests as CSV
router.get('/export', guestController.exportGuestsCSV);

// Import guests from CSV
router.post('/import', guestController.importGuestsCSV);

// Get guest statistics
router.get('/stats', guestController.getGuestStats);

module.exports = router;
