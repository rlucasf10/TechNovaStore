# Shipment Tracker Service

Automated shipment tracking service for TechNovaStore that integrates with multiple provider APIs to track order shipments and provide real-time updates to customers.

## Features

- **Multi-Provider Support**: Integrates with Amazon, AliExpress, eBay, Banggood, and Newegg tracking APIs
- **Automatic Updates**: Scheduled tracking updates every 6 hours
- **Real-time Notifications**: Sends email notifications when shipment status changes
- **Delivery Estimates**: Calculates estimated delivery dates with confidence levels
- **Delay Detection**: Automatically detects and notifies about delivery delays
- **Rate Limiting**: Respects provider API rate limits with exponential backoff

## API Endpoints

### GET /health
Health check endpoint

### GET /api/tracking/:orderNumber
Get tracking information for an order

### POST /api/tracking/update/:orderNumber
Manually update tracking information for an order

### GET /api/tracking/status/:orderNumber
Get current shipment status for an order

## Supported Providers

- **Amazon**: Amazon marketplace orders
- **AliExpress**: International orders from AliExpress
- **eBay**: eBay marketplace orders
- **Banggood**: Electronics and gadgets from Banggood
- **Newegg**: Computer hardware from Newegg

## Configuration

Copy `.env.example` to `.env` and configure the following:

```bash
# Server Configuration
PORT=3006
NODE_ENV=development

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=technovastore
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Provider API Keys (optional)
AMAZON_API_KEY=your_amazon_api_key
ALIEXPRESS_API_KEY=your_aliexpress_api_key
EBAY_API_KEY=your_ebay_api_key
BANGGOOD_API_KEY=your_banggood_api_key
NEWEGG_API_KEY=your_newegg_api_key
```

## Installation

```bash
# Install dependencies
npm install

# Build the service
npm run build

# Start in development mode
npm run dev

# Start in production mode
npm start
```

## Docker

```bash
# Build Docker image
docker build -t technovastore/shipment-tracker .

# Run container
docker run -p 3006:3006 --env-file .env technovastore/shipment-tracker
```

## Architecture

The service follows a modular architecture:

- **Providers**: Individual tracking provider implementations
- **Services**: Core business logic for tracking and notifications
- **Controllers**: HTTP request handlers
- **Types**: TypeScript type definitions

## Tracking Status Mapping

The service normalizes different provider statuses to standard statuses:

- `label_created`: Shipping label created
- `picked_up`: Package picked up by carrier
- `in_transit`: Package in transit
- `out_for_delivery`: Package out for delivery
- `delivered`: Package delivered
- `exception`: Delivery exception
- `returned`: Package returned
- `cancelled`: Shipment cancelled

## Error Handling

The service implements comprehensive error handling:

- Rate limit detection and backoff
- Provider API failures with fallback
- Database connection errors
- Invalid tracking number formats

## Monitoring

The service provides health checks and logging for monitoring:

- Health endpoint at `/health`
- Structured logging with different levels
- Error tracking and reporting
- Performance metrics

## Requirements Compliance

This implementation satisfies the following requirements:

- **4.1**: Retrieves tracking information from provider systems every 6 hours
- **4.3**: Provides estimated delivery dates with 90% accuracy
- **4.4**: Displays real-time tracking information and handles delays