# Test Resource Cleanup System - API Documentation

## Overview

The Test Resource Cleanup System provides a centralized, automated solution for managing and cleaning up resources during test execution. This system prevents Jest from hanging due to unclosed resources like database connections, test servers, timers, and other handles.

## Core Components

### ResourceCleanupManager

The central orchestrator for all resource cleanup operations.

```typescript
import { resourceCleanupManager } from './resourceCleanupManager';

// Register a resource for automatic cleanup
resourceCleanupManager.registerResource({
  id: 'my-resource',
  type: 'database',
  resource: connection,
  cleanup: () => connection.close(),
  priority: 1,
  timeout: 5000
});

// Register a cleanup function
resourceCleanupManager.registerCleanupFunction(async () => {
  await someCleanupOperation();
});

// Manual cleanup (usually called in afterAll)
await resourceCleanupManager.cleanup();

// Force cleanup if graceful cleanup fails
await resourceCleanupManager.forceCleanup();
```

### DatabaseCleanupManager

Manages database connections with automatic registration and cleanup.

```typescript
import { DatabaseCleanupManager } from './databaseCleanup';

const dbManager = new DatabaseCleanupManager();

// Register MongoDB connection
await dbManager.registerConnection('main-db', mongoConnection, 'mongodb');

// Register PostgreSQL connection
await dbManager.registerConnection('user-db', pgConnection, 'postgresql');

// Close specific connection
await dbManager.closeConnection('main-db');

// Close all connections
await dbManager.closeAllConnections();
```

### TestServerManager

Manages test servers with automatic port cleanup and graceful shutdown.

```typescript
import { TestServerManager } from './serverCleanup';

const serverManager = new TestServerManager();

// Start a test server
const serverInstance = await serverManager.startServer('api-server', app, 3001);
console.log(`Server running on port ${serverInstance.port}`);

// Stop specific server
await serverManager.stopServer('api-server');

// Stop all servers
await serverManager.stopAllServers();
```

### TimerCleanupManager

Provides wrapped timer functions that automatically register for cleanup.

```typescript
import { TimerCleanupManager } from './timerCleanup';

const timerManager = new TimerCleanupManager();

// Use wrapped setTimeout (auto-registered for cleanup)
const timer = timerManager.setTimeout(() => {
  console.log('Timer executed');
}, 1000);

// Use wrapped setInterval (auto-registered for cleanup)
const interval = timerManager.setInterval(() => {
  console.log('Interval tick');
}, 500);

// Clear all active timers
timerManager.clearAllTimers();

// Get count of active timers
const activeCount = timerManager.getActiveTimersCount();
```

### OpenHandleDetector

Detects resource leaks by monitoring Node.js handles.

```typescript
import { OpenHandleDetector } from './handleDetector';

const detector = new OpenHandleDetector();

// Capture baseline handles at test start
detector.captureBaseline();

// Detect leaks after test execution
const leaks = detector.detectLeaks();
if (leaks.length > 0) {
  console.warn('Resource leaks detected:', leaks);
}
```

## Configuration

### Environment Variables

```bash
# Cleanup timeout in milliseconds (default: 10000)
TEST_CLEANUP_TIMEOUT=10000

# Log level for cleanup operations (default: info)
TEST_CLEANUP_LOG_LEVEL=info

# Enable handle detection (default: false)
TEST_CLEANUP_DETECT_HANDLES=true

# Force exit after cleanup (default: false)
TEST_CLEANUP_FORCE_EXIT=false

# CI-specific settings
CI_CLEANUP_TIMEOUT=15000
CI_CLEANUP_LOG_TO_FILE=true
CI_CLEANUP_STRICT_MODE=true
```

### Programmatic Configuration

```typescript
import { resourceCleanupManager } from './resourceCleanupManager';

// Set global timeout for cleanup operations
resourceCleanupManager.setTimeout(15000);

// Set retry attempts for failed cleanups
resourceCleanupManager.setRetryAttempts(3);

// Configure logging
resourceCleanupManager.setLogLevel('debug');
```

## Integration with Jest

### Global Setup

Add to your Jest configuration:

```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: [
    '<rootDir>/shared/utils/test/jestSetup.ts'
  ],
  detectOpenHandles: process.env.CI === 'true',
  testTimeout: 30000,
  forceExit: false
};
```

### Test File Setup

```typescript
// In your test files
import { setupIntegrationTest } from './testSetup';

describe('Integration Tests', () => {
  let testContext: TestContext;

  beforeAll(async () => {
    testContext = await setupIntegrationTest();
  });

  afterAll(async () => {
    // Cleanup is handled automatically by setupIntegrationTest
  });

  it('should handle resources properly', async () => {
    // Your test code here
    const db = await testContext.dbManager.createConnection('test-db');
    const server = await testContext.serverManager.startServer('test-server', app);
    
    // Test logic...
    
    // Resources will be cleaned up automatically
  });
});
```

## Error Handling

The system provides comprehensive error handling with different strategies:

### Cleanup Strategies

1. **Graceful**: Attempt normal shutdown first
2. **Force**: Force termination if graceful fails
3. **Hybrid**: Graceful with fallback to force

### Error Types

```typescript
enum CleanupErrorType {
  TIMEOUT = 'TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED', 
  RESOURCE_BUSY = 'RESOURCE_BUSY',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN = 'UNKNOWN'
}
```

### Error Recovery

```typescript
// Handle cleanup errors gracefully
try {
  await resourceCleanupManager.cleanup();
} catch (error) {
  if (error instanceof CleanupError) {
    console.warn(`Cleanup failed for ${error.resourceType}: ${error.message}`);
    // Attempt force cleanup
    await resourceCleanupManager.forceCleanup();
  }
}
```

## Monitoring and Diagnostics

### Cleanup Reports

```typescript
// Get detailed cleanup report
const report = await resourceCleanupManager.getCleanupReport();
console.log(`Cleaned ${report.resources.cleaned}/${report.resources.total} resources`);
console.log(`Duration: ${report.duration}ms`);

// Check for resource leaks
if (report.openHandles.leaks.length > 0) {
  console.warn('Resource leaks detected:', report.openHandles.leaks);
}
```

### Debug Mode

Enable debug logging for detailed cleanup information:

```bash
TEST_CLEANUP_LOG_LEVEL=debug npm test
```

### Handle Detection

Enable comprehensive handle detection in CI environments:

```bash
TEST_CLEANUP_DETECT_HANDLES=true npm test -- --detectOpenHandles
```

## Performance Considerations

- **Resource Priority**: Higher priority resources are cleaned up first
- **Parallel Cleanup**: Independent resources are cleaned up in parallel
- **Timeout Management**: Configurable timeouts prevent hanging
- **Memory Efficiency**: Automatic cleanup of internal tracking structures

## Troubleshooting

### Common Issues

1. **Jest hangs after tests**: Enable handle detection to identify unclosed resources
2. **Cleanup timeouts**: Increase timeout values for slow resources
3. **Port conflicts**: Ensure test servers use dynamic ports
4. **Database connection limits**: Use connection pooling and proper cleanup

### Debug Commands

```bash
# Run tests with handle detection
npm test -- --detectOpenHandles

# Run with verbose cleanup logging
TEST_CLEANUP_LOG_LEVEL=debug npm test

# Run with extended timeouts
TEST_CLEANUP_TIMEOUT=20000 npm test
```

## TypeScript Support

The system provides full TypeScript support with comprehensive type definitions:

```typescript
import type {
  CleanupResource,
  CleanupFunction,
  ResourceType,
  CleanupConfig,
  CleanupReport,
  TestContext
} from './types';
```

## Best Practices

1. **Always use the provided managers** instead of creating resources directly
2. **Register resources immediately** after creation
3. **Use appropriate timeouts** for different resource types
4. **Enable handle detection** in CI environments
5. **Monitor cleanup reports** for performance optimization
6. **Use graceful shutdown** strategies when possible
7. **Test cleanup logic** in isolation when debugging issues

## API Reference

### Interfaces

```typescript
interface CleanupResource {
  id: string;
  type: ResourceType;
  resource: any;
  cleanup: CleanupFunction;
  priority: number;
  timeout?: number;
}

interface CleanupConfig {
  gracefulTimeout: number;
  forceTimeout: number;
  maxRetries: number;
  retryDelay: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  detectHandles: boolean;
}

interface CleanupReport {
  startTime: number;
  endTime: number;
  duration: number;
  resources: {
    total: number;
    cleaned: number;
    failed: number;
    forced: number;
  };
  errors: CleanupError[];
  openHandles: {
    before: number;
    after: number;
    leaks: OpenHandleLeak[];
  };
}
```

### Methods

#### ResourceCleanupManager

- `registerResource(resource: CleanupResource): void`
- `registerCleanupFunction(cleanup: CleanupFunction): void`
- `cleanup(): Promise<void>`
- `forceCleanup(): Promise<void>`
- `getActiveResources(): CleanupResource[]`
- `detectOpenHandles(): OpenHandle[]`
- `setTimeout(timeout: number): void`
- `setRetryAttempts(attempts: number): void`
- `getCleanupReport(): Promise<CleanupReport>`

#### DatabaseCleanupManager

- `registerConnection(name: string, connection: any, type: 'mongodb' | 'postgresql'): Promise<void>`
- `closeConnection(name: string): Promise<void>`
- `closeAllConnections(): Promise<void>`
- `getActiveConnections(): string[]`

#### TestServerManager

- `startServer(name: string, app: any, port?: number): Promise<ServerInstance>`
- `stopServer(name: string): Promise<void>`
- `stopAllServers(): Promise<void>`
- `getActiveServers(): string[]`

#### TimerCleanupManager

- `setTimeout(callback: () => void, delay: number): NodeJS.Timeout`
- `setInterval(callback: () => void, delay: number): NodeJS.Timer`
- `clearAllTimers(): void`
- `getActiveTimersCount(): number`

#### OpenHandleDetector

- `captureBaseline(): void`
- `detectLeaks(): OpenHandleLeak[]`
- `getActiveHandles(): any[]`
- `generateReport(): HandleReport`