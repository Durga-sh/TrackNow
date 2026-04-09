# TrackNow - Setup & Running Guide

## Prerequisites

Before running the services, ensure you have:

- **Docker Desktop** (for Windows) - [Download](https://www.docker.com/products/docker-desktop)
- **Node.js 18+** (for local development) - [Download](https://nodejs.org/)
- **Git Bash** or **WSL** (for running shell scripts on Windows)

## 🚀 Quick Start (Docker - Recommended)

### Option 1: Run Everything with Docker Compose

```powershell
# Navigate to project directory
cd d:\TrackNow

# Start all services (Kafka, Redis, and all microservices)
docker-compose up -d

# Wait 30-60 seconds for Kafka to be ready, then initialize topics
# If using Git Bash or WSL:
bash infrastructure/kafka/init-topics.sh

# If using PowerShell (alternative):
docker exec tracknow-kafka kafka-topics --create --topic order.created --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --if-not-exists
docker exec tracknow-kafka kafka-topics --create --topic order.updated --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --if-not-exists
docker exec tracknow-kafka kafka-topics --create --topic order.status.changed --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --if-not-exists

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Access Points:**
- Frontend: http://localhost:3000
- Order Service: http://localhost:3001
- Status Service: http://localhost:3002
- WebSocket Service: ws://localhost:8080

---

## 🔧 Development Mode (Local Node.js)

### Step 1: Start Infrastructure Only

```powershell
# Start only Kafka, Zookeeper, and Redis
docker-compose up -d zookeeper kafka redis

# Wait 30 seconds, then initialize Kafka topics
docker exec tracknow-kafka kafka-topics --create --topic order.created --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --if-not-exists
docker exec tracknow-kafka kafka-topics --create --topic order.updated --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --if-not-exists
docker exec tracknow-kafka kafka-topics --create --topic order.status.changed --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --if-not-exists

# Verify services are running
docker ps
```

### Step 2: Run Order Service

```powershell
# Open new PowerShell terminal
cd d:\TrackNow\services\order-service

# Install dependencies
npm install

# Create .env file
@"
PORT=3000
KAFKA_BROKER=localhost:9093
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
"@ | Out-File -FilePath .env -Encoding UTF8

# Run in development mode
npm run dev
```

### Step 3: Run Status Update Service

```powershell
# Open new PowerShell terminal
cd d:\TrackNow\services\status-update-service

# Install dependencies
npm install

# Create .env file
@"
PORT=3000
KAFKA_BROKER=localhost:9093
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
"@ | Out-File -FilePath .env -Encoding UTF8

# Run in development mode
npm run dev
```

### Step 4: Run WebSocket Service

```powershell
# Open new PowerShell terminal
cd d:\TrackNow\services\websocket-service

# Install dependencies
npm install

# Create .env file
@"
PORT=8080
KAFKA_BROKER=localhost:9093
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
"@ | Out-File -FilePath .env -Encoding UTF8

# Run in development mode
npm run dev
```

### Step 5: Run Frontend Client

```powershell
# Open new PowerShell terminal
cd d:\TrackNow\client

# Install dependencies
npm install

# Create .env file
@"
REACT_APP_ORDER_SERVICE_URL=http://localhost:3001
REACT_APP_STATUS_SERVICE_URL=http://localhost:3002
REACT_APP_WS_URL=ws://localhost:8080
"@ | Out-File -FilePath .env -Encoding UTF8

# Run in development mode
npm start
```

Browser will automatically open at http://localhost:3000

---

## 📋 Service-by-Service Details

### Order Service (Port 3001)

```powershell
cd d:\TrackNow\services\order-service

# Development
npm run dev

# Production
npm start

# Run tests
npm test

# Health check
curl http://localhost:3001/health
```

**Endpoints:**
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order
- `GET /api/orders` - List orders

### Status Update Service (Port 3002)

```powershell
cd d:\TrackNow\services\status-update-service

# Development
npm run dev

# Production
npm start

# Health check
curl http://localhost:3002/health
```

**Endpoints:**
- `PUT /api/orders/:id/status` - Update status
- `GET /api/orders/:id/history` - Get history

### WebSocket Service (Port 8080)

```powershell
cd d:\TrackNow\services\websocket-service

# Development
npm run dev

# Production
npm start

# Health check
curl http://localhost:8080/health
```

**WebSocket URL:**
- `ws://localhost:8080/orders/:orderId`

### Frontend (Port 3000)

```powershell
cd d:\TrackNow\client

# Development
npm start

# Production build
npm run build

# Serve production build
npx serve -s build -p 3000
```

---

## 🔍 Verification & Testing

### 1. Check Infrastructure

```powershell
# Check Docker containers
docker ps

# Check Kafka topics
docker exec tracknow-kafka kafka-topics --list --bootstrap-server localhost:9092

# Check Redis
docker exec tracknow-redis redis-cli ping
```

### 2. Test Order Creation

```powershell
# Create a test order
curl -X POST http://localhost:3001/api/orders `
  -H "Content-Type: application/json" `
  -d '{
    "customerId": "customer-001",
    "items": [
      {
        "productId": "prod-123",
        "name": "Test Product",
        "quantity": 2,
        "price": 29.99
      }
    ]
  }'
```

### 3. Test Status Update

```powershell
# Update order status (replace {orderId} with actual ID)
curl -X PUT http://localhost:3002/api/orders/{orderId}/status `
  -H "Content-Type: application/json" `
  -d '{
    "status": "CONFIRMED",
    "notes": "Order confirmed by system"
  }'
```

---

## 🐛 Troubleshooting

### Kafka Connection Issues

```powershell
# Check if Kafka is ready
docker exec tracknow-kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# Restart Kafka
docker-compose restart kafka

# View Kafka logs
docker-compose logs kafka
```

### Redis Connection Issues

```powershell
# Test Redis connection
docker exec tracknow-redis redis-cli ping

# View Redis data
docker exec -it tracknow-redis redis-cli
> KEYS *
> GET order:{orderId}
```

### Port Already in Use

```powershell
# Find process using port (e.g., 3001)
netstat -ano | findstr :3001

# Kill process by PID
taskkill /PID {pid} /F
```

### Clear All Data (Fresh Start)

```powershell
# Stop all containers
docker-compose down

# Remove volumes (clears all data)
docker-compose down -v

# Remove all containers and images
docker-compose down --rmi all -v

# Start fresh
docker-compose up -d
```

---

## 📊 Monitoring

### View Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f order-service
docker-compose logs -f status-update-service
docker-compose logs -f websocket-service

# Last 100 lines
docker-compose logs --tail=100 order-service
```

### Monitor Kafka Messages

```powershell
# Consume messages from topic
docker exec -it tracknow-kafka kafka-console-consumer `
  --bootstrap-server localhost:9092 `
  --topic order.created `
  --from-beginning
```

### Monitor Redis

```powershell
# Connect to Redis CLI
docker exec -it tracknow-redis redis-cli

# Monitor all commands
> MONITOR

# View all keys
> KEYS *

# Get order data
> GET order:{orderId}
```

---

## 🎯 Recommended Development Workflow

1. **Start infrastructure** (Kafka, Redis): `docker-compose up -d zookeeper kafka redis`
2. **Initialize Kafka topics** (wait 30s first)
3. **Run services locally** in separate terminals with `npm run dev`
4. **Make changes** - services will auto-reload with nodemon
5. **Test in browser** at http://localhost:3000
6. **View logs** in each terminal window
7. **Stop infrastructure** when done: `docker-compose down`

---

## 📝 Notes

- **First run**: May take 2-3 minutes for all services to start
- **Kafka**: Requires 30-60 seconds to be ready after starting
- **Hot reload**: All services use nodemon for automatic restart on file changes
- **Windows**: Use Git Bash or WSL for shell scripts
- **Production**: Use Docker Compose for consistent deployment

---

## 🆘 Quick Commands Reference

```powershell
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# Restart a service
docker-compose restart order-service

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Rebuild a service
docker-compose up -d --build order-service

# Clean up
docker-compose down -v
```
