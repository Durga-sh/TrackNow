# Infrastructure

Infrastructure configurations, scripts, and documentation for Kafka, Redis, and deployment.

## Components

### Kafka
- Event streaming platform
- Topic configurations
- Initialization scripts
- See: `kafka/README.md`

### Redis
- In-memory data store
- Key patterns and data structures
- CLI commands
- See: `redis/README.md`

## Quick Start

### 1. Start Infrastructure
```bash
docker-compose up -d zookeeper kafka redis
```

### 2. Verify Services
```bash
# Check Kafka
docker exec tracknow-kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# Check Redis
docker exec tracknow-redis redis-cli ping
```

### 3. Initialize Kafka Topics
```bash
bash infrastructure/kafka/init-topics.sh
```

### 4. Start Application Services
```bash
docker-compose up -d order-service status-update-service websocket-service frontend
```

## Monitoring

### Check Container Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f order-service
```

### Check Resource Usage
```bash
docker stats
```

## Troubleshooting

### Kafka Not Ready
Wait 30-60 seconds after starting Kafka before initializing topics or starting services.

### Redis Connection Issues
Ensure Redis is running and accessible:
```bash
docker exec tracknow-redis redis-cli ping
```

### Service Cannot Connect to Kafka
Check that Kafka is listening:
```bash
docker exec tracknow-kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

## Production Considerations

1. **Kafka**: Increase replication factor to 3
2. **Redis**: Configure max memory and eviction policy
3. **Monitoring**: Add Prometheus and Grafana
4. **Logging**: Centralize logs with ELK stack
5. **Security**: Enable authentication and encryption
