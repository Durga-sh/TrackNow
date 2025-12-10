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

  async processOrderCreatedEvent(order) {
    logger.info(`Processing OrderCreated event for order: ${order.orderId}`);
    
    try {
      // 1. Check if order exists first
      let orderDoc = await Order.findOne({ orderId: order.orderId });
      
      if (!orderDoc) {
        // Create new order
        orderDoc = await Order.create({
          orderId: order.orderId,
          customerId: order.customerId,
          items: order.items,
          totalAmount: order.totalAmount,
          status: order.status
        });
        logger.info(`Order ${order.orderId} created in MongoDB`);
      } else {
        logger.info(`Order ${order.orderId} already exists in MongoDB`);
      }
      
      // 2. Cache in Redis
      const orderData = {
        orderId: orderDoc.orderId,
        customerId: orderDoc.customerId,
        items: orderDoc.items,
        totalAmount: orderDoc.totalAmount,
        status: orderDoc.status,
        createdAt: orderDoc.createdAt.toISOString(),
        updatedAt: orderDoc.updatedAt.toISOString()
      };
      await redisClient.set(`order:${order.orderId}`, JSON.stringify(orderData));
      await redisClient.expire(`order:${order.orderId}`, 7 * 24 * 60 * 60);
      
      // 3. Initialize status history (only if not exists)
      const historyExists = await StatusHistory.findOne({ 
        orderId: order.orderId, 
        toStatus: order.status,
        fromStatus: null 
      });
      
      if (!historyExists) {
        await StatusHistory.create({
          orderId: order.orderId,
          fromStatus: null,
          toStatus: order.status,
          notes: 'Order created',
          timestamp: new Date()
        });
        logger.info(`Status history created for order ${order.orderId}`);
      }
      
      logger.info(`Order ${order.orderId} fully processed`);
    } catch (error) {
      logger.error(`Error processing order ${order.orderId}:`, error);
      // Don't throw - let Kafka consumer continue
    }
  }
}

module.exports = new StatusService();
