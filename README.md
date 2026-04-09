# TrackNow - Real-Time Order Tracking System

A real-time, event-driven order tracking system using microservices architecture, Kafka for streaming order events, and Redis for low-latency status caching, with WebSockets providing instant client updates.

## 🎯 Core Features

- **Order Creation**: Create and manage orders through REST API
- **Order Status Updates**: Real-time status updates across the system
- **Kafka Event Streaming**: Publish and consume order events
- **Redis Caching**: Low-latency status caching for instant retrieval
- **Real-Time UI Updates**: WebSocket-based live updates to connected clients
- **Microservices Communication**: Event-driven architecture for scalability

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Client    │◄────►│  WebSocket   │◄────►│  Status Update  │
│  (Browser)  │      │   Service    │      │     Service     │
└─────────────┘      └──────────────┘      └─────────────────┘
                              │                      │
                              ▼                      ▼
                         ┌────────┐            ┌────────┐
                         │ Redis  │            │ Kafka  │
                         └────────┘            └────────┘
                              ▲                      ▲
                              │                      │
                     ┌────────────────┐              │
                     │ Order Service  │──────────────┘
                     └────────────────┘
```

## 📁 Project Structure

### Microservices
- **order-service**: Handles order creation and management
- **status-update-service**: Processes status updates and notifications
- **websocket-service**: Manages real-time client connections

### Infrastructure
- **Kafka**: Event streaming platform
- **Redis**: In-memory caching layer
- **Docker**: Containerization for all services

## 🚀 Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 🔧 Technology Stack

- **Backend**: Node.js / Python / Java (choose per service)
- **Message Broker**: Apache Kafka
- **Cache**: Redis
- **Real-time Communication**: WebSockets
- **Containerization**: Docker & Docker Compose
- **Frontend**: React with WebSocket client

## 📊 API Endpoints

### Order Service
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders` - List all orders

### Status Update Service
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/orders/:id/history` - Get status history

### WebSocket Service
- `ws://localhost:8080/orders/:id` - Subscribe to order updates

## 🔄 Event Flow

1. Client creates order → Order Service
2. Order Service publishes `OrderCreated` event → Kafka
3. Status Update Service consumes event → Updates Redis
4. WebSocket Service reads from Redis → Pushes to connected clients
5. Client receives real-time update

## 📝 License

MIT
