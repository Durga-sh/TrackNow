/**
 * Centralized configuration loaded from environment variables.
 * All service config is accessed through this module.
 */
const config = {
  port: parseInt(process.env.PORT, 10) || 3003,

  kafka: {
    broker: process.env.KAFKA_BROKER || 'localhost:9092',
    clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
    groupId: 'notification-group'
  },

  mongo: {
    uri: process.env.MONGO_URI
  },

  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@tracknow.app'
  }
};

module.exports = config;
