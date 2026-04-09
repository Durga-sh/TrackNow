#!/bin/bash

# Kafka Topics Initialization Script
# This script creates the necessary Kafka topics for the TrackNow system

KAFKA_CONTAINER="tracknow-kafka"
REPLICATION_FACTOR=1
PARTITIONS=3

echo "Creating Kafka topics..."

# Wait for Kafka to be ready
sleep 10

# Create order.created topic
docker exec $KAFKA_CONTAINER kafka-topics --create \
  --topic order.created \
  --bootstrap-server localhost:9092 \
  --replication-factor $REPLICATION_FACTOR \
  --partitions $PARTITIONS \
  --if-not-exists

echo "✓ Created topic: order.created"

# Create order.updated topic
docker exec $KAFKA_CONTAINER kafka-topics --create \
  --topic order.updated \
  --bootstrap-server localhost:9092 \
  --replication-factor $REPLICATION_FACTOR \
  --partitions $PARTITIONS \
  --if-not-exists

echo "✓ Created topic: order.updated"

# Create order.status.changed topic
docker exec $KAFKA_CONTAINER kafka-topics --create \
  --topic order.status.changed \
  --bootstrap-server localhost:9092 \
  --replication-factor $REPLICATION_FACTOR \
  --partitions $PARTITIONS \
  --if-not-exists

echo "✓ Created topic: order.status.changed"

# List all topics
echo ""
echo "All topics:"
docker exec $KAFKA_CONTAINER kafka-topics --list --bootstrap-server localhost:9092

echo ""
echo "Kafka topics created successfully!"
