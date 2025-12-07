# Testing Order Service with Zod Validation

## Prerequisites
Before running the service, make sure you have:
1. **Redis** running on `localhost:6379`
2. **Kafka** running on `localhost:9092`

## How to Run

1. **Start the service:**
   ```bash
   npm start
   ```

2. **Check health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

## Testing Zod Validation

### Test 1: Valid Order (Should work ✓)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d "{\"customerId\":\"customer-123\",\"items\":[{\"productId\":\"prod-1\",\"name\":\"Laptop\",\"quantity\":2,\"price\":999.99}]}"
```

### Test 2: Missing customerId (Should fail ✗)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"productId\":\"prod-1\",\"name\":\"Laptop\",\"quantity\":2,\"price\":999.99}]}"
```

### Test 3: Invalid quantity (negative) (Should fail ✗)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d "{\"customerId\":\"customer-123\",\"items\":[{\"productId\":\"prod-1\",\"name\":\"Laptop\",\"quantity\":-1,\"price\":999.99}]}"
```

### Test 4: Invalid price (negative/zero) (Should fail ✗)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d "{\"customerId\":\"customer-123\",\"items\":[{\"productId\":\"prod-1\",\"name\":\"Laptop\",\"quantity\":2,\"price\":-50}]}"
```

### Test 5: Empty items array (Should fail ✗)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d "{\"customerId\":\"customer-123\",\"items\":[]}"
```

### Test 6: Get all orders
```bash
curl http://localhost:3000/api/orders
```

### Test 7: Get order by ID
```bash
curl http://localhost:3000/api/orders/{orderId}
```

## Expected Responses

**Valid Order:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid-here",
    "customerId": "customer-123",
    "items": [...],
    "totalAmount": 1999.98,
    "status": "CREATED",
    "createdAt": "2025-12-08T...",
    "updatedAt": "2025-12-08T..."
  }
}
```

**Validation Error:**
```json
{
  "error": "Required" // or other Zod error message
}
```

## Quick Start (if Redis/Kafka not running)

If you don't have Redis or Kafka running, the service will fail to start. You can:

1. **Install and start Redis:**
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis
   ```

2. **Install and start Kafka:**
   ```bash
   # Using Docker
   docker run -d -p 9092:9092 apache/kafka
   ```
