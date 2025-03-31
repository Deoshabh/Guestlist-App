const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');

// Organize routes with specific paths first to avoid conflicts

// Stats route
router.get('/stats', guestController.getGuestStats);

// Export/import routes
router.get('/export', guestController.exportGuestsCSV);
router.post('/import', guestController.importGuestsCSV);

// Group-specific routes
router.get('/group/:groupId', guestController.getGuestsByGroup);
router.put('/bulk-update-group', guestController.updateGuestsGroup);

// Bulk update route
router.put('/bulk-update', guestController.bulkUpdateGuests);

// Standard CRUD routes
router.get('/', guestController.getGuests);
router.get('/:id', guestController.getGuestById);
router.post('/', guestController.createGuest);
router.put('/:id', guestController.updateGuest);
router.delete('/:id', guestController.deleteGuest);
router.put('/:id/undo', guestController.undoDeleteGuest);

module.exports = router;
