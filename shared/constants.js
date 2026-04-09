module.exports = {
  ORDER_STATUSES: {
    CREATED: 'CREATED',
    CONFIRMED: 'CONFIRMED',
    PROCESSING: 'PROCESSING',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED'
  },

  KAFKA_TOPICS: {
    ORDER_CREATED: 'order.created',
    ORDER_UPDATED: 'order.updated',
    STATUS_CHANGED: 'order.status.changed'
  },

  REDIS_KEYS: {
    ORDER_PREFIX: 'order:',
    ORDER_HISTORY_PREFIX: 'order:',
    ORDER_HISTORY_SUFFIX: ':history'
  },

  EVENT_TYPES: {
    ORDER_CREATED: 'OrderCreated',
    ORDER_UPDATED: 'OrderUpdated',
    STATUS_CHANGED: 'StatusChanged'
  }
};
