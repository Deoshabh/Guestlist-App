const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const contactController = require('../controllers/contactController');
const authMiddleware = require('../middleware/authMiddleware');

// Set up multer for VCF file uploads
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
    if (file.mimetype !== 'text/vcard' && 
        file.mimetype !== 'text/x-vcard' && 
        !file.originalname.endsWith('.vcf')) {
      return cb(new Error('Only VCF files are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Protect all routes with auth middleware
router.use(authMiddleware);

// VCF import route
router.post(
  '/import/vcf',
  upload.single('file'),
  contactController.importContactsFromVcf
);

// Google contacts import routes
router.get('/import/google/start', contactController.startGoogleContactsImport);
router.post('/import/google/callback', contactController.handleGoogleContactsCallback);

// Match contacts with guests
router.post('/match-guests', contactController.matchGuestsWithContacts);

module.exports = router;
