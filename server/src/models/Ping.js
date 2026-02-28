const mongoose = require('mongoose');

const pingSchema = new mongoose.Schema({
  monitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monitor',
    required: true,
  },
  status: {
    type: String,
    enum: ['up', 'down'],
    required: true,
  },
  responseTime: {
    type: Number, // in milliseconds
  },
  checkedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Ping', pingSchema);
