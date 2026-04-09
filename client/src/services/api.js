import axios from 'axios';

const ORDER_SERVICE_URL = process.env.REACT_APP_ORDER_SERVICE_URL || 'http://localhost:3001';
const STATUS_SERVICE_URL = process.env.REACT_APP_STATUS_SERVICE_URL || 'http://localhost:3002';

const api = axios.create({
  timeout: 10000,
});

// Order Service APIs
export const orderAPI = {
  createOrder: (data) => api.post(`${ORDER_SERVICE_URL}/api/orders`, data),
  getOrder: (orderId) => api.get(`${ORDER_SERVICE_URL}/api/orders/${orderId}`),
  getAllOrders: (page = 1, limit = 20) => api.get(`${ORDER_SERVICE_URL}/api/orders?page=${page}&limit=${limit}`),
};

// Status Service APIs
export const statusAPI = {
  updateStatus: (orderId, data) => api.put(`${STATUS_SERVICE_URL}/api/orders/${orderId}/status`, data),
  getHistory: (orderId) => api.get(`${STATUS_SERVICE_URL}/api/orders/${orderId}/history`),
};

export default api;
