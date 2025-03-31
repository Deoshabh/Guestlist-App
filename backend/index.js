const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const guestRoutes = require('./routes/guests'); // Update this to match the actual filename
const guestGroupRoutes = require('./routes/guestGroups');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/guest-groups', guestGroupRoutes);

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('frontend/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
  });
}

app.listen(port, () => console.log(`Server running on port ${port}`));