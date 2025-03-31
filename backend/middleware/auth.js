/**
 * This file serves as a compatibility layer for code that imports from '../middleware/auth'
 * It re-exports the authentication middleware from authMiddleware.js
 */

// Import the actual authentication middleware
const authMiddleware = require('./authMiddleware');

// Export the middleware for backward compatibility
module.exports = authMiddleware;
