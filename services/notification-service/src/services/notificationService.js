const { logger } = require('../utils/logger');
const { sendEmail } = require('../channels/emailChannel');
const { orderCreatedTemplate } = require('../templates/orderCreated');
const { statusChangedTemplate } = require('../templates/statusChanged');
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
   * Handle order.created event — send confirmation email.
   */
  async onOrderCreated(order) {
    const template = orderCreatedTemplate(order);

    // Use the customer's actual email from the order
    const recipientEmail = order.customerEmail;

    const result = await sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html
    });

    // Persist notification log
    await NotificationLog.create({
      orderId: order.orderId,
      customerId: order.customerId,
      channel: 'email',
      type: 'ORDER_CREATED',
      recipient: recipientEmail,
      subject: template.subject,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      previewUrl: result.previewUrl,
      error: result.error || null,
      metadata: { totalAmount: order.totalAmount, itemCount: (order.items || []).length }
    });

    logger.info(`Order created notification processed`, {
      orderId: order.orderId,
      channel: 'email',
      status: result.success ? 'sent' : 'failed',
      previewUrl: result.previewUrl
    });
  }

  /**
   * Handle order.status.changed event — send status update email.
   */
  async onStatusChanged(event) {
    const template = statusChangedTemplate(event);

    // Use the customer's actual email (look up from order if not in event)
    const recipientEmail = event.customerEmail || `customer-${event.orderId.substring(0, 8)}@tracknow.app`;

    const result = await sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html
    });

    // Persist notification log
    await NotificationLog.create({
      orderId: event.orderId,
      customerId: event.customerId || 'unknown',
      channel: 'email',
      type: 'STATUS_CHANGED',
      recipient: recipientEmail,
      subject: template.subject,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      previewUrl: result.previewUrl,
      error: result.error || null,
      metadata: { previousStatus: event.previousStatus, currentStatus: event.currentStatus }
    });

    logger.info(`Status change notification processed`, {
      orderId: event.orderId,
      channel: 'email',
      from: event.previousStatus,
      to: event.currentStatus,
      status: result.success ? 'sent' : 'failed',
      previewUrl: result.previewUrl
    });
  }
}

module.exports = new NotificationService();
