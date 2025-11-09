# Migration Guide - Test Resource Cleanup System

## Overview

This guide helps you migrate existing tests to use the new Test Resource Cleanup System. The migration process is designed to be incremental and non-breaking, allowing you to update tests gradually while maintaining functionality.

## Migration Strategy

### Phase 1: Setup Integration (Low Risk)
1. Add global Jest setup
2. Enable handle detection
3. Monitor existing tests for issues

### Phase 2: Database Cleanup (Medium Risk)
1. Replace manual database cleanup with DatabaseCleanupManager
2. Update connection management
3. Test database-heavy test suites

### Phase 3: Server Cleanup (Medium Risk)
1. Replace manual server management with TestServerManager
2. Update port management
3. Test integration test suites

### Phase 4: Timer and Handle Cleanup (Low Risk)
1. Replace manual timer cleanup with TimerCleanupManager
2. Add comprehensive handle detection
3. Optimize cleanup performance

## Step-by-Step Migration

### Step 1: Global Setup Integration

#### Before
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testTimeout: 10000
};
```

#### After
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000, // Increased to allow cleanup time
  setupFilesAfterEnv: [
    '<rootDir>/shared/utils/test/jestSetup.ts'
  ],
  detectOpenHandles: process.env.CI === 'true',
  forceExit: false // Let cleanup system handle exit
};
```

#### Create Jest Setup File
```typescript
// shared/utils/test/jestSetup.ts
import { resourceCleanupManager } from './resourceCleanupManager';

beforeAll(() => {
  resourceCleanupManager.setTimeout(10000);
});

afterAll(async () => {
  await resourceCleanupManager.cleanup();
});
```

### Step 2: Database Connection Migration

#### Before (Manual Cleanup)
```typescript
describe('Database Tests', () => {
  let mongoConnection: MongoClient;
  let pgConnection: Pool;

  beforeAll(async () => {
    mongoConnection = await MongoClient.connect(MONGO_URL);
    pgConnection = new Pool({ connectionString: PG_URL });
  });

  afterAll(async () => {
    // Manual cleanup - error prone
    try {
      await mongoConnection.close();
    } catch (error) {
      console.error('Failed to close MongoDB:', error);
    }
    
    try {
      await pgConnection.end();
    } catch (error) {
      console.error('Failed to close PostgreSQL:', error);
    }
  });

  // Tests...
});
```

#### After (Automated Cleanup)
```typescript
import { DatabaseCleanupManager } from '../shared/utils/test/databaseCleanup';

describe('Database Tests', () => {
  let dbManager: DatabaseCleanupManager;
  let mongoConnection: MongoClient;
  let pgConnection: Pool;

  beforeAll(async () => {
    dbManager = new DatabaseCleanupManager();
    
    mongoConnection = await MongoClient.connect(MONGO_URL);
    await dbManager.registerConnection('mongo', mongoConnection, 'mongodb');
    
    pgConnection = new Pool({ connectionString: PG_URL });
    await dbManager.registerConnection('postgres', pgConnection, 'postgresql');
  });

  // afterAll is handled automatically by the cleanup system

  // Tests...
});
```

### Step 3: Test Server Migration

#### Before (Manual Server Management)
```typescript
describe('API Integration Tests', () => {
  let server: Server;
  let port: number;

  beforeAll(async () => {
    port = await getAvailablePort();
    server = app.listen(port);
    
    // Wait for server to start
    await new Promise(resolve => {
      server.on('listening', resolve);
    });
  });

  afterAll(async () => {
    // Manual cleanup - may hang
    return new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve(undefined);
      });
    });
  });

  // Tests...
});
```

