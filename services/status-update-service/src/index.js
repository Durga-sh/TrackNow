require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const statusRoutes = require('./routes/statusRoutes');
const { logger } = require('./utils/logger');
const { startConsumer } = require('./kafka/consumer');
const { kafkaProducer } = require('./kafka/producer');
const { redisClient } = require('./redis/client');
const { connectDB } = require('./database/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'status-update-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/orders', statusRoutes);

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

    // Connect to Redis
    await redisClient.connect();
    logger.info('Connected to Redis');

    // Connect Kafka Producer
    await kafkaProducer.connect();
    logger.info('Kafka Producer Connected');

    // Start Kafka Consumer
    await startConsumer();
    logger.info('Kafka Consumer Started');

    app.listen(PORT, () => {
      logger.info(`Status Update Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing gracefully');
  await kafkaProducer.disconnect();
  await redisClient.quit();
  process.exit(0);
});

startServer();

module.exports = app;
