const { publishStatusChanged } = require('../kafka/producer');
const { redisClient } = require('../redis/client');
const { logger } = require('../utils/logger');
const Order = require('../models/Order');
const StatusHistory = require('../models/statusHistroy');

const ORDER_STATUSES = {
  CREATED: 'CREATED',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

class StatusService {
  async updateStatus(orderId, newStatus, notes = '') {
    // 1. Get current order from MongoDB
    const orderDoc = await Order.findOne({ orderId });
    
    if (!orderDoc) {
      return null;
    }

    const previousStatus = orderDoc.status;

    // 2. Update order status in MongoDB
    orderDoc.status = newStatus;
    orderDoc.updatedAt = new Date();
    await orderDoc.save();

    // 3. Store status history in MongoDB
    await StatusHistory.create({
      orderId,
      fromStatus: previousStatus,
      toStatus: newStatus,
      notes,
      timestamp: new Date()
    });

    // 4. Update Redis cache
    const order = {
      orderId: orderDoc.orderId,
      customerId: orderDoc.customerId,
      items: orderDoc.items,
      totalAmount: orderDoc.totalAmount,
      status: orderDoc.status,
      createdAt: orderDoc.createdAt.toISOString(),
      updatedAt: orderDoc.updatedAt.toISOString()
    };

    const orderKey = `order:${orderId}`;
    await redisClient.set(orderKey, JSON.stringify(order));
    await redisClient.expire(orderKey, 7 * 24 * 60 * 60);

    // 5. Publish status change event
    await publishStatusChanged({
      orderId,
      previousStatus,
      currentStatus: newStatus,
      notes,
      timestamp: order.updatedAt
    });

    logger.info(`Status updated for order ${orderId}: ${previousStatus} -> ${newStatus}`);
    return order;
  }

  async getStatusHistory(orderId) {
    // Load history from MongoDB
    const history = await StatusHistory.find({ orderId })
      .sort({ timestamp: 1 })
      .lean();

    return history.map(entry => ({
      from: entry.fromStatus,
      to: entry.toStatus,
      notes: entry.notes,
      timestamp: entry.timestamp.toISOString(),
      changedBy: entry.changedBy
    }));
  }

  async addStatusHistory(orderId, statusChange) {
    // This method is kept for backward compatibility
    // but now uses MongoDB instead of Redis
    await StatusHistory.create({
      orderId,
      fromStatus: statusChange.from,
      toStatus: statusChange.to,
      notes: statusChange.notes,
      timestamp: new Date(statusChange.timestamp)
    });
  }
}

module.exports = new StatusService();
