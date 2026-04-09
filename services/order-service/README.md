# Order Service

Microservice responsible for order creation and management.

## Features
- Create new orders
- Retrieve order details
- List all orders
- Publish order events to Kafka
- Cache orders in Redis

## API Endpoints

### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "customerId": "customer-123",
  "items": [
    {
      "productId": "prod-456",
      "name": "Product Name",
      "quantity": 2,
      "price": 29.99
    }
  ]
}
```

### Get Order by ID
```http
GET /api/orders/:id
```

### Get All Orders
```http
GET /api/orders?page=1&limit=20
```

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
