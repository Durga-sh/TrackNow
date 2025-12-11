const http = require('http');
const express = require('express');
const cors = require('cors');
const { initWebSocketServer } = require('./websocket/server');
const { startConsumer } = require('./kafka/consumer');
const { redisClient } = require('./redis/client');
const { logger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'websocket-service',
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = initWebSocketServer(server);

// Initialize connections and start server
async function startServer() {
  try {
    // Connect to Redis
    await redisClient.connect();
    logger.info('Connected to Redis');

    // Start Kafka Consumer
    await startConsumer(wss);
    logger.info('Kafka Consumer Started');

    server.listen(PORT, () => {
      logger.info(`WebSocket Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing gracefully');
  wss.close();
  await redisClient.quit();
  server.close();
  process.exit(0);
});

startServer();

module.exports = { app, server };
