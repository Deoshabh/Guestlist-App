const mongoose = require('mongoose');

const GuestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String }, // contact is now optional
  invited: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GuestGroup',
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Prevent duplicate guest entries (non-deleted)
GuestSchema.index({ name: 1, contact: 1, deleted: 1, user: 1 }, { unique: true, partialFilterExpression: { deleted: false } });

module.exports = mongoose.model('Guest', GuestSchema);
