const { Kafka } = require('kafkajs');
const { logger } = require('../utils/logger');

let dlqProducer = null;

/**
 * Initialize a Kafka producer dedicated to publishing failed messages to DLQ topics.
 * Must be called once during service startup.
 */
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

/**
 * Disconnect the DLQ producer gracefully.
 */
async function disconnectDLQProducer() {
  if (dlqProducer) {
    await dlqProducer.disconnect();
    logger.info('DLQ producer disconnected');
  }
}

/**
 * Publish a failed message to the Dead Letter Queue topic.
 * DLQ topic name = originalTopic + '.dlq' (e.g., 'order.created.dlq')
 */
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

/**
 * Wrap a message handler with retry logic and DLQ fallback.
 * 
 * On failure:
 *   1. Retries up to `maxRetries` times with exponential backoff
 *   2. If all retries fail, publishes the original message to <topic>.dlq
 * 
 * @param {Function} handler - async function({ topic, partition, message })
 * @param {Object} options - { maxRetries, baseDelayMs }
 * @returns {Function} - wrapped handler for consumer.run({ eachMessage })
 */
function withRetry(handler, options = {}) {
  const { maxRetries = 3, baseDelayMs = 1000 } = options;

  return async ({ topic, partition, message }) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        await handler({ topic, partition, message });
        return; // Success — exit
      } catch (error) {
        lastError = error;

        if (attempt <= maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1); // 1s, 2s, 4s
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

    // All retries exhausted — send to DLQ
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
