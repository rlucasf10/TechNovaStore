#!/bin/bash

# TechNovaStore Logging Setup Script
# This script sets up the ELK Stack and configures logging for all services

set -e

echo "🚀 Setting up TechNovaStore Logging System..."

# Create logs directory if it doesn't exist
echo "📁 Creating logs directory..."
mkdir -p logs

# Create ELK Stack configuration directories
echo "📁 Creating ELK Stack configuration directories..."
mkdir -p infrastructure/elasticsearch/config
mkdir -p infrastructure/logstash/config
mkdir -p infrastructure/logstash/pipeline
mkdir -p infrastructure/kibana/config

# Set proper permissions for Elasticsearch data directory
echo "🔐 Setting up Elasticsearch permissions..."
if [ -d "elasticsearch_data" ]; then
    sudo chown -R 1000:1000 elasticsearch_data
fi

# Copy environment configuration
echo "📋 Setting up environment configuration..."
if [ ! -f ".env.logging" ]; then
    cp .env.logging.example .env.logging
    echo "✅ Created .env.logging file. Please configure your logging settings."
else
    echo "ℹ️  .env.logging already exists."
fi

# Build shared configuration package
echo "🔨 Building shared configuration package..."
cd shared/config
npm install
npm run build
cd ../..

# Build shared utils package
echo "🔨 Building shared utils package..."
cd shared/utils
npm install
npm run build
cd ../..

# Install dependencies for all services
echo "📦 Installing dependencies for services..."
services=("api-gateway" "domains/catalog/product-service" "services/order" "domains/customer/user-service" "automation/auto-purchase")

for service in "${services[@]}"; do
    if [ -d "$service" ]; then
        echo "📦 Installing dependencies for $service..."
        cd "$service"
        npm install
        cd - > /dev/null
    fi
done

# Start ELK Stack
echo "🐳 Starting ELK Stack..."
docker-compose up -d elasticsearch logstash kibana

# Wait for Elasticsearch to be ready
echo "⏳ Waiting for Elasticsearch to be ready..."
timeout=60
counter=0
while ! curl -s http://localhost:9200/_cluster/health > /dev/null; do
    if [ $counter -ge $timeout ]; then
        echo "❌ Elasticsearch failed to start within $timeout seconds"
        exit 1
    fi
    echo "⏳ Waiting for Elasticsearch... ($counter/$timeout)"
    sleep 1
    counter=$((counter + 1))
done

echo "✅ Elasticsearch is ready!"

# Wait for Kibana to be ready
echo "⏳ Waiting for Kibana to be ready..."
timeout=120
counter=0
while ! curl -s http://localhost:5601/api/status > /dev/null; do
    if [ $counter -ge $timeout ]; then
        echo "❌ Kibana failed to start within $timeout seconds"
        exit 1
    fi
    echo "⏳ Waiting for Kibana... ($counter/$timeout)"
    sleep 1
    counter=$((counter + 1))
done

echo "✅ Kibana is ready!"

# Create Kibana index patterns and dashboards
echo "📊 Setting up Kibana dashboards..."
sleep 10  # Give Kibana a moment to fully initialize

# Create index pattern
curl -X POST "localhost:5601/api/saved_objects/index-pattern/technovastore-logs-*" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "attributes": {
      "title": "technovastore-logs-*",
      "timeFieldName": "@timestamp"
    }
  }' || echo "Index pattern may already exist"

echo "✅ Logging system setup complete!"
echo ""
echo "🎉 TechNovaStore Logging System is ready!"
echo ""
echo "📊 Access points:"
echo "   • Kibana Dashboard: http://localhost:5601"
echo "   • Elasticsearch: http://localhost:9200"
echo "   • Logstash: http://localhost:9600"
echo ""
echo "📝 Next steps:"
echo "   1. Configure your .env.logging file with your alert settings"
echo "   2. Start your services with: docker-compose up -d"
echo "   3. View logs in Kibana at http://localhost:5601"
echo "   4. Set up Kibana dashboards for monitoring"
echo ""
echo "🔍 Useful commands:"
echo "   • View logs: docker-compose logs -f [service-name]"
echo "   • Check ELK status: docker-compose ps elasticsearch logstash kibana"
echo "   • Restart logging: docker-compose restart elasticsearch logstash kibana"