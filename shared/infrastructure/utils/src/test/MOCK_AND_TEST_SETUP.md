# Mock Provider and Test Setup System

This document describes the mock provider system and standardized test setup utilities that provide comprehensive testing capabilities without real external connections.

## Overview

The mock and test setup system addresses the following requirements:
- **5.1**: Simulate external API calls without creating real network connections
- **5.2**: Use in-memory databases when possible to avoid connection overhead  
- **5.3**: Use dedicated test database instances when real databases are required
- **5.4**: Implement proper cleanup methods called in afterAll hooks
- **5.5**: Provide standardized setup and teardown utilities across all test files

## Components

### 1. Mock Provider System (`mockProvider.ts`)

Provides HTTP request mocking without real network connections.

#### Key Features
- **Rule-based mocking**: Define URL patterns and responses
- **Dynamic responses**: Support functions that generate responses based on request
- **Usage limits**: Rules can be limited to specific number of uses
- **Request tracking**: Full history of intercepted requests
- **Statistics**: Detailed metrics on mock usage
- **Auto-cleanup**: Integrates with resource cleanup manager

#### Basic Usage

```typescript
import { mockProvider, mockHelpers } from '@technovastore/shared-utils/test';

// Add a simple mock rule
mockProvider.addRule('api-success', {
  method: 'GET',
  url: 'https://api.example.com/products/123',
  response: mockHelpers.mockJsonSuccess({
    id: 123,
    name: 'Test Product',
    price: 99.99
  })
});

// Activate mocking
mockProvider.activate();

// Now HTTP calls to the URL will be mocked
const response = await fetch('https://api.example.com/products/123');
const data = await response.json(); // Returns mocked data
```

#### Advanced Usage

```typescript
// Dynamic response based on request
mockProvider.addRule('dynamic-api', {
  method: 'GET',
  url: /\/api\/products\/(\d+)/,
  response: (request) => {
    const productId = request.url.match(/\/(\d+)$/)?.[1];
    return mockHelpers.mockProviderProduct(productId, 99.99, true);
  }
});

// Limited-use rule (only matches 3 times)
mockProvider.addRule('limited-api', {
  method: 'POST',
  url: '/api/orders',
  response: mockHelpers.mockOrderSuccess(12345),
  times: 3
});

// Delayed response (simulate slow network)
mockProvider.addRule('slow-api', {
  method: 'GET',
  url: '/api/slow-endpoint',
  response: mockHelpers.mockDelayed({ data: 'slow response' }, 2000)
});
```

### 2. In-Memory Database System (`inMemoryDatabase.ts`)

Provides in-memory database instances to avoid connection overhead.

#### Key Features
- **MongoDB in-memory**: Uses `mongodb-memory-server`
- **PostgreSQL substitute**: Uses SQLite in-memory as PostgreSQL substitute
- **Auto-cleanup**: Automatic resource management
- **Isolation**: Each test gets fresh database instances
- **Performance**: Much faster than real database connections

#### Basic Usage

```typescript
import { inMemoryHelpers } from '@technovastore/shared-utils/test';

// Use temporary MongoDB instance
await inMemoryHelpers.withInMemoryMongo(async (mongoose, uri) => {
  const TestModel = mongoose.model('Test', new mongoose.Schema({
    name: String,
    value: Number
  }));

  const doc = new TestModel({ name: 'test', value: 42 });
  await doc.save();
  
  const found = await TestModel.findOne({ name: 'test' });
  expect(found?.value).toBe(42);
});

// Use temporary PostgreSQL instance (SQLite)
await inMemoryHelpers.withInMemoryPostgreSQL(async (sequelize) => {
  await sequelize.query(`
    CREATE TABLE test_table (
      id INTEGER PRIMARY KEY,
      name TEXT,
      value INTEGER
    )
  `);

  await sequelize.query(
    'INSERT INTO test_table (name, value) VALUES (?, ?)',
    ['test', 42]
  );

  const [results] = await sequelize.query(
    'SELECT * FROM test_table WHERE name = ?',
    ['test']
  );

  expect(results).toHaveLength(1);
});
```

#### Using Both Databases

