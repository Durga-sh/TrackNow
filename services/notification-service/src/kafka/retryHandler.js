const { Kafka } = require('kafkajs');
const { logger } = require('../utils/logger');

let dlqProducer = null;

async function initDLQProducer(brokers) {
  const kafka = new Kafka({
    clientId: `${process.env.KAFKA_CLIENT_ID || 'service'}-dlq`,
    brokers: Array.isArray(brokers) ? brokers : [brokers]
  });

  dlqProducer = kafka.producer();
  await dlqProducer.connect();
  logger.info('DLQ producer connected');
  return dlqProducer;
}

async function disconnectDLQProducer() {
  if (dlqProducer) {
    await dlqProducer.disconnect();
    logger.info('DLQ producer disconnected');
  }
}

async function publishToDLQ({ topic, message, error, retryCount = 0 }) {
  if (!dlqProducer) {
    logger.error('DLQ producer not initialized — failed message will be lost', {
      topic,
      offset: message.offset
    });
    return;
  }

  const dlqTopic = `${topic}.dlq`;

  try {
    await dlqProducer.send({
      topic: dlqTopic,
      messages: [{
        key: message.key,
        value: message.value,
        headers: {
          ...message.headers,
          'x-original-topic': Buffer.from(topic),
          'x-error-message': Buffer.from(error.message || 'Unknown error'),
          'x-failed-at': Buffer.from(new Date().toISOString()),
          'x-retry-count': Buffer.from(String(retryCount))
        }
      }]
    });

    logger.warn(`Message sent to DLQ: ${dlqTopic}`, {
      originalTopic: topic,
      offset: message.offset,
      error: error.message
    });
  } catch (dlqError) {
    logger.error(`Failed to publish to DLQ: ${dlqTopic}`, {
      originalTopic: topic,
      offset: message.offset,
      dlqError: dlqError.message
    });
  }
}

function withRetry(handler, options = {}) {
  const { maxRetries = 3, baseDelayMs = 1000 } = options;

  return async ({ topic, partition, message }) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        await handler({ topic, partition, message });
        return;
      } catch (error) {
        lastError = error;

        if (attempt <= maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          logger.warn(`Retry ${attempt}/${maxRetries} for message on ${topic}`, {
            partition,
            offset: message.offset,
            error: error.message,
            nextRetryMs: delay
          });
          await sleep(delay);
        }
      }
    }

    logger.error(`All ${maxRetries} retries exhausted for message on ${topic} — sending to DLQ`, {
      partition,
      offset: message.offset,
      error: lastError.message
    });

    await publishToDLQ({ topic, message, error: lastError, retryCount: maxRetries });
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  withRetry,
  initDLQProducer,
  disconnectDLQProducer,
  publishToDLQ
};
