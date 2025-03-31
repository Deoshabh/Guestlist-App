const express = require('express');
const router = express.Router();
const guestGroupController = require('../controllers/guestGroupController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// GET /api/guest-groups - Get all guest groups
router.get('/', guestGroupController.getGroups);

// POST /api/guest-groups - Create a new guest group
router.post('/', guestGroupController.createGroup);

// PUT /api/guest-groups/:id - Update a guest group
router.put('/:id', guestGroupController.updateGroup);

// DELETE /api/guest-groups/:id - Delete a guest group
router.delete('/:id', guestGroupController.deleteGroup);

module.exports = router;
