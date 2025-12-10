const { Kafka } = require('kafkajs');
const { logger } = require('../utils/logger');
const statusService = require('../services/statusService');

const kafka = new Kafka({
  clientId: 'status-update-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9093']
});

const consumer = kafka.consumer({ groupId: 'status-update-group' });

const TOPICS = {
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated'
};

async function startConsumer() {
  await consumer.connect();
  
  // Subscribe to topics
  await consumer.subscribe({ 
    topics: [TOPICS.ORDER_CREATED, TOPICS.ORDER_UPDATED], 
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

        switch (topic) {
          case TOPICS.ORDER_CREATED:
            await statusService.processOrderCreatedEvent(event);
            break;
          case TOPICS.ORDER_UPDATED:
            logger.info(`Order updated event received: ${event.orderId}`);
            break;
          default:
            logger.warn(`Unknown topic: ${topic}`);
        }
      } catch (error) {
        logger.error('Error processing message:', error);
      }
    }
  });

  logger.info('Kafka consumer is running');
}

module.exports = {
  kafkaConsumer: consumer,
  startConsumer,
  TOPICS
};
