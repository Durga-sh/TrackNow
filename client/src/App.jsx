import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CreateOrder from './components/CreateOrder';
import OrderList from './components/OrderList';
import OrderTracking from './components/OrderTracking';
import './App.css';

function App() {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <div className="container">
            <h1>📦 TrackNow</h1>
            <p>Real-time Order Tracking System</p>
          </div>
        </header>

        <nav className="app-nav">
          <div className="container">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/create" className="nav-link">Create Order</Link>
            <Link to="/orders" className="nav-link">All Orders</Link>
          </div>
        </nav>

        {notification && (
          <div className={`notification notification-${notification.type}`}>
            {notification.message}
          </div>
        )}

        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateOrder showNotification={showNotification} />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/track/:orderId" element={<OrderTracking />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="container">
            <p>&copy; 2025 TrackNow. Real-time order tracking with Kafka, Redis & WebSockets.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div className="home">
      <div className="card">
        <h2>Welcome to TrackNow</h2>
        <p>A real-time, event-driven order tracking system powered by:</p>
        <ul className="tech-list">
          <li>🔄 <strong>Kafka</strong> - Event streaming</li>
          <li>⚡ <strong>Redis</strong> - Low-latency caching</li>
          <li>🔌 <strong>WebSockets</strong> - Real-time updates</li>
          <li>🏗️ <strong>Microservices</strong> - Scalable architecture</li>
        </ul>
        <div className="home-actions">
          <Link to="/create" className="btn btn-primary">Create New Order</Link>
          <Link to="/orders" className="btn btn-secondary">View All Orders</Link>
        </div>
      </div>
    </div>
  );
}

export default App;
