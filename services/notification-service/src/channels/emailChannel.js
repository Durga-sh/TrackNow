const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');
const config = require('../config');

let transporter = null;

/**
 * Initialize the email transporter.
 * If no SMTP credentials are provided, creates an Ethereal test account
 * so emails can be previewed at a URL without a real SMTP server.
 */
async function initTransporter() {
  if (transporter) return transporter;

  if (config.email.host && config.email.user) {
    // Production: use provided SMTP credentials
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
    logger.info('Email transporter initialized with provided SMTP config');
  } else {
    // Development: auto-create Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    logger.info('Email transporter initialized with Ethereal test account', {
      user: testAccount.user
    });
  }

  return transporter;
}

/**
 * Send an email notification.
 * @param {Object} options - { to, subject, html }
 * @returns {Object} - { success, messageId, previewUrl }
 */
async function sendEmail({ to, subject, html }) {
  try {
    const transport = await initTransporter();

    const info = await transport.sendMail({
      from: config.email.from,
      to,
      subject,
      html
    });

    // In dev (Ethereal), get the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to,
      subject,
      previewUrl
    });

    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    };
  } catch (error) {
    logger.error('Failed to send email', {
      to,
      subject,
      error: error.message
    });

    return {
      success: false,
      messageId: null,
      previewUrl: null,
      error: error.message
    };
  }
}

module.exports = { sendEmail, initTransporter };
