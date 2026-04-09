# Kafka Topics Configuration

This directory contains scripts and configurations for Kafka topics.

## Topics

### order.created
- **Purpose**: Published when a new order is created
- **Partitions**: 3
- **Replication Factor**: 1
- **Producer**: Order Service
- **Consumers**: Status Update Service, WebSocket Service

### order.updated
- **Purpose**: Published when order details are updated
- **Partitions**: 3
- **Replication Factor**: 1
- **Producer**: Order Service
- **Consumers**: Status Update Service, WebSocket Service

### order.status.changed
- **Purpose**: Published when order status changes
- **Partitions**: 3
- **Replication Factor**: 1
- **Producer**: Status Update Service
- **Consumers**: WebSocket Service

## Initialization

Run the initialization script after starting Kafka:

```bash
bash infrastructure/kafka/init-topics.sh
```

## Verify Topics

```bash
docker exec tracknow-kafka kafka-topics --list --bootstrap-server localhost:9092
```

## Topic Details

```bash
docker exec tracknow-kafka kafka-topics --describe --topic order.created --bootstrap-server localhost:9092
```

## Consumer Groups

```bash
docker exec tracknow-kafka kafka-consumer-groups --list --bootstrap-server localhost:9092
```