```typescript
await inMemoryHelpers.withInMemoryDatabases(async (mongo, postgres) => {
  // Use both MongoDB and PostgreSQL in the same test
  const MongoModel = mongo.model('Item', new mongo.Schema({
    ref_id: Number,
    data: String
  }));

  await postgres.query(`
    CREATE TABLE items (
      id INTEGER PRIMARY KEY,
      name TEXT
    )
  `);

  // Insert into PostgreSQL
  await postgres.query('INSERT INTO items (id, name) VALUES (?, ?)', [1, 'Test']);

  // Reference in MongoDB
  const doc = new MongoModel({ ref_id: 1, data: 'Additional data' });
  await doc.save();
});
```

### 3. Standardized Test Setup (`standardTestSetup.ts`)

Provides consistent setup/teardown patterns for different test types.

#### Test Setup Types

##### Unit Tests
```typescript
import { setupUnitTest } from '@technovastore/shared-utils/test';

describe('My Unit Tests', () => {
  const { beforeEach, afterEach } = setupUnitTest({
    mocks: {
      enabled: true,
      rules: {
        'api-call': {
          method: 'GET',
          url: 'https://api.example.com/data',
          response: { status: 200, data: { result: 'success' } }
        }
      }
    },
    timers: {
      useFakeTimers: true,
      autoCleanup: true
    }
  });

  let testContext;

  beforeEach(async () => {
    testContext = await beforeEach();
  });

  afterEach(async () => {
    await afterEach();
  });

  it('should work with mocks and fake timers', async () => {
    // Test implementation
  });
});
```

##### Integration Tests
```typescript
import { setupIntegrationTest } from '@technovastore/shared-utils/test';

describe('My Integration Tests', () => {
  const { beforeAll, afterAll, beforeEach, afterEach } = setupIntegrationTest({
    databases: {
      mongodb: true,
      postgresql: true,
      useInMemory: true
    },
    mocks: {
      enabled: true,
      autoActivate: true
    },
    cleanup: {
      detectHandles: true,
      strictMode: process.env.CI === 'true'
    }
  });

  let testContext;

  beforeAll(async () => {
    testContext = await beforeAll();
  });

  afterAll(async () => {
    await afterAll();
  });

  beforeEach(async () => {
    await beforeEach();
  });

  afterEach(async () => {
    await afterEach();
  });

  it('should have access to databases and mocks', async () => {
    expect(testContext.mongo).toBeDefined();
    expect(testContext.postgres).toBeDefined();
    expect(testContext.mockProvider).toBeDefined();
  });
});
```

##### E-Commerce Specific Tests
```typescript
import { setupECommerceTest } from '@technovastore/shared-utils/test';

describe('E-Commerce Tests', () => {
  const { beforeAll, afterAll, beforeEach, afterEach } = setupECommerceTest({
    // Automatically includes common e-commerce mocks and database setup
  });

  // Test implementation with pre-configured e-commerce mocks
});
```

#### Quick Setup Options

```typescript
// Simple unit tests with minimal configuration
const { beforeEach, afterEach } = setupSimpleTest();

// Performance-sensitive tests (minimal overhead)
const { beforeEach, afterEach } = setupPerformanceTest();
```

## Test Utilities

### Async Utilities
```typescript
import { testUtils } from '@technovastore/shared-utils/test';

// Wait for a condition to be true
await testUtils.waitFor(() => someCondition, 5000);

// Add delay
await testUtils.delay(1000);

// Retry with exponential backoff
const result = await testUtils.retry(async () => {
  // Operation that might fail
}, 3, 100);
```

### Test Data Generation
```typescript
// Generate consistent test data
const orderId = testUtils.generateTestData.orderId();
const email = testUtils.generateTestData.email();
const sku = testUtils.generateTestData.productSku();
const orderNumber = testUtils.generateTestData.orderNumber();
```

## Configuration Options

### TestSetupConfig Interface
```typescript
interface TestSetupConfig {
  databases?: {
    mongodb?: boolean | InMemoryDatabaseConfig;
    postgresql?: boolean | InMemoryDatabaseConfig;
    useInMemory?: boolean; // Default: true
  };
  
  mocks?: {
    enabled?: boolean; // Default: true
    rules?: Record<string, MockRule>;
    autoActivate?: boolean; // Default: true
  };
  
  cleanup?: {
    timeout?: number;
    detectHandles?: boolean;
    strictMode?: boolean; // Fail tests if resources leak
  };
  
  servers?: {
    autoCleanup?: boolean; // Default: true
  };
  
  timers?: {
    useFakeTimers?: boolean;
    autoCleanup?: boolean; // Default: true
  };
}
```

