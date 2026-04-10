import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';


function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAllOrders();
      setOrders(response.data.data.orders || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status.toLowerCase()}`;
  };

  if (loading) {
    return (
      <div className="order-list">
        <div className="card">
          <p className="loading">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-list">
        <div className="card">
          <p className="error">{error}</p>
          <button className="btn btn-primary" onClick={fetchOrders}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-list">
      <div className="card">
        <div className="list-header">
          <h2>All Orders</h2>
          <button className="btn btn-secondary" onClick={fetchOrders}>Refresh</button>
        </div>

        {orders.length === 0 ? (
          <p className="no-orders">No orders found. <Link to="/create">Create one</Link></p>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div key={order.orderId} className="order-card">
                <div className="order-header">
                  <h3>Order #{order.orderId.substring(0, 8)}</h3>
                  <span className={getStatusClass(order.status)}>{order.status}</span>
                </div>

                <div className="order-details">
                  <p><strong>Customer:</strong> {order.customerId}</p>
                  <p><strong>Items:</strong> {order.items.length}</p>
                  <p><strong>Total:</strong> ${order.totalAmount.toFixed(2)}</p>
                  <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                </div>

                <Link to={`/track/${order.orderId}`} className="btn btn-primary">
                  Track Order
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderList;