#### After (Automated Server Management)
```typescript
import { TestServerManager } from '../shared/utils/test/serverCleanup';

describe('API Integration Tests', () => {
  let serverManager: TestServerManager;
  let serverInstance: ServerInstance;

  beforeAll(async () => {
    serverManager = new TestServerManager();
    serverInstance = await serverManager.startServer('api', app);
  });

  // afterAll is handled automatically by the cleanup system

  it('should make API calls', async () => {
    const response = await fetch(`http://localhost:${serverInstance.port}/api/test`);
    expect(response.status).toBe(200);
  });

  // More tests...
});
```

### Step 4: Timer Cleanup Migration

#### Before (Manual Timer Management)
```typescript
describe('Timer Tests', () => {
  let timers: NodeJS.Timeout[] = [];

  afterEach(() => {
    // Manual cleanup - easy to forget
    timers.forEach(timer => clearTimeout(timer));
    timers = [];
  });

  it('should handle delayed operations', (done) => {
    const timer = setTimeout(() => {
      // Test logic
      done();
    }, 1000);
    
    timers.push(timer); // Manual tracking
  });
});
```

#### After (Automated Timer Management)
```typescript
import { TimerCleanupManager } from '../shared/utils/test/timerCleanup';

describe('Timer Tests', () => {
  let timerManager: TimerCleanupManager;

  beforeAll(() => {
    timerManager = new TimerCleanupManager();
  });

  // afterEach/afterAll handled automatically

  it('should handle delayed operations', (done) => {
    // Auto-registered for cleanup
    timerManager.setTimeout(() => {
      // Test logic
      done();
    }, 1000);
  });
});
```

### Step 5: Integration Test Migration

#### Before (Complex Manual Setup)
```typescript
describe('Full Integration Tests', () => {
  let mongoConnection: MongoClient;
  let server: Server;
  let timers: NodeJS.Timeout[] = [];

  beforeAll(async () => {
    // Complex setup
    mongoConnection = await MongoClient.connect(MONGO_URL);
    server = app.listen(3001);
    
    await new Promise(resolve => {
      server.on('listening', resolve);
    });
  });

  afterEach(() => {
    timers.forEach(timer => clearTimeout(timer));
    timers = [];
  });

  afterAll(async () => {
    // Complex cleanup - error prone
    const cleanupPromises = [];
    
    if (mongoConnection) {
      cleanupPromises.push(mongoConnection.close());
    }
    
    if (server) {
      cleanupPromises.push(new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve(undefined);
        });
      }));
    }
    
    try {
      await Promise.all(cleanupPromises);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  // Tests...
});
```

#### After (Simplified Automated Setup)
```typescript
import { setupIntegrationTest } from '../shared/utils/test/testSetup';

describe('Full Integration Tests', () => {
  let testContext: TestContext;

  beforeAll(async () => {
    testContext = await setupIntegrationTest();
  });

  // All cleanup handled automatically

  it('should perform end-to-end operations', async () => {
    // Create resources using the managed context
    const db = await testContext.dbManager.registerConnection(
      'test-db', 
      await MongoClient.connect(MONGO_URL), 
      'mongodb'
    );
    
    const server = await testContext.serverManager.startServer('test-api', app);
    
    const timer = testContext.timerManager.setTimeout(() => {
      console.log('Timer executed');
    }, 1000);

    // Test logic...
    // All resources cleaned up automatically
  });
});
```

## Migration Checklist

### Pre-Migration
- [ ] Review existing test files for resource usage patterns
- [ ] Identify tests that frequently hang or timeout
- [ ] Document current cleanup strategies
- [ ] Set up monitoring for test execution times

### During Migration
- [ ] Add global Jest setup configuration
- [ ] Enable handle detection in development
- [ ] Migrate database tests first (highest impact)
- [ ] Migrate server tests second
- [ ] Migrate timer-heavy tests last
- [ ] Update CI/CD configuration

### Post-Migration
- [ ] Monitor test execution times
- [ ] Review cleanup reports for optimization opportunities
- [ ] Enable strict mode in CI environments
- [ ] Document any custom cleanup requirements

## Common Migration Patterns

### Pattern 1: Database-Heavy Tests
```typescript
// Before: Multiple manual connections
beforeAll(async () => {
  connection1 = await createConnection(config1);
  connection2 = await createConnection(config2);
});

// After: Managed connections
beforeAll(async () => {
  const dbManager = new DatabaseCleanupManager();
  await dbManager.registerConnection('main', connection1, 'mongodb');
  await dbManager.registerConnection('cache', connection2, 'redis');
});
```

### Pattern 2: Multi-Server Tests
```typescript
// Before: Manual port management
beforeAll(async () => {
  apiServer = app1.listen(3001);
  authServer = app2.listen(3002);
  await Promise.all([
    waitForServer(apiServer),
    waitForServer(authServer)
  ]);
});

