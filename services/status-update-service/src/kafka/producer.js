const { Kafka } = require('kafkajs');
const { logger } = require('../utils/logger');

const kafka = new Kafka({
  clientId: 'status-update-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9093']
});

const producer = kafka.producer();

const TOPICS = {
  STATUS_CHANGED: 'order.status.changed'
};

async function publishStatusChanged(statusChange) {
  try {
    await producer.send({
      topic: TOPICS.STATUS_CHANGED,
      messages: [{
        key: statusChange.orderId,
        value: JSON.stringify(statusChange),
        headers: {
          eventType: 'StatusChanged',
          timestamp: new Date().toISOString()
        }
      }]
    });
    logger.info(`Published StatusChanged event for order: ${statusChange.orderId}`);
  } catch (error) {
    logger.error('Failed to publish StatusChanged event:', error);
    throw error;
  }
}

module.exports = {
  kafkaProducer: producer,
  publishStatusChanged,
  TOPICS
};
