# WebSocket Service

Real-time communication service that broadcasts order updates to connected clients.

## Features
- WebSocket server for real-time updates
- Subscribe to order updates by order ID
- Consume events from Kafka and broadcast to clients
- Connection health monitoring with heartbeats
- Automatic reconnection handling

## WebSocket Connection

### Connect to Order Updates
```javascript
const ws = new WebSocket('ws://localhost:8080/orders/{orderId}');

ws.onopen = () => {
  console.log('Connected to order updates');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Update received:', message);
};
```

## Message Types

### Initial State
Sent immediately upon connection:
```json
{
  "type": "INITIAL_STATE",
  "data": {
    "orderId": "xxx",
    "status": "CREATED",
    "items": [...],
    "createdAt": "2025-12-08T..."
  }
}
```

### Status Changed
Broadcast when order status updates:
```json
{
  "type": "STATUS_CHANGED",
  "data": {
    "orderId": "xxx",
    "previousStatus": "CREATED",
    "currentStatus": "CONFIRMED",
    "timestamp": "2025-12-08T..."
  }
}
```

## Environment Variables
- `PORT`: WebSocket server port (default: 8080)
- `KAFKA_BROKER`: Kafka broker address
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port

## Running Locally
```bash
npm install
npm run dev
```
