const { mongoose } = require('../database/connection');

const notificationLogSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    index: true
  },
  customerId: {
    type: String,
    default: 'unknown',
    index: true
  },
  channel: {
    type: String,
    required: true,
    enum: ['email', 'sms', 'push'],
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['ORDER_CREATED', 'STATUS_CHANGED'],
    index: true
  },
  recipient: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    required: true,
    enum: ['sent', 'failed', 'pending'],
    default: 'pending'
  },
  messageId: {
    type: String,
    default: null
  },
  previewUrl: {
    type: String,
    default: null
  },
  error: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'notification_logs'
});

// Indexes for common queries
notificationLogSchema.index({ createdAt: -1 });
notificationLogSchema.index({ orderId: 1, channel: 1 });
notificationLogSchema.index({ status: 1, createdAt: -1 });

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

module.exports = NotificationLog;
