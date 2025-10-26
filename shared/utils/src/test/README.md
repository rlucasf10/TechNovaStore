# Test Resource Cleanup System

This directory contains a comprehensive resource cleanup system designed to prevent Jest from hanging due to unclosed resources, particularly database connections.

## Overview

The system consists of several components that work together to ensure proper cleanup of resources during test execution:

- **Resource Cleanup Manager**: Central coordinator for all resource cleanup
- **Database Cleanup Manager**: Specialized manager for database connections
- **Test Helpers**: Utilities for easy integration with existing tests
- **Integration Test Setup**: Enhanced setup for complex integration tests

## Quick Start

### 1. Basic Setup

Add the global test setup to your Jest configuration:

```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  detectOpenHandles: process.env.CI === 'true',
  forceExit: false, // Let our cleanup system handle exit
  testTimeout: 15000,
};
```

### 2. Using Database Connections in Tests

#### Option A: Integration Test Setup (Recommended for complex tests)

```typescript
import { setupIntegrationTestWithDatabases } from '@technovastore/shared-utils/test/integrationTestSetup';

describe('My Service Integration Tests', () => {
  let testContext: Awaited<ReturnType<typeof setupIntegrationTestWithDatabases>>;

  beforeAll(async () => {
    testContext = await setupIntegrationTestWithDatabases({
      useMongoDB: true,
      usePostgreSQL: true
    });
  });

  afterAll(async () => {
    await testContext.cleanup();
  });

  it('should work with databases', async () => {
    const mongo = testContext.mongoConnection?.getConnection();
    const postgres = testContext.postgresConnection?.getConnection();
    
    // Use connections for testing
  });
});
```

#### Option B: Managed Database Utility (Recommended for simple tests)

```typescript
import { withManagedDatabase } from '@technovastore/shared-utils/test/databaseTestWrapper';

describe('My Service Tests', () => {
  it('should work with MongoDB', async () => {
    await withManagedDatabase('mongodb', async (connection) => {
      // Use connection - automatically cleaned up
    });
  });
});
```

#### Option C: Decorator Pattern

```typescript
import { withDatabaseCleanup } from '@technovastore/shared-utils/test/integrationTestSetup';

describe('My Service Tests', () => {
  it('should cleanup automatically', withDatabaseCleanup(async () => {
    // Test logic here - cleanup handled automatically
  }, { useMongoDB: true }));
});
```

### 3. Manual Resource Registration

For custom resources that need cleanup:

```typescript
import { resourceCleanupManager } from '@technovastore/shared-utils/test/resourceCleanupManager';

// Register a custom resource
resourceCleanupManager.registerResource({
  id: 'my-custom-resource',
  type: 'custom',
  resource: myResource,
  cleanup: async () => {
    await myResource.close();
  },
  priority: 3
});
```

## Components

### Resource Cleanup Manager

The central coordinator that manages all resource cleanup operations.

**Key Features:**
- Priority-based cleanup order
- Timeout handling with graceful and forced cleanup
- Retry mechanisms for failed cleanup operations
- Comprehensive logging and reporting

**Usage:**
```typescript
import { resourceCleanupManager } from '@technovastore/shared-utils/test/resourceCleanupManager';

// Configure
resourceCleanupManager.updateConfig({
  gracefulTimeout: 5000,
  forceTimeout: 10000,
  maxRetries: 3
});

// Register resource
resourceCleanupManager.registerResource({
  id: 'my-resource',
  type: 'database',
  resource: connection,
  cleanup: () => connection.close(),
  priority: 1
});

// Cleanup all resources
await resourceCleanupManager.cleanup();
```

### Database Cleanup Manager

Specialized manager for database connections with support for:
- MongoDB (Mongoose)
- PostgreSQL (Sequelize)
- Redis
- Generic database connections

**Usage:**
```typescript
import { databaseCleanupManager } from '@technovastore/shared-utils/test/databaseCleanup';

// Register MongoDB connection
await databaseCleanupManager.registerMongoConnection('test-db', mongooseConnection);

// Register PostgreSQL connection
await databaseCleanupManager.registerSequelizeConnection('test-pg', sequelizeInstance);

// Close all connections
await databaseCleanupManager.closeAllConnections();
```

### Test Helpers

Utility functions for common testing scenarios:

```typescript
import { 
  setupIntegrationTest,
  waitForDatabaseOperations,
  verifyNoOpenConnections 
} from '@technovastore/shared-utils/test/testHelpers';

// Setup integration test environment
const context = await setupIntegrationTest();

// Wait for pending operations
await waitForDatabaseOperations();

// Verify cleanup
verifyNoOpenConnections();
```

## Configuration

### Environment Variables

```bash
# Test cleanup configuration
TEST_CLEANUP_TIMEOUT=10000
TEST_CLEANUP_LOG_LEVEL=warn
TEST_CLEANUP_DETECT_HANDLES=true

# CI-specific settings
CI_CLEANUP_TIMEOUT=15000
CI_CLEANUP_STRICT_MODE=true
```

### Cleanup Configuration

```typescript
interface CleanupConfig {
  gracefulTimeout: number;     // Time to wait for graceful shutdown
  forceTimeout: number;        // Time to wait before force termination
  maxRetries: number;          // Number of retry attempts
  retryDelay: number;          // Delay between retries
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  detectHandles: boolean;      // Enable handle detection
  databaseStrategy: 'graceful' | 'force' | 'hybrid';
  serverStrategy: 'graceful' | 'force' | 'hybrid';
}
```

## Best Practices

### 1. Use Appropriate Cleanup Level

- **Unit Tests**: Usually don't need database cleanup
- **Integration Tests**: Use `setupIntegrationTestWithDatabases`
- **E2E Tests**: Use full resource cleanup with handle detection

### 2. Handle Cleanup Failures Gracefully

```typescript
afterAll(async () => {
  try {
    await testContext.cleanup();
  } catch (error) {
    console.warn('Cleanup failed:', error);
    // Don't fail the test due to cleanup issues
  }
});
```

### 3. Use Test-Specific Database Names

The system automatically creates unique database names for each test to avoid conflicts:

```typescript
// Automatically generates: myapp_test_1634567890123
const connection = await createTestMongoConnection();
```

### 4. Monitor Resource Usage

```typescript
// Check active connections
const stats = databaseCleanupManager.getConnectionStats();
console.log(`Active connections: ${stats.total}`);

// Get detailed information
const connections = databaseCleanupManager.getActiveConnections();
```

### 5. CI/CD Considerations

- Enable handle detection in CI: `detectOpenHandles: process.env.CI === 'true'`
- Use stricter timeouts in CI environments
- Limit Jest workers to avoid connection pool exhaustion

## Troubleshooting

### Jest Hangs After Tests

1. Check for unclosed database connections:
   ```typescript
   const stats = databaseCleanupManager.getConnectionStats();
   console.log('Open connections:', stats);
   ```

2. Enable handle detection:
   ```bash
   npm test -- --detectOpenHandles
   ```

3. Check cleanup logs:
   ```typescript
   resourceCleanupManager.updateConfig({ logLevel: 'debug' });
   ```

### Connection Pool Exhaustion

1. Reduce pool sizes in tests:
   ```typescript
   const sequelize = new Sequelize({
     pool: { max: 3, min: 1 } // Reduced for tests
   });
   ```

2. Limit Jest workers:
   ```javascript
   // jest.config.js
   module.exports = {
     maxWorkers: process.env.CI ? 2 : '50%'
   };
   ```

### Cleanup Timeouts

1. Increase timeouts for slow operations:
   ```typescript
   resourceCleanupManager.updateConfig({
     gracefulTimeout: 10000,
     forceTimeout: 20000
   });
   ```

2. Use force cleanup for stuck resources:
   ```typescript
   await resourceCleanupManager.forceCleanup();
   ```

## Examples

See the `examples/` directory for complete examples of:
- Integration test setup
- Database connection management
- Error handling
- Custom resource cleanup

## Migration Guide

### From Manual Cleanup

**Before:**
```typescript
afterAll(async () => {
  await mongoose.disconnect();
  await sequelize.close();
});
```

**After:**
```typescript
import { setupIntegrationTestWithDatabases } from '@technovastore/shared-utils/test/integrationTestSetup';

let testContext: Awaited<ReturnType<typeof setupIntegrationTestWithDatabases>>;

beforeAll(async () => {
  testContext = await setupIntegrationTestWithDatabases({
    useMongoDB: true,
    usePostgreSQL: true
  });
});

afterAll(async () => {
  await testContext.cleanup();
});
```

### From Custom Cleanup

**Before:**
```typescript
const connections = [];

afterAll(async () => {
  for (const conn of connections) {
    await conn.close();
  }
});
```

**After:**
```typescript
import { resourceCleanupManager } from '@technovastore/shared-utils/test/resourceCleanupManager';

// Register each connection
resourceCleanupManager.registerResource({
  id: `connection-${Date.now()}`,
  type: 'database',
  resource: connection,
  cleanup: () => connection.close(),
  priority: 1
});

afterAll(async () => {
  await resourceCleanupManager.cleanup();
});
```