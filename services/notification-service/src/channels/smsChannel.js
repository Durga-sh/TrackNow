const { logger } = require('../utils/logger');

/**
 * SMS Channel (Stub)
 * Ready for Twilio/AWS SNS integration.
 * Currently logs the SMS instead of sending it.
 */
async function sendSMS({ to, message }) {
  // TODO: Integrate with Twilio or AWS SNS
  // const client = require('twilio')(accountSid, authToken);
  // await client.messages.create({ body: message, to, from: TWILIO_NUMBER });

  logger.info('SMS notification (stub)', {
    to,
    message: message.substring(0, 100) + '...'
  });

  return {
    success: true,
    messageId: `sms-stub-${Date.now()}`,
    channel: 'sms'
  };
}

module.exports = { sendSMS };
