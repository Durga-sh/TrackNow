const twilio = require('twilio');
const { logger } = require('../utils/logger');
const config = require('../config');

let client = null;


const DEFAULT_COUNTRY_CODE = '+91';

function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.length > 10) {
    return '+' + cleaned;
  }
  return DEFAULT_COUNTRY_CODE + cleaned;
}

function initTwilioClient() {
  if (client) return client;

  if (config.sms.accountSid && config.sms.authToken) {
    client = twilio(config.sms.accountSid, config.sms.authToken);
    logger.info('Twilio SMS client initialized');
  } else {
    logger.warn('Twilio credentials not configured — SMS will run in stub mode (logged only)');
  }

  return client;
}

async function sendSMS({ to, message }) {
  try {
    const twilioClient = initTwilioClient();
    const formattedNumber = formatPhoneNumber(to);
    if (!twilioClient) {
      logger.info('SMS notification (stub mode)', {
        to: formattedNumber,
        message: message.substring(0, 100),
        note: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env to enable real SMS'
      });

      return {
        success: true,
        messageId: `sms-stub-${Date.now()}`,
        channel: 'sms'
      };
    }

    // Real Twilio SMS
    const result = await twilioClient.messages.create({
      body: message,
      to: formattedNumber,
      from: config.sms.fromNumber
    });

    logger.info('SMS sent successfully via Twilio', {
      messageId: result.sid,
      to,
      status: result.status
    });

    return {
      success: true,
      messageId: result.sid,
      channel: 'sms'
    };
  } catch (error) {
    logger.error('Failed to send SMS', {
      to,
      error: error.message,
      code: error.code
    });

    return {
      success: false,
      messageId: null,
      channel: 'sms',
      error: error.message
    };
  }
}

module.exports = { sendSMS, initTwilioClient };
