const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const guestController = require('../controllers/guestController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: function(req, file, cb) {
    if (file.mimetype !== 'text/csv' && 
        file.mimetype !== 'application/vnd.ms-excel' && 
        file.mimetype !== 'application/csv') {
      return cb(new Error('Only CSV files are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Protect all guest routes with auth middleware
router.use(authMiddleware);

// Get all guests
router.get('/', guestController.getGuests);

// Get a single guest
router.get('/:id', guestController.getGuestById);

// Create a new guest
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
    validateRequest
  ],
  guestController.createGuest
);

// Add this new route for bulk guest creation
router.post(
  '/bulk',
  [
    body('guests').isArray().withMessage('Guests must be an array'),
    validateRequest
  ],
  guestController.createBulkGuests
);

// Update a guest
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
    validateRequest
  ],
  guestController.updateGuest
);

// Add route to update guest from contact
router.put(
  '/:id/update-from-contact',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    validateRequest
  ],
  contactController.updateGuestFromContact
);

// Delete a guest
router.delete('/:id', guestController.deleteGuest);

// Import guests from CSV
router.post(
  '/import',
  upload.single('file'),
  guestController.importGuestsFromCsv
);

// Generate WhatsApp link for a guest
router.post(
  '/:id/whatsapp',
  [
    body('template').notEmpty().withMessage('Message template is required'),
    validateRequest
  ],
  guestController.generateWhatsAppLink
);

// Generate WhatsApp links for multiple guests
router.post(
  '/whatsapp/bulk',
  [
    body('guestIds').isArray().withMessage('Guest IDs must be an array'),
    body('template').notEmpty().withMessage('Message template is required'),
    validateRequest
  ],
  guestController.generateBulkWhatsAppLinks
);

module.exports = router;
