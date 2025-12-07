const { Kafka } = require('kafkajs');
const { logger } = require('../utils/logger');

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

const TOPICS = {
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated'
};

async function publishOrderCreated(order) {
  try {
    await producer.send({
      topic: TOPICS.ORDER_CREATED,
      messages: [{
        key: order.orderId,
        value: JSON.stringify(order),
        headers: {
          eventType: 'OrderCreated',
          timestamp: new Date().toISOString()
        }
      }]
    });
    logger.info(`Published OrderCreated event for order: ${order.orderId}`);
  } catch (error) {
    logger.error('Failed to publish OrderCreated event:', error);
    throw error;
  }
}

module.exports = {
  kafkaProducer: producer,
  publishOrderCreated,
  TOPICS
};
