const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');

// Update order status
router.put('/:id/status', statusController.updateOrderStatus);

// Get order status history
router.get('/:id/history', statusController.getStatusHistory);

module.exports = router;
