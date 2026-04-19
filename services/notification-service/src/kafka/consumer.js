const { Kafka } = require('kafkajs');
const { logger } = require('../utils/logger');
const config = require('../config');
const notificationService = require('../services/notificationService');

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

async function startConsumer() {
  await consumer.connect();

  // Subscribe to relevant topics
  await consumer.subscribe({
    topics: [
      TOPICS.ORDER_CREATED,
      TOPICS.STATUS_CHANGED
    ],
    fromBeginning: false
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());

        // Extract correlation ID from Kafka headers if present
        const correlationId = message.headers?.correlationId
          ? message.headers.correlationId.toString()
          : 'unknown';

        logger.info(`Received event from ${topic}`, {
          orderId: event.orderId,
          partition,
          correlationId
        });

        // Route event to notification service
        await notificationService.handleEvent(topic, event);

      } catch (error) {
        logger.error('Error processing message in notification consumer:', {
          topic,
          partition,
          offset: message.offset,
          error: error.message,
          stack: error.stack
        });
      }
    }
  });

  logger.info('Notification Kafka consumer is running');
}

module.exports = {
  kafkaConsumer: consumer,
  startConsumer,
  TOPICS
};
