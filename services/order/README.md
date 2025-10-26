# Order Service - TechNovaStore

The Order Service is a core microservice responsible for managing orders, payments, and the complete order lifecycle in the TechNovaStore automated e-commerce platform.

## Features

### Order Management
- **Order Creation**: Create new orders with items, shipping, and billing information
- **Order Status Tracking**: Track orders through their complete lifecycle
- **Order Queries**: Search and filter orders with pagination support
- **Order Statistics**: Generate order statistics and reports

### Payment Processing
- **Payment Integration**: Process payments for multiple payment methods
- **Payment Status Tracking**: Monitor payment status and handle failures
- **Refund Processing**: Handle refunds and payment reversals
- **Payment Validation**: Validate payment methods and customer information

### Order States
The service manages the following order states with proper transition validation:
- `pending` → `confirmed` | `cancelled`
- `confirmed` → `processing` | `cancelled`
- `processing` → `shipped` | `cancelled`
- `shipped` → `delivered`
- `delivered` → `refunded`
- `cancelled` (terminal state)
- `refunded` (terminal state)

### Auto-Purchase Integration
- **Provider Integration**: Interface with external providers for automatic purchasing
- **Order Processing**: Mark orders for processing and track provider information
- **Tracking Updates**: Update orders with tracking information from providers

## API Endpoints

### Customer Endpoints
- `POST /orders` - Create a new order
- `GET /orders/my-orders` - Get current user's orders
- `GET /orders/stats` - Get order statistics
- `GET /orders/:id` - Get order by ID
- `GET /orders/number/:orderNumber` - Get order by order number
- `POST /orders/:id/cancel` - Cancel an order

### Payment Endpoints
- `POST /orders/:id/payment` - Process payment for an order
- `GET /orders/:id/payment/status` - Get payment status

### Admin Endpoints
- `GET /orders` - Get all orders (admin only)
- `PUT /orders/:id/status` - Update order status (admin only)
- `PUT /orders/:id/tracking` - Update tracking information (admin only)
- `POST /orders/:id/refund` - Process refund (admin only)

### System Endpoints
- `GET /health` - Service health check
- `GET /api-docs` - API documentation

## Payment Methods Supported
- Credit Card (`credit_card`)
- Debit Card (`debit_card`)
- PayPal (`paypal`)
- Bank Transfer (`bank_transfer`)
- Cash on Delivery (`cash_on_delivery`)

## Event System
The service emits events for integration with other services:
- `order.created` - When a new order is created
- `order.status_changed` - When order status changes
- `order.payment_completed` - When payment is successfully processed
- `order.cancelled` - When an order is cancelled
- `order.refunded` - When a refund is processed

## Database Schema

### Orders Table
- Order information, status, payment details
- Shipping and billing addresses (JSONB)
- Provider integration fields

### Order Items Table
- Individual items within orders
- Product information and pricing
- Provider-specific item details

### Invoices Table
- Automatically generated invoices
- Tax calculations (21% IVA for Spain)
- Invoice status tracking

## Configuration

The service requires the following environment configuration:
- PostgreSQL database connection
- Shared configuration from `@technovastore/shared-config`
- Port configuration (default: 3003)

## Development

### Build
```bash
npm run build
```

### Run Development Server
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Start Production Server
```bash
npm start
```

## Integration Points

### Auto-Purchase System
- Provides orders ready for automatic purchasing
- Receives provider order confirmations
- Updates tracking information

### Notification Service
- Sends order confirmations
- Provides shipping notifications
- Handles payment notifications

### User Service
- Validates user permissions
- Retrieves user information for orders

### Product Service
- Validates product information
- Retrieves product details for orders

## Security

- JWT-based authentication via API Gateway
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## Monitoring

- Structured logging with Winston
- Health check endpoint
- Error tracking and reporting
- Performance metrics collection

## Requirements Fulfilled

This implementation addresses the following requirements from the TechNovaStore specification:

- **Requirement 2.1**: Automatic order processing when customers make purchases
- **Requirement 2.4**: Order state management and transitions
- **Requirement 6.1**: Automatic invoice generation with Spanish tax compliance

The Order Service provides a robust foundation for the automated e-commerce platform, handling the complete order lifecycle from creation to delivery while integrating seamlessly with other microservices in the system.