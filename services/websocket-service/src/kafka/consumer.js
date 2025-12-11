const { Kafka } = require('kafkajs');
const { logger } = require('../utils/logger');
const { broadcastToOrder } = require('../websocket/server');

const kafka = new Kafka({
  clientId: 'websocket-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'websocket-group' });

const TOPICS = {
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  STATUS_CHANGED: 'order.status.changed'
};

async function startConsumer(wss) {
  await consumer.connect();
  
  // Subscribe to all relevant topics
  await consumer.subscribe({ 
    topics: [
      TOPICS.ORDER_CREATED,
      TOPICS.ORDER_UPDATED,
      TOPICS.STATUS_CHANGED
    ], 
    fromBeginning: false 
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        
        logger.info(`Received event from ${topic}:`, { 
          orderId: event.orderId,
          partition 
        });

        // Determine the event type and broadcast to relevant clients
        let wsMessage;
        
        switch (topic) {
          case TOPICS.ORDER_CREATED:
            wsMessage = {
              type: 'ORDER_CREATED',
              data: event
            };
            broadcastToOrder(event.orderId, wsMessage);
            break;

          case TOPICS.ORDER_UPDATED:
            wsMessage = {
              type: 'ORDER_UPDATED',
              data: event
            };
            broadcastToOrder(event.orderId, wsMessage);
            break;

          case TOPICS.STATUS_CHANGED:
            wsMessage = {
              type: 'STATUS_CHANGED',
              data: event
            };
            broadcastToOrder(event.orderId, wsMessage);
            break;

          default:
            logger.warn(`Unknown topic: ${topic}`);
        }
      } catch (error) {
        logger.error('Error processing message:', error);
      }
    }
  });

  logger.info('Kafka consumer is running and broadcasting to WebSocket clients');
}

module.exports = {
  kafkaConsumer: consumer,
  startConsumer,
  TOPICS
};
