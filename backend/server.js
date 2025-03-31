require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const guestRoutes = require('./routes/guestRoutes');
const healthRoutes = require('./routes/healthRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// Configure CORS for production
const corsOptions = {
  origin: isProd ? process.env.ALLOWED_ORIGINS?.split(',') || '*' : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

// Middleware
app.use(express.json());
app.use(fileUpload());
app.use(cors(corsOptions));

// Increase payload limit for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guestlist';
mongoose.connect(MONGODB_URI)
.then(() => console.log(`MongoDB connected to ${isProd ? 'production' : 'development'} database`))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api', healthRoutes); // No auth required for health checks
app.use('/api/auth', authRoutes);
app.use('/api/guests', authMiddleware, guestRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    environment: NODE_ENV 
  });
});

// Serve static files in production
if (isProd) {
  // Serve frontend static files
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`));
