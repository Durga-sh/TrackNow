# Redis Configuration

## Key Patterns

### Orders
- **Pattern**: `order:{orderId}`
- **Type**: String (JSON)
- **TTL**: 7 days
- **Description**: Complete order data

### Order History
- **Pattern**: `order:{orderId}:history`
- **Type**: List
- **TTL**: 7 days
- **Description**: Status change history

## Data Structures

### Order Object
```json
{
  "orderId": "uuid",
  "customerId": "string",
  "items": [
    {
      "productId": "string",
      "name": "string",
      "quantity": number,
      "price": number
    }
  ],
  "totalAmount": number,
  "status": "CREATED|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|CANCELLED",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Status History Entry
```json
{
  "from": "CREATED",
  "to": "CONFIRMED",
  "notes": "string",
  "timestamp": "ISO8601"
}
```

## Commands

### Connect to Redis CLI
```bash
docker exec -it tracknow-redis redis-cli
```

### View All Orders
```bash
KEYS order:*
```

### Get Order
```bash
GET order:{orderId}
```

### Get Order History
```bash
LRANGE order:{orderId}:history 0 -1
```

### Flush All Data (Development Only)
```bash
FLUSHALL
```

## Performance

- **Max Memory**: Not limited (configure for production)
- **Eviction Policy**: noeviction (configure for production)
- **Persistence**: AOF enabled
- **Snapshot**: Disabled by default
