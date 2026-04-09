# Status Update Service

Microservice responsible for processing status updates and managing order lifecycle.

## Features
- Update order status via API
- Consume order events from Kafka
- Track status history
- Publish status change events
- Real-time status synchronization with Redis

## API Endpoints

### Update Order Status
```http
PUT /api/orders/:id/status
Content-Type: application/json

{
  "status": "SHIPPED",
  "notes": "Package shipped via FedEx"
}
```

### Get Status History
```http
GET /api/orders/:id/history
```

## Order Status Flow
1. CREATED
2. CONFIRMED
3. PROCESSING
4. SHIPPED
5. DELIVERED
6. CANCELLED (can occur at any stage)

## Environment Variables
- `PORT`: Service port (default: 3000)
- `KAFKA_BROKER`: Kafka broker address
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port

## Running Locally
```bash
npm install
npm run dev
```
