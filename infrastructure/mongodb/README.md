# MongoDB Integration

MongoDB has been integrated as the permanent data store with Redis serving as a caching layer.

## 📊 Database Schema

### Orders Collection

```javascript
{
  orderId: String (unique, indexed),
  customerId: String (indexed),
  items: [{
    productId: String,
    name: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: String (CREATED|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|CANCELLED),
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `orderId` (unique)
- `customerId`
- `status`
- `createdAt` (descending)
- Compound: `customerId + createdAt`
- Compound: `status + createdAt`

### Status History Collection

```javascript
{
  orderId: String (indexed),
  fromStatus: String (nullable),
  toStatus: String,
  notes: String,
  changedBy: String (default: 'system'),
  timestamp: Date (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `orderId`
- `timestamp`
- Compound: `orderId + timestamp` (descending)

## 🔄 Hybrid Architecture (MongoDB + Redis)

### Write Flow
```
1. Save to MongoDB    ← Permanent storage
2. Cache in Redis     ← Fast access (7-day TTL)
3. Publish to Kafka   ← Event notification
```

### Read Flow
```
1. Check Redis        ← Cache hit (< 1ms)
   ├─ Found? Return
   └─ Not found?
2. Load from MongoDB  ← Cache miss
3. Repopulate Redis   ← Update cache
4. Return data
```

## 🚀 Quick Start

### 1. Start MongoDB with Docker

```powershell
# Start all services including MongoDB
docker-compose up -d

# Or start MongoDB only
docker-compose up -d mongodb

# Verify MongoDB is running
docker exec -it tracknow-mongodb mongosh
```

### 2. MongoDB Shell Commands

```javascript
// Connect to database
use tracknow

// View all orders
db.orders.find().pretty()

// Count orders by status
db.orders.countDocuments({ status: "CREATED" })

// Find orders by customer
db.orders.find({ customerId: "customer-123" })

// View status history
db.status_history.find({ orderId: "xxx" }).sort({ timestamp: 1 })

// Aggregation - Orders by status
db.orders.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Find orders with total > $100
db.orders.find({ totalAmount: { $gt: 100 } })

// Delete all data (development only)
db.orders.deleteMany({})
db.status_history.deleteMany({})
```

### 3. Local Development Setup

```powershell
# Order Service
cd d:\TrackNow\services\order-service
npm install  # Installs mongoose
npm run dev

# Status Update Service
cd d:\TrackNow\services\status-update-service
npm install  # Installs mongoose
npm run dev
```

### 4. Environment Variables

Create `.env` in each service:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/tracknow

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKER=localhost:9093
```

## 📈 Data Persistence Benefits

| Feature | Redis Only | MongoDB + Redis |
|---------|-----------|-----------------|
| Data durability | ❌ Lost on crash | ✅ Persisted |
| Data retention | ⚠️ 7 days max | ✅ Unlimited |
| Complex queries | ❌ Limited | ✅ Full support |
| Analytics | ❌ No | ✅ Aggregations |
| Audit trail | ❌ Limited | ✅ Complete |
| Read speed | ✅ < 1ms | ⚠️ ~5-10ms (cache miss) |
| Write speed | ✅ < 1ms | ⚠️ ~10-20ms |

## 🔍 Monitoring

### Check Database Status

```powershell
# Connect to MongoDB
docker exec -it tracknow-mongodb mongosh

# Show databases
show dbs

# Use tracknow database
use tracknow

# Show collections
show collections

# Collection stats
db.orders.stats()
db.status_history.stats()
```

### Index Performance

```javascript
// Explain query plan
db.orders.find({ customerId: "customer-123" }).explain("executionStats")

// List all indexes
db.orders.getIndexes()
```

### Database Size

```javascript
// Database stats
db.stats()

// Collection sizes
db.orders.totalSize()
db.status_history.totalSize()
```

## 🛠️ Useful Queries

### Business Analytics

```javascript
// Orders created today
db.orders.find({
  createdAt: { $gte: new ISODate("2025-12-08T00:00:00Z") }
}).count()

// Average order value
db.orders.aggregate([
  { $group: { _id: null, avgTotal: { $avg: "$totalAmount" } } }
])

// Orders by customer (top 10)
db.orders.aggregate([
  { $group: { _id: "$customerId", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
])

// Status transition time
db.status_history.aggregate([
  { $match: { orderId: "your-order-id" } },
  { $sort: { timestamp: 1 } },
  {
    $group: {
      _id: "$orderId",
      stages: { $push: { status: "$toStatus", time: "$timestamp" } }
    }
  }
])
```

### Data Cleanup

```javascript
// Remove orders older than 90 days
db.orders.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
})

// Remove orphaned status history
const orderIds = db.orders.distinct("orderId")
db.status_history.deleteMany({ orderId: { $nin: orderIds } })
```

## 🔐 Production Recommendations

### 1. Enable Authentication

```yaml
# docker-compose.yml
mongodb:
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: secure_password_here
```

### 2. Backup Strategy

```powershell
# Dump database
docker exec tracknow-mongodb mongodump --out=/backup

# Restore database
docker exec tracknow-mongodb mongorestore /backup
```

### 3. Performance Tuning

- Enable compression
- Use replica sets for high availability
- Configure appropriate pool size
- Monitor slow queries
- Add indexes for common queries

### 4. Monitoring

- Use MongoDB Atlas (cloud)
- Enable profiling for slow queries
- Set up alerts for disk space
- Monitor connection pool usage

## 🚨 Troubleshooting

### Connection Issues

```powershell
# Check if MongoDB is running
docker ps | findstr mongodb

# View MongoDB logs
docker logs tracknow-mongodb

# Test connection
docker exec -it tracknow-mongodb mongosh
```

### Performance Issues

```javascript
// Enable profiling (slow queries > 100ms)
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find().sort({ ts: -1 }).limit(5)
```

### Data Inconsistency

```javascript
// Compare counts
db.orders.countDocuments()
// vs Redis: KEYS order:* | wc -l

// Rebuild cache from MongoDB
// (handled automatically by services on cache miss)
```

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)