## Best Practices

### 1. Use In-Memory Databases for Speed
```typescript
// Preferred: Fast in-memory databases
const setup = setupIntegrationTest({
  databases: {
    mongodb: true,
    postgresql: true,
    useInMemory: true // Default
  }
});

// Only when necessary: Real database connections
const setup = setupIntegrationTest({
  databases: {
    mongodb: true,
    postgresql: true,
    useInMemory: false // Use real databases
  }
});
```

### 2. Mock External Services
```typescript
// Always mock external HTTP calls
const setup = setupUnitTest({
  mocks: {
    enabled: true,
    rules: {
      'external-api': {
        method: 'GET',
        url: /https:\/\/external-service\.com/,
        response: mockHelpers.mockJsonSuccess({ data: 'mocked' })
      }
    }
  }
});
```

### 3. Use Appropriate Test Types
```typescript
// Unit tests: Fast, isolated, mocked dependencies
describe('Unit Tests', () => {
  const { beforeEach, afterEach } = setupUnitTest({
    mocks: { enabled: true },
    timers: { useFakeTimers: true }
  });
});

// Integration tests: Multiple components, in-memory databases
describe('Integration Tests', () => {
  const { beforeAll, afterAll } = setupIntegrationTest({
    databases: { mongodb: true, postgresql: true }
  });
});

// E2E tests: Full system, real databases (use sparingly)
describe('E2E Tests', () => {
  const { beforeAll, afterAll } = setupIntegrationTest({
    databases: { useInMemory: false },
    cleanup: { strictMode: true }
  });
});
```

### 4. Handle Cleanup Properly
```typescript
// Always use the provided setup/teardown
const { beforeEach, afterEach } = setupUnitTest();

beforeEach(async () => {
  testContext = await beforeEach();
});

afterEach(async () => {
  await afterEach(); // This handles all cleanup
});

// Don't manually manage resources unless necessary
```

### 5. Use Strict Mode in CI
```typescript
const setup = setupIntegrationTest({
  cleanup: {
    detectHandles: true,
    strictMode: process.env.CI === 'true' // Fail on leaks in CI
  }
});
```

## Migration Guide

### From Manual Mocking
```typescript
// Before: Manual axios mocking
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.get.mockResolvedValue({ data: { result: 'success' } });

// After: Mock provider
const { beforeEach, afterEach } = setupUnitTest({
  mocks: {
    rules: {
      'api-call': {
        method: 'GET',
        url: 'https://api.example.com/data',
        response: mockHelpers.mockJsonSuccess({ result: 'success' })
      }
    }
  }
});
```

### From Manual Database Setup
```typescript
// Before: Manual database setup
let mongoConnection;
beforeAll(async () => {
  mongoConnection = await mongoose.connect('mongodb://localhost/test');
});
afterAll(async () => {
  await mongoConnection.disconnect();
});

// After: Standardized setup
const { beforeAll, afterAll } = setupIntegrationTest({
  databases: { mongodb: true }
});

beforeAll(async () => {
  testContext = await beforeAll();
  // testContext.mongo is ready to use
});
```

## Troubleshooting

### Common Issues

1. **Mocks not working**: Ensure `mockProvider.activate()` is called or `autoActivate: true`
2. **Database connection errors**: Use `useInMemory: true` for faster, more reliable tests
3. **Resource leaks**: Enable `detectHandles: true` and `strictMode: true` to identify issues
4. **Slow tests**: Use `setupUnitTest` instead of `setupIntegrationTest` when possible

### Debug Information
```typescript
// Get mock statistics
const stats = testContext.getStats();
console.log('Mock requests:', stats.mock.totalRequests);
console.log('Active resources:', stats.resources);

// Get request history
const history = mockProvider.getRequestHistory();
console.log('All requests:', history);

// Check resource cleanup
const activeResources = resourceCleanupManager.getActiveResources();
console.log('Uncleaned resources:', activeResources);
```

## Examples

See `examples/mockAndTestSetupExample.ts` for comprehensive examples of all features and usage patterns.