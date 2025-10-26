# TechNovaStore Test Setup

This directory contains the Jest configuration and setup files for the TechNovaStore test suite, integrated with the Resource Cleanup Manager to prevent resource leaks and ensure proper test isolation.

## Test Structure

```
tests/
├── setup.ts                    # Global setup for unit tests
├── globalSetup.ts             # Global Jest setup
├── globalTeardown.ts          # Global Jest teardown
├── ci-env.ts                  # CI environment configuration
├── integration/               # Integration test setup
│   ├── setup.ts              # Integration test setup
│   ├── globalSetup.ts        # Integration global setup
│   ├── globalTeardown.ts     # Integration global teardown
│   └── env.ts                # Integration environment config
└── README.md                 # This file
```

## Jest Configurations

### 1. `jest.config.js` - Unit Tests
- Runs unit tests excluding integration tests
- Configured with resource cleanup for unit tests
- Optimized for fast execution

### 2. `jest.integration.config.js` - Integration Tests
- Runs integration tests with database and server setup
- Extended timeouts for complex operations
- Enhanced resource cleanup and leak detection

### 3. `jest.ci.config.js` - CI/CD Environment
- Optimized for CI/CD environments
- Strict resource management and leak detection
- Coverage reporting and JUnit output

## Available Test Scripts

```bash
# Run all tests (unit + integration)
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in CI mode
npm run test:ci

# Run integration tests in CI mode (serial execution)
npm run test:ci:integration

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in debug mode
npm run test:debug
```

## Resource Cleanup Features

### Automatic Cleanup
- **Database Connections**: Automatically closes MongoDB and PostgreSQL connections
- **Test Servers**: Gracefully shuts down Express servers started during tests
- **Timers**: Clears all setTimeout and setInterval calls
- **Open Handles**: Detects and reports resource leaks

### Configuration
The cleanup system is configured differently for each environment:

#### Unit Tests
- Graceful timeout: 5s (8s in CI)
- Force timeout: 10s (15s in CI)
- Handle detection: CI only

#### Integration Tests
- Graceful timeout: 10s (15s in CI)
- Force timeout: 20s (30s in CI)
- Handle detection: Always enabled

### Environment Variables

#### Test Configuration
```bash
TEST_CLEANUP_TIMEOUT=10000              # Graceful cleanup timeout
TEST_CLEANUP_FORCE_TIMEOUT=20000        # Force cleanup timeout
TEST_CLEANUP_LOG_LEVEL=warn             # Logging level
TEST_CLEANUP_DETECT_HANDLES=true        # Enable handle detection
TEST_CLEANUP_STRICT_MODE=false          # Strict mode (CI only)
```

#### Database Configuration
```bash
MONGODB_TEST_URI=mongodb://localhost:27017/technovastore_test
POSTGRES_TEST_URI=postgresql://localhost:5432/technovastore_test
```

#### CI Configuration
```bash
CI=true                                 # Enable CI mode
DEBUG=false                            # Disable debug logging
TEST_CONCURRENCY=2                     # Limit test concurrency
```

## Writing Tests with Resource Cleanup

### Unit Tests
```typescript
import { resourceCleanupManager } from '../shared/utils/src/test';

describe('My Component', () => {
  afterEach(async () => {
    // Cleanup is automatic, but you can add custom cleanup
    await resourceCleanupManager.cleanup();
  });

  it('should work correctly', () => {
    // Your test code
  });
});
```

### Integration Tests
```typescript
import { 
  setupIntegrationTestWithDatabases,
  withDatabaseCleanup 
} from '../shared/utils/src/test/integrationTestSetup';

describe('Integration Test', () => {
  let testContext: IntegrationTestContext;

  beforeAll(async () => {
    testContext = await setupIntegrationTestWithDatabases({
      useMongoDB: true,
      usePostgreSQL: true
    });
  });

  afterAll(async () => {
    await testContext.cleanup();
  });

  it('should handle database operations', withDatabaseCleanup(async () => {
    // Test with automatic database cleanup
  }, { useMongoDB: true }));
});
```

### Test Servers
```typescript
import { testServerManager } from '../shared/utils/src/test';

describe('API Tests', () => {
  let server: ServerInstance;

  beforeAll(async () => {
    server = await testServerManager.startServer('test-api', app);
  });

  // Cleanup is automatic in afterAll hooks
});
```

## Troubleshooting

### Common Issues

#### Jest Hangs After Tests
- **Cause**: Resources not properly cleaned up
- **Solution**: Check for unclosed database connections, servers, or timers
- **Debug**: Run with `DEBUG=true npm run test:debug`

#### Resource Leak Warnings
- **Cause**: Open handles detected after test completion
- **Solution**: Review the leak report and ensure proper cleanup
- **Debug**: Enable handle detection with `TEST_CLEANUP_DETECT_HANDLES=true`

#### CI Test Failures
- **Cause**: Resource conflicts in parallel execution
- **Solution**: Use `npm run test:ci:integration` for serial execution
- **Debug**: Check CI logs for cleanup errors

### Debug Commands

```bash
# Run with handle detection
TEST_CLEANUP_DETECT_HANDLES=true npm run test:unit

# Run with verbose cleanup logging
TEST_CLEANUP_LOG_LEVEL=debug npm run test:integration

# Run in strict mode (fail on resource leaks)
TEST_CLEANUP_STRICT_MODE=true npm run test:ci
```

## Best Practices

1. **Always use the provided test utilities** for database connections and servers
2. **Avoid creating resources outside the cleanup system** unless absolutely necessary
3. **Use `withDatabaseCleanup` decorator** for tests that need database access
4. **Run integration tests serially in CI** to avoid resource conflicts
5. **Monitor cleanup logs** for performance issues or failures
6. **Use appropriate timeouts** for your test environment

## Integration with CI/CD

The test setup is optimized for CI/CD environments:

- **Automatic resource cleanup** prevents hanging builds
- **Leak detection** catches resource management issues early
- **JUnit reporting** for test result integration
- **Coverage reporting** with configurable thresholds
- **Parallel execution limits** to prevent resource conflicts

For GitHub Actions, Azure DevOps, or similar CI systems, use:
```bash
npm run test:ci
```

This ensures optimal performance and reliability in automated environments.