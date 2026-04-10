const { v4: uuidv4 } = require('uuid');
const { publishOrderCreated } = require('../kafka/producer');
const { redisClient } = require('../redis/client');
const { logger } = require('../utils/logger');
const Order = require('../models/Order');

class OrderService {
  async createOrder(orderData) {
    const order = {
      orderId: uuidv4(),
      customerId: orderData.customerId,
      items: orderData.items,
      totalAmount: this.calculateTotal(orderData.items),
      status: 'CREATED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Save to MongoDB (permanent storage)
    await Order.create({
      orderId: order.orderId,
      customerId: order.customerId,
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status
    });

    // 2. Cache in Redis (fast access)
    await this.storeOrder(order);

    // 3. Publish to Kafka (event notification)
    await publishOrderCreated(order);

    logger.info(`Order ${order.orderId} created in DB and cached in Redis`);
    return order;
  }

  async getOrderById(orderId) {
    // Try Redis first (cache hit)
    const orderKey = `order:${orderId}`;
    const cachedOrder = await redisClient.get(orderKey);
    
    if (cachedOrder) {
      logger.info(`Order ${orderId} found in cache`);
      return JSON.parse(cachedOrder);
    }

    // Cache miss - load from MongoDB
    logger.info(`Order ${orderId} not in cache, loading from DB`);
    const orderDoc = await Order.findOne({ orderId }).lean();
    
    if (!orderDoc) {
      return null;
    }

    // Convert MongoDB document to API format
    const order = {
      orderId: orderDoc.orderId,
      customerId: orderDoc.customerId,
      items: orderDoc.items,
      totalAmount: orderDoc.totalAmount,
      status: orderDoc.status,
      createdAt: orderDoc.createdAt.toISOString(),
      updatedAt: orderDoc.updatedAt.toISOString()
    };

    // Repopulate cache
    await this.storeOrder(order);

    return order;
  }

  async getAllOrders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Load from MongoDB with pagination
    const [orders, total] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments()
    ]);

    // Convert to API format
    const formattedOrders = orders.map(doc => ({
      orderId: doc.orderId,
      customerId: doc.customerId,
      items: doc.items,
      totalAmount: doc.totalAmount,
      status: doc.status,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString()
    }));

    return {
      orders: formattedOrders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async storeOrder(order) {
    const orderKey = `order:${order.orderId}`;
    await redisClient.set(orderKey, JSON.stringify(order));
    
    // Set expiration (7 days) for cache
    await redisClient.expire(orderKey, 7 * 24 * 60 * 60);
  }

  calculateTotal(items) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
}

module.exports = new OrderService();
