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

// Improved CORS configuration for better security and preflight handling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !isProd) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204 // No content for OPTIONS responses
};

// Apply CORS middleware before other middleware
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests explicitly
app.options('*', (req, res) => {
  // Set CORS headers explicitly for preflight
  const origin = req.headers.origin;
  if (!isProd || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Max-Age', '86400');
  }
  res.status(204).end();
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload());

// Add debug middleware in development mode
if (!isProd && process.env.DEBUG_API === 'true') {
  app.use(debugMiddleware);
}

// Connect to MongoDB with unified configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guestlist';
mongoose.connect(MONGODB_URI)
  .then(() => console.log(`MongoDB connected to ${isProd ? 'production' : 'development'} database`))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api', healthRoutes); // Health checks without auth
app.use('/api/auth', authRoutes);
app.use('/api/guests', authMiddleware, guestRoutes);
app.use('/api/guest-groups', authMiddleware, guestGroupRoutes);

// API response debug middleware - helps identify malformed responses
app.use('/api', (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    // Log API responses in development for debugging
    if (!isProd && process.env.DEBUG_API === 'true') {
      console.log(`API Response [${req.method}] ${req.originalUrl}:`, 
        typeof data === 'string' ? data.substring(0, 100) : '[Object]');
    }
    
    // Ensure data is properly formatted to avoid "ct" errors
    if (data && typeof data === 'string' && data.length < 5) {
      console.warn(`Warning: Possibly malformed API response for ${req.originalUrl}:`, data);
    }
    
    originalSend.call(this, data);
  };
  next();
});

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

// Enhanced error handler middleware with more detailed error responses
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Send appropriate error format based on type
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    error: err.message || 'Server error',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  };
  
  // Include stack trace in development mode
  if (!isProd) {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`));
