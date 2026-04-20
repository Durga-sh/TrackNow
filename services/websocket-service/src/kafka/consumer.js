const { Kafka } = require('kafkajs');
const { logger } = require('../utils/logger');
const { broadcastToOrder } = require('../websocket/server');
const { withRetry, initDLQProducer, disconnectDLQProducer } = require('./retryHandler');

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

/**
 * Core message processing logic — separated so it can be wrapped with retry.
 */
async function processMessage({ topic, partition, message }) {
  const event = JSON.parse(message.value.toString());

  logger.info(`Received event from ${topic}:`, {
    orderId: event.orderId,
    partition
  });

  let wsMessage;

  switch (topic) {
    case TOPICS.ORDER_CREATED:
      wsMessage = { type: 'ORDER_CREATED', data: event };
      broadcastToOrder(event.orderId, wsMessage);
      break;

    case TOPICS.ORDER_UPDATED:
      wsMessage = { type: 'ORDER_UPDATED', data: event };
      broadcastToOrder(event.orderId, wsMessage);
      break;

    case TOPICS.STATUS_CHANGED:
      wsMessage = { type: 'STATUS_CHANGED', data: event };
      broadcastToOrder(event.orderId, wsMessage);
      break;

    default:
      logger.warn(`Unknown topic: ${topic}`);
  }
}

async function startConsumer(wss) {
  // Initialize DLQ producer for publishing failed messages
  await initDLQProducer(process.env.KAFKA_BROKER || 'localhost:9092');

  await consumer.connect();

  await consumer.subscribe({
    topics: [
      TOPICS.ORDER_CREATED,
      TOPICS.ORDER_UPDATED,
      TOPICS.STATUS_CHANGED
    ],
    fromBeginning: false
  });

  // Wrap handler with retry (3 retries, exponential backoff: 1s → 2s → 4s)
  const retryingHandler = withRetry(processMessage, {
    maxRetries: 3,
    baseDelayMs: 1000
  });

  await consumer.run({
    eachMessage: retryingHandler
  });

  logger.info('Kafka consumer is running with retry + DLQ support');
}

async function stopConsumer() {
  await consumer.disconnect();
  await disconnectDLQProducer();
  logger.info('Kafka consumer and DLQ producer disconnected');
}

module.exports = {
  kafkaConsumer: consumer,
  startConsumer,
  stopConsumer,
  TOPICS
};
