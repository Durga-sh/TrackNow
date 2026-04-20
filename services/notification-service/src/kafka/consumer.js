const { Kafka } = require('kafkajs');
const { logger } = require('../utils/logger');
const config = require('../config');
const notificationService = require('../services/notificationService');
const { withRetry, initDLQProducer, disconnectDLQProducer } = require('./retryHandler');

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: [config.kafka.broker]
});

const consumer = kafka.consumer({ groupId: config.kafka.groupId });

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

  const correlationId = message.headers?.correlationId
    ? message.headers.correlationId.toString()
    : 'unknown';

  logger.info(`Received event from ${topic}`, {
    orderId: event.orderId,
    partition,
    correlationId
  });

  await notificationService.handleEvent(topic, event);
}

async function startConsumer() {
  // Initialize DLQ producer for publishing failed messages
  await initDLQProducer(config.kafka.broker);

  await consumer.connect();

  await consumer.subscribe({
    topics: [
      TOPICS.ORDER_CREATED,
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

  logger.info('Notification Kafka consumer is running with retry + DLQ support');
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
