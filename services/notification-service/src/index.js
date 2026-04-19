require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { logger } = require('./utils/logger');
const { connectDB } = require('./database/connection');
const { startConsumer, kafkaConsumer } = require('./kafka/consumer');
const { initTransporter } = require('./channels/emailChannel');
const config = require('./config');

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'notification-service',
    timestamp: new Date().toISOString()
  });
});

// Notification logs endpoint (for debugging/admin)
app.get('/api/notifications', async (req, res) => {
  try {
    const NotificationLog = require('./models/NotificationLog');
    const { page = 1, limit = 20, orderId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = orderId ? { orderId } : {};

    const [logs, total] = await Promise.all([
      NotificationLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      NotificationLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        notifications: logs,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    logger.error('Error fetching notification logs:', err);
    res.status(500).json({ error: 'Failed to fetch notification logs' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Initialize connections and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('Connected to MongoDB');

    // Initialize email transporter
    await initTransporter();
    logger.info('Email transporter ready');

    // Start Kafka Consumer
    await startConsumer();
    logger.info('Kafka Consumer Started');

    app.listen(PORT, () => {
      logger.info(`Notification Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing gracefully');
  await kafkaConsumer.disconnect();
  process.exit(0);
});

startServer();

module.exports = app;
