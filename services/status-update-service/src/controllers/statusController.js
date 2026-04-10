const statusService = require('../services/statusService');
const { validateStatusUpdate } = require('../validators/statusValidator');
const { logger } = require('../utils/logger');

class StatusController {
  async updateOrderStatus(req, res, next) {
    try {
      const { error } = validateStatusUpdate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const orderId = req.params.id;
      const { status, notes } = req.body;

      const updatedOrder = await statusService.updateStatus(orderId, status, notes);
      
      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      logger.info(`Order ${orderId} status updated to ${status}`);
      
      res.json({
        success: true,
        data: updatedOrder
      });
    } catch (err) {
      next(err);
    }
  }

  async getStatusHistory(req, res, next) {
    try {
      const orderId = req.params.id;
      const history = await statusService.getStatusHistory(orderId);
      
      res.json({
        success: true,
        data: history
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StatusController();
