const mongoose = require('mongoose');

// Verify this model exists and is properly referenced
const guestGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Check if the relationship with Guest model is correctly established
module.exports = mongoose.model('GuestGroup', guestGroupSchema);
