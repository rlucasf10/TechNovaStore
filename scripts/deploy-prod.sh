#!/bin/bash

# Production Deployment Script for TechNovaStore
# This script handles the complete deployment process including database migrations

set -e  # Exit on any error

echo "🚀 Starting TechNovaStore Production Deployment..."

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "❌ Error: .env.prod file not found!"
    echo "Please copy .env.prod.example to .env.prod and configure your production variables."
    exit 1
fi

# Load production environment variables
export $(cat .env.prod | grep -v '^#' | xargs)

echo "📦 Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🗄️ Starting databases..."
docker-compose -f docker-compose.prod.yml up -d mongodb postgresql redis

echo "⏳ Waiting for databases to be ready..."
sleep 30

echo "🔄 Running database migrations..."

# PostgreSQL migrations for ticket system
echo "Running PostgreSQL migrations for ticket system..."
docker-compose -f docker-compose.prod.yml run --rm postgresql psql -h postgresql -U $POSTGRES_USER -d technovastore -f /docker-entrypoint-initdb.d/001_create_tickets_table.sql
docker-compose -f docker-compose.prod.yml run --rm postgresql psql -h postgresql -U $POSTGRES_USER -d technovastore -f /docker-entrypoint-initdb.d/002_create_ticket_messages_table.sql
docker-compose -f docker-compose.prod.yml run --rm postgresql psql -h postgresql -U $POSTGRES_USER -d technovastore -f /docker-entrypoint-initdb.d/003_create_satisfaction_surveys_table.sql

echo "🚀 Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

echo "🔍 Checking service health..."
sleep 60

# Health check for critical services
services=("api-gateway" "ticket-service" "chatbot" "notification-service")
for service in "${services[@]}"; do
    echo "Checking $service health..."
    if docker-compose -f docker-compose.prod.yml exec $service curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ $service is healthy"
    else
        echo "❌ $service health check failed"
        docker-compose -f docker-compose.prod.yml logs $service
    fi
done

echo "📊 Deployment Summary:"
docker-compose -f docker-compose.prod.yml ps

echo "🎉 Production deployment completed!"
echo "🌐 Frontend: https://technovastore.com"
echo "🔧 API Gateway: https://api.technovastore.com"
echo "📋 Monitor logs with: docker-compose -f docker-compose.prod.yml logs -f"