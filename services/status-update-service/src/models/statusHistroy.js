const { mongoose } = require('../database/connection');

const statusHistorySchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    index: true
  },
  fromStatus: {
    type: String,
    enum: ['CREATED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', null],
    default: null
  },
  toStatus: {
    type: String,
    required: true,
    enum: ['CREATED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
  },
  notes: {
    type: String,
    default: ''
  },
  changedBy: {
    type: String,
    default: 'system'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'status_history'
});

// Compound index for efficient queries
statusHistorySchema.index({ orderId: 1, timestamp: -1 });

const StatusHistory = mongoose.model('StatusHistory', statusHistorySchema);

module.exports = StatusHistory;
