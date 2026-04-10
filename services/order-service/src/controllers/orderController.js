const orderService = require('../services/orderService');
const { validateOrder } = require('../validators/ordervalidator');
const { logger } = require('../utils/logger');

class OrderController {
  async createOrder(req, res, next) {
    try {
      const { error } = validateOrder(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const order = await orderService.createOrder(req.body);
      logger.info(`Order created: ${order.orderId}`);
      
      res.status(201).json({
        success: true,
        data: order
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllOrders(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const orders = await orderService.getAllOrders(parseInt(page), parseInt(limit));
      
      res.json({
        success: true,
        data: orders
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrderController();
