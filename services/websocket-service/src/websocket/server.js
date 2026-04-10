const WebSocket = require('ws');
const url = require('url');
const { logger } = require('../utils/logger');
const { redisClient } = require('../redis/client');

// Store client connections
const clients = new Map();

function initWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws, req) => {
    const pathname = url.parse(req.url).pathname;
    let orderId = pathname.split('/').pop();
    
    // If no orderId, use 'broadcast' to receive all events
    if (!orderId || orderId === '') {
      orderId = 'broadcast';
    }

    logger.info(`Client connected for order: ${orderId}`);

    // Store client connection
    if (!clients.has(orderId)) {
      clients.set(orderId, new Set());
    }
    clients.get(orderId).add(ws);

    // Send initial order status
    try {
      const orderData = await redisClient.get(`order:${orderId}`);
      if (orderData) {
        ws.send(JSON.stringify({
          type: 'INITIAL_STATE',
          data: JSON.parse(orderData)
        }));
        logger.info(`Sent initial state for order: ${orderId}`);
      } else {
        logger.warn(`No cached data found for order: ${orderId}`);
        // Send acknowledgment even if no data found
        ws.send(JSON.stringify({
          type: 'CONNECTED',
          message: `Connected to order ${orderId}`,
          orderId: orderId
        }));
      }
    } catch (error) {
      logger.error('Error fetching initial state:', error);
      // Don't close connection, just log the error
      try {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Failed to fetch initial state',
          orderId: orderId
        }));
      } catch (sendError) {
        logger.error('Error sending error message:', sendError);
      }
    }

    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        logger.info(`Message from client:`, data);
        
        // Echo back for now (can add more logic)
        ws.send(JSON.stringify({
          type: 'ACK',
          message: 'Message received'
        }));
      } catch (error) {
        logger.error('Error processing message:', error);
      }
    });

    // Handle ping/pong for connection health
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle disconnection
    ws.on('close', () => {
      logger.info(`Client disconnected for order: ${orderId}`);
      const orderClients = clients.get(orderId);
      if (orderClients) {
        orderClients.delete(ws);
        if (orderClients.size === 0) {
          clients.delete(orderId);
        }
      }
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });
  });

  // Heartbeat interval to detect broken connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  logger.info('WebSocket server initialized');
  return wss;
}

function broadcastToOrder(orderId, message) {
  const orderClients = clients.get(orderId);
  if (orderClients) {
    const messageStr = JSON.stringify(message);
    orderClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
    logger.info(`Broadcast to ${orderClients.size} clients for order: ${orderId}`);
  }
}

function getConnectionCount() {
  let total = 0;
  clients.forEach((orderClients) => {
    total += orderClients.size;
  });
  return total;
}

module.exports = {
  initWebSocketServer,
  broadcastToOrder,
  getConnectionCount,
  clients
};
