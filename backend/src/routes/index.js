const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const guestRoutes = require('./guestRoutes');
const templateRoutes = require('./templateRoutes');
const contactRoutes = require('./contactRoutes');

// Mount routes
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/guests', guestRoutes);
router.use('/templates', templateRoutes);
router.use('/contacts', contactRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
