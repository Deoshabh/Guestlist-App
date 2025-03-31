require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const guestRoutes = require('./routes/guestRoutes');
const guestGroupRoutes = require('./routes/guestGroups');
const healthRoutes = require('./routes/healthRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const debugMiddleware = require('./middleware/debugMiddleware');

const app = express();

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// Get allowed origins from environment or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['https://bhaujanvypar.com', 'https://www.bhaujanvypar.com', 'http://localhost:3000'];

console.log('Allowed origins:', allowedOrigins);

// THIS IS CRITICAL - Set CORS directly on all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Simplified CORS middleware as a fallback
app.use(cors());

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload());

// Debug middleware
if (!isProd && process.env.DEBUG_API === 'true') {
  app.use(debugMiddleware);
}

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guestlist';
mongoose.connect(MONGODB_URI)
  .then(() => console.log(`MongoDB connected: ${MONGODB_URI}`))
  .catch(err => console.error('MongoDB connection error:', err));

// Clear & direct route mapping
// Routes need to be available at multiple paths for backward compatibility
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

// Auth routes at multiple paths to handle different client expectations
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// Guest routes with auth middleware
app.use('/api/guests', authMiddleware, guestRoutes);
app.use('/guests', authMiddleware, guestRoutes);

// Group routes with auth middleware
app.use('/api/guest-groups', authMiddleware, guestGroupRoutes);
app.use('/guest-groups', authMiddleware, guestGroupRoutes);

// Log all requests in development
if (!isProd) {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Serve static files in production
if (isProd) {
  // Configure caching headers for service worker assets
  app.use((req, res, next) => {
    // Don't cache service worker file
    if (req.url.includes('service-worker.js') || req.url.includes('sw.js')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } 
    // Cache static assets longer
    else if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|json)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
    next();
  });
  
  // Serve frontend static files from /usr/share/nginx/html
  app.use(express.static('/usr/share/nginx/html', {
    etag: true,
    lastModified: true
  }));
  
  // Handle PWA manifest and service worker paths explicitly
  app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join('/usr/share/nginx/html', 'manifest.json'));
  });
  
  app.get('/service-worker.js', (req, res) => {
    res.sendFile(path.join('/usr/share/nginx/html', 'service-worker.js'));
  });
  
  // Catch-all route to serve index.html for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join('/usr/share/nginx/html', 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Server error',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`🔒 CORS allowing origins: ${allowedOrigins.join(', ')}`);
});

// Handle server shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
