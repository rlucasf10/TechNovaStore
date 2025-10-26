# Auto Purchase Service

This service implements the provider selection algorithm for TechNovaStore's automated purchasing system.

## Features

### Provider Selection Algorithm
- **Multi-criteria scoring**: Evaluates providers based on price, delivery time, reliability, and availability
- **Weighted scoring system**: Configurable weights for different selection criteria
- **Preferred provider support**: Allows specifying preferred providers with bonus scoring
- **Provider exclusion**: Ability to exclude specific providers from selection

### Cost Calculation
- **Total cost calculation**: Includes base price, shipping, taxes, and processing fees
- **International shipping**: Supports different shipping costs based on destination country
- **Tax calculation**: Automatic tax calculation based on destination country VAT rates
- **Processing fees**: Provider-specific processing fees

### Fallback System
- **Automatic fallback**: If primary provider fails, automatically tries fallback providers
- **Availability checking**: Real-time availability checking with caching
- **Error handling**: Comprehensive error handling with retry mechanisms
- **Provider reliability**: Tracks provider reliability scores for better selection

## API Endpoints

### POST /select-provider
Selects the best provider for a product purchase.

**Request Body:**
```json
{
  "productSku": "TEST-SKU-001",
  "quantity": 1,
  "shippingAddress": {
    "street": "Calle Mayor 123",
    "city": "Madrid",
    "state": "Madrid",
    "postal_code": "28001",
    "country": "ES"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "provider": {
      "name": "Amazon",
      "price": 100,
      "availability": true,
      "shipping_cost": 5,
      "delivery_time": 2,
      "reliability_score": 95
    },
    "total_cost": 126.05,
    "estimated_delivery": "2023-10-19T00:00:00.000Z",
    "confidence_score": 87.5,
    "fallback_providers": [...]
  }
}
```

## Configuration

### Provider Configuration
Providers are configured in `src/config/providers.ts` with the following properties:
- **weight**: Priority weight for selection (0-100)
- **max_retry_attempts**: Maximum retry attempts for API calls
- **timeout_ms**: API call timeout in milliseconds
- **shipping_zones**: Supported shipping zones
- **supported_countries**: List of supported destination countries

### Selection Weights
Default selection weights can be configured:
- **price**: 40% - Weight given to total cost
- **delivery_time**: 25% - Weight given to delivery speed
- **reliability**: 25% - Weight given to provider reliability
- **availability**: 10% - Weight given to stock availability

## Requirements Fulfilled

This implementation fulfills the following requirements from the TechNovaStore specification:

- **Requirement 2.2**: "THE Auto_Purchase_System SHALL select the Provider with the lowest total cost including shipping and handling fees"
- **Requirement 2.3**: "IF the primary Provider is unavailable, THEN THE Auto_Purchase_System SHALL attempt purchase with the next available Provider within 10 minutes"

## Architecture

The service is built with the following components:

1. **ProviderSelector**: Main service for provider selection logic
2. **CostCalculator**: Handles all cost calculations including taxes and fees
3. **ProviderAvailabilityChecker**: Checks provider availability with caching
4. **AutoPurchaseService**: Orchestrates the purchase process with fallback handling

## Testing

Run tests with:
```bash
npm test
```

The test suite includes:
- Provider selection algorithm tests
- Cost calculation tests
- Fallback mechanism tests
- International shipping tests

## Usage

```typescript
import { ProviderSelector } from './services/providerSelector';

const selector = new ProviderSelector();
const result = await selector.selectBestProvider(
  'PRODUCT-SKU',
  1,
  shippingAddress
);
```