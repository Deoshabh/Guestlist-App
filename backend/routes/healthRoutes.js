const express = require('express');
const router = express.Router();

// Simple health check endpoint
router.get('/health', (req, res) => {
  res.status(200).send({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Detailed health check for the entire system
router.get('/health/detailed', (req, res) => {
  const mongoose = require('mongoose');
  
  // Check database connection
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).send({
    status: 'ok',
    services: {
      api: 'ok',
      database: dbStatus
    },
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