// After: Managed servers
beforeAll(async () => {
  const serverManager = new TestServerManager();
  const apiServer = await serverManager.startServer('api', app1);
  const authServer = await serverManager.startServer('auth', app2);
});
```

### Pattern 3: Complex Async Operations
```typescript
// Before: Manual promise tracking
let activePromises: Promise<any>[] = [];

afterAll(async () => {
  await Promise.allSettled(activePromises);
});

// After: Resource registration
beforeAll(() => {
  resourceCleanupManager.registerCleanupFunction(async () => {
    await Promise.allSettled(activePromises);
  });
});
```

## Troubleshooting Migration Issues

### Issue: Tests Still Hanging
**Symptoms**: Jest still shows "Force exiting" after migration
**Solutions**:
1. Enable handle detection: `TEST_CLEANUP_DETECT_HANDLES=true`
2. Increase cleanup timeout: `TEST_CLEANUP_TIMEOUT=15000`
3. Check for unregistered resources in cleanup reports

### Issue: Cleanup Timeouts
**Symptoms**: Cleanup operations timing out
**Solutions**:
1. Increase resource-specific timeouts
2. Check for blocking operations in cleanup functions
3. Use force cleanup for stubborn resources

### Issue: Port Conflicts
**Symptoms**: "Port already in use" errors
**Solutions**:
1. Use dynamic port allocation in TestServerManager
2. Ensure proper server cleanup between tests
3. Add port conflict detection and retry logic

### Issue: Database Connection Limits
**Symptoms**: "Too many connections" errors
**Solutions**:
1. Use connection pooling with proper limits
2. Ensure connections are properly closed
3. Monitor active connection counts

## Performance Optimization

### Before Migration Baseline
```bash
# Measure current test performance
npm test -- --verbose --detectOpenHandles 2>&1 | tee baseline.log
```

### After Migration Monitoring
```bash
# Monitor improved performance
TEST_CLEANUP_LOG_LEVEL=info npm test 2>&1 | tee optimized.log
```

### Optimization Strategies
1. **Parallel Cleanup**: Independent resources cleaned in parallel
2. **Priority-Based Cleanup**: Critical resources cleaned first
3. **Timeout Tuning**: Optimize timeouts per resource type
4. **Resource Pooling**: Reuse connections where possible

## Rollback Strategy

If migration causes issues, you can rollback incrementally:

### Rollback Steps
1. Remove Jest setup configuration
2. Restore manual cleanup in affected test files
3. Disable handle detection
4. Revert to original timeouts

### Rollback Template
```typescript
// Temporary rollback for problematic tests
describe('Problematic Test Suite', () => {
  // Disable automatic cleanup for this suite
  beforeAll(() => {
    process.env.DISABLE_AUTO_CLEANUP = 'true';
  });

  afterAll(() => {
    delete process.env.DISABLE_AUTO_CLEANUP;
  });

  // Use original manual cleanup
  // ...
});
```

## Best Practices for Migration

1. **Incremental Migration**: Migrate one test suite at a time
2. **Monitor Performance**: Track test execution times before/after
3. **Enable Logging**: Use debug logging during migration
4. **Test in CI**: Ensure CI environments work with new system
5. **Document Changes**: Update team documentation
6. **Training**: Ensure team understands new patterns
7. **Fallback Plan**: Have rollback strategy ready

## Migration Timeline

### Week 1: Preparation
- Set up global Jest configuration
- Enable handle detection in development
- Identify high-priority test suites

### Week 2: Database Tests
- Migrate database-heavy integration tests
- Monitor for connection issues
- Optimize database cleanup timeouts

### Week 3: Server Tests
- Migrate API integration tests
- Update port management
- Test server cleanup reliability

### Week 4: Finalization
- Migrate remaining test suites
- Enable strict mode in CI
- Document lessons learned
- Train team on new patterns

## Support and Resources

### Getting Help
- Check cleanup reports for diagnostic information
- Enable debug logging for detailed troubleshooting
- Review handle detection output for resource leaks
- Consult the main API documentation for advanced usage

### Monitoring Tools
- Cleanup performance reports
- Handle leak detection
- Resource usage analytics
- CI/CD integration metrics