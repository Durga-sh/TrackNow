import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { orderAPI, statusAPI } from '../services/api';
import websocketService from '../services/webSocket';


function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetchOrderData();
    connectWebSocket();

    return () => {
      websocketService.disconnect();
    };
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      const [orderRes, historyRes] = await Promise.all([
        orderAPI.getOrder(orderId),
        statusAPI.getHistory(orderId)
      ]);

      setOrder(orderRes.data.data);
      setHistory(historyRes.data.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = async () => {
    try {
      await websocketService.connect(orderId);
      setConnected(true);

      websocketService.subscribe('STATUS_CHANGED', (data) => {
        setOrder(prev => ({ ...prev, status: data.currentStatus }));
        fetchOrderData(); // Refresh full data
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    }
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status.toLowerCase()}`;
  };

  if (loading) {
    return (
      <div className="order-tracking">
        <div className="card">
          <p className="loading">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-tracking">
        <div className="card">
          <p className="error">Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-tracking">
      <div className="card">
        <div className="tracking-header">
          <div>
            <h2>Order Tracking</h2>
            <p className="order-id">Order ID: {orderId}</p>
          </div>
          <div className="connection-status">
            <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
            {connected ? 'Live Updates Active' : 'Disconnected'}
          </div>
        </div>

        <div className="current-status">
          <h3>Current Status</h3>
          <span className={getStatusClass(order.status)}>{order.status}</span>
        </div>

        <div className="order-info">
          <h3>Order Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Customer ID:</label>
              <span>{order.customerId}</span>
            </div>
            <div className="info-item">
              <label>Total Amount:</label>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="info-item">
              <label>Created:</label>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="info-item">
              <label>Last Updated:</label>
              <span>{new Date(order.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="order-items">
          <h3>Items</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="status-history">
          <h3>Status History</h3>
          {history.length === 0 ? (
            <p className="no-history">No status history available</p>
          ) : (
            <div className="timeline">
              {history.map((entry, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-status">
                      {entry.from && <span className={getStatusClass(entry.from)}>{entry.from}</span>}
                      {entry.from && <span className="arrow">→</span>}
                      <span className={getStatusClass(entry.to)}>{entry.to}</span>
                    </div>
                    {entry.notes && <p className="timeline-notes">{entry.notes}</p>}
                    <p className="timeline-time">{new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderTracking;
