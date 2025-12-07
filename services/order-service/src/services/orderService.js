const { v4: uuidv4 } = require('uuid');
const { publishOrderCreated } = require('../kafka/producer');
const { redisClient } = require('../redis/client');
const { logger } = require('../utils/logger');

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

    // Store in Redis
    await this.storeOrder(order);

    // Publish to Kafka
    await publishOrderCreated(order);

    logger.info(`Order ${order.orderId} created and event published`);
    return order;
  }

  async getOrderById(orderId) {
    const orderKey = `order:${orderId}`;
    const orderData = await redisClient.get(orderKey);
    
    if (!orderData) {
      return null;
    }

    return JSON.parse(orderData);
  }

  async getAllOrders(page = 1, limit = 20) {
    const pattern = 'order:*';
    const keys = [];
    
    // Scan for all order keys
    for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keys.push(key);
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedKeys = keys.slice(start, end);

    const orders = await Promise.all(
      paginatedKeys.map(async (key) => {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      })
    );

    return {
      orders: orders.filter(order => order !== null),
      total: keys.length,
      page,
      totalPages: Math.ceil(keys.length / limit)
    };
  }

  async storeOrder(order) {
    const orderKey = `order:${order.orderId}`;
    await redisClient.set(orderKey, JSON.stringify(order));
    
    // Set expiration (optional - 7 days)
    await redisClient.expire(orderKey, 7 * 24 * 60 * 60);
  }

  calculateTotal(items) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
}

module.exports = new OrderService();
