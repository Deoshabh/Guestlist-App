const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// ... existing routes ...

// Get guests by group
router.get('/group/:groupId', guestController.getGuestsByGroup);

// Bulk update guests group
router.put('/bulk-update-group', guestController.bulkUpdateGroup);

// ... existing routes ...

module.exports = router;
