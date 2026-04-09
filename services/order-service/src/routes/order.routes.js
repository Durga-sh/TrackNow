const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Create new order
router.post('/', orderController.createOrder);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Get all orders
router.get('/', orderController.getAllOrders);

module.exports = router;
