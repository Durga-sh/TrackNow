const { logger } = require('../utils/logger');
const { sendEmail } = require('../channels/emailChannel');
const { sendSMS } = require('../channels/smsChannel');
const { orderCreatedTemplate } = require('../templates/orderCreated');
const { statusChangedTemplate } = require('../templates/statusChanged');
const { orderCreatedSMS, statusChangedSMS } = require('../templates/smsTemplates');
const NotificationLog = require('../models/NotificationLog');

const TOPICS = {
  ORDER_CREATED: 'order.created',
  STATUS_CHANGED: 'order.status.changed'
};

class NotificationService {
  /**
   * Route incoming Kafka events to the appropriate notification channel.
   * @param {string} topic - Kafka topic name
   * @param {Object} event - Parsed event payload
   */
  async handleEvent(topic, event) {
    switch (topic) {
      case TOPICS.ORDER_CREATED:
        await this.onOrderCreated(event);
        break;

      case TOPICS.STATUS_CHANGED:
        await this.onStatusChanged(event);
        break;

      default:
        logger.warn(`No notification handler for topic: ${topic}`);
    }
  }

  /**
   * Handle order.created event — send email + SMS confirmation.
   */
  async onOrderCreated(order) {
    // --- Email Notification ---
    const emailTemplate = orderCreatedTemplate(order);
    const recipientEmail = order.customerEmail;

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    });

    await NotificationLog.create({
      orderId: order.orderId,
      customerId: order.customerId,
      channel: 'email',
      type: 'ORDER_CREATED',
      recipient: recipientEmail,
      subject: emailTemplate.subject,
      status: emailResult.success ? 'sent' : 'failed',
      messageId: emailResult.messageId,
      previewUrl: emailResult.previewUrl,
      error: emailResult.error || null,
      metadata: { totalAmount: order.totalAmount, itemCount: (order.items || []).length }
    });

    logger.info(`Order created email notification processed`, {
      orderId: order.orderId,
      channel: 'email',
      status: emailResult.success ? 'sent' : 'failed'
    });

    // --- SMS Notification (only if phone number provided) ---
    if (order.customerPhone) {
      const smsTemplate = orderCreatedSMS(order);

      const smsResult = await sendSMS({
        to: order.customerPhone,
        message: smsTemplate.message
      });

      await NotificationLog.create({
        orderId: order.orderId,
        customerId: order.customerId,
        channel: 'sms',
        type: 'ORDER_CREATED',
        recipient: order.customerPhone,
        subject: 'Order Confirmation SMS',
        status: smsResult.success ? 'sent' : 'failed',
        messageId: smsResult.messageId,
        error: smsResult.error || null,
        metadata: { totalAmount: order.totalAmount }
      });

      logger.info(`Order created SMS notification processed`, {
        orderId: order.orderId,
        channel: 'sms',
        status: smsResult.success ? 'sent' : 'failed'
      });
    }
  }

  /**
   * Handle order.status.changed event — send email + SMS status update.
   */
  async onStatusChanged(event) {
    // --- Email Notification ---
    const emailTemplate = statusChangedTemplate(event);
    const recipientEmail = event.customerEmail || `customer-${event.orderId.substring(0, 8)}@tracknow.app`;

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    });

    await NotificationLog.create({
      orderId: event.orderId,
      customerId: event.customerId || 'unknown',
      channel: 'email',
      type: 'STATUS_CHANGED',
      recipient: recipientEmail,
      subject: emailTemplate.subject,
      status: emailResult.success ? 'sent' : 'failed',
      messageId: emailResult.messageId,
      previewUrl: emailResult.previewUrl,
      error: emailResult.error || null,
      metadata: { previousStatus: event.previousStatus, currentStatus: event.currentStatus }
    });

    logger.info(`Status change email notification processed`, {
      orderId: event.orderId,
      channel: 'email',
      status: emailResult.success ? 'sent' : 'failed'
    });

    // --- SMS Notification (only if phone number provided) ---
    if (event.customerPhone) {
      const smsTemplate = statusChangedSMS(event);

      const smsResult = await sendSMS({
        to: event.customerPhone,
        message: smsTemplate.message
      });

      await NotificationLog.create({
        orderId: event.orderId,
        customerId: event.customerId || 'unknown',
        channel: 'sms',
        type: 'STATUS_CHANGED',
        recipient: event.customerPhone,
        subject: 'Status Update SMS',
        status: smsResult.success ? 'sent' : 'failed',
        messageId: smsResult.messageId,
        error: smsResult.error || null,
        metadata: { previousStatus: event.previousStatus, currentStatus: event.currentStatus }
      });

      logger.info(`Status change SMS notification processed`, {
        orderId: event.orderId,
        channel: 'sms',
        status: smsResult.success ? 'sent' : 'failed'
      });
    }
  }
}

module.exports = new NotificationService();
