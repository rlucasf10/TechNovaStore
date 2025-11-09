# Test Resource Cleanup - Best Practices Guide

## Table of Contents
1. [General Principles](#general-principles)
2. [Resource Management](#resource-management)
3. [Performance Guidelines](#performance-guidelines)
4. [Error Handling](#error-handling)
5. [CI/CD Integration](#cicd-integration)
6. [Team Collaboration](#team-collaboration)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)

## General Principles

### 1. Fail-Safe Design
Always design tests to clean up resources even when tests fail unexpectedly.

```typescript
// ✅ Good: Automatic cleanup regardless of test outcome
describe('Robust Test Suite', () => {
  let testContext: TestContext;

  beforeAll(async () => {
    testContext = await setupIntegrationTest();
    // Resources automatically registered for cleanup
  });

  // Cleanup happens automatically even if tests throw exceptions
});

// ❌ Bad: Manual cleanup that might be skipped
describe('Fragile Test Suite', () => {
  let connection: MongoClient;

  beforeAll(async () => {
    connection = await MongoClient.connect(url);
  });

  afterAll(async () => {
    // This might not run if beforeAll fails
    await connection.close();
  });
});
```

### 2. Explicit Resource Registration
Register resources immediately after creation to ensure they're tracked.

```typescript
// ✅ Good: Immediate registration
beforeAll(async () => {
  const connection = await MongoClient.connect(url);
  await dbManager.registerConnection('main', connection, 'mongodb');
  // Resource is now tracked and will be cleaned up
});

// ❌ Bad: Delayed or conditional registration
beforeAll(async () => {
  const connection = await MongoClient.connect(url);
  // ... lots of other setup
  if (someCondition) {
    await dbManager.registerConnection('main', connection, 'mongodb');
  }
  // Resource might not be tracked
});
```

### 3. Descriptive Resource Naming
Use clear, unique names for resources to aid in debugging.

```typescript
// ✅ Good: Descriptive names
await dbManager.registerConnection('user-service-primary-db', connection, 'mongodb');
await serverManager.startServer('user-api-integration-server', app);

// ❌ Bad: Generic names
await dbManager.registerConnection('db1', connection, 'mongodb');
await serverManager.startServer('server', app);
```

## Resource Management

### 1. Database Connections

#### Connection Lifecycle Management
```typescript
// ✅ Best Practice: Centralized connection management
class DatabaseTestHelper {
  private static connections = new Map<string, MongoClient>();
  private static dbManager = new DatabaseCleanupManager();

  static async getConnection(name: string, url?: string): Promise<MongoClient> {
    if (!this.connections.has(name)) {
      const connection = await MongoClient.connect(url || process.env.MONGO_TEST_URL!);
      await this.dbManager.registerConnection(name, connection, 'mongodb');
      this.connections.set(name, connection);
    }
    return this.connections.get(name)!;
  }

  static async cleanDatabase(name: string, collections: string[]) {
    const connection = this.connections.get(name);
    if (connection) {
      const db = connection.db('test');
      await Promise.all(
        collections.map(col => db.collection(col).deleteMany({}))
      );
    }
  }
}

// Usage in tests
describe('User Service Tests', () => {
  beforeAll(async () => {
    await DatabaseTestHelper.getConnection('users');
  });

  beforeEach(async () => {
    // Clean data between tests, keep connection
    await DatabaseTestHelper.cleanDatabase('users', ['users', 'sessions']);
  });
});
```

#### Connection Pooling
```typescript
// ✅ Good: Proper connection limits
const connectionConfig = {
  maxPoolSize: 5, // Limit concurrent connections
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000
};

const connection = await MongoClient.connect(url, connectionConfig);
```

### 2. Test Servers

#### Port Management
```typescript
// ✅ Best Practice: Dynamic port allocation
class ServerTestHelper {
  private static portRange = { min: 3000, max: 4000 };
  private static usedPorts = new Set<number>();

  static async startServer(name: string, app: Express): Promise<ServerInstance> {
    const serverManager = new TestServerManager();
    
    // Let the system choose an available port
    const server = await serverManager.startServer(name, app);
    this.usedPorts.add(server.port);
    
    return server;
  }

  static isPortAvailable(port: number): boolean {
    return !this.usedPorts.has(port);
  }
}
```

#### Server Configuration
```typescript
// ✅ Good: Test-specific server configuration
function createTestApp(): Express {
  const app = express();
  
  // Test-specific middleware
  app.use(express.json({ limit: '1mb' })); // Smaller limits for tests
  app.use(cors({ origin: true })); // Permissive CORS for tests
  
  // Disable logging in tests
  if (process.env.NODE_ENV === 'test') {
    app.use((req, res, next) => next()); // No-op logger
  }
  
  return app;
}
```

### 3. Timer Management

#### Controlled Timer Usage
```typescript
// ✅ Best Practice: Prefer fake timers when possible
describe('Timer-based Operations', () => {
  let timerManager: TimerCleanupManager;

  beforeAll(() => {
    timerManager = new TimerCleanupManager();
  });

  describe('Real timers (when necessary)', () => {
    it('should handle actual delays', async () => {
      const result = await new Promise<string>(resolve => {
        timerManager.setTimeout(() => resolve('done'), 100);
      });
      expect(result).toBe('done');
    });
  });

  describe('Fake timers (preferred)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle simulated delays', () => {
      const callback = jest.fn();
      setTimeout(callback, 1000);
      
      jest.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalled();
    });
  });
});
```

### 4. Custom Resources

#### Resource Interface Implementation
```typescript
// ✅ Best Practice: Standardized resource interface
interface CleanableResource {
  cleanup(): Promise<void>;
  isActive(): boolean;
  getResourceInfo(): ResourceInfo;
}

class CustomCacheResource implements CleanableResource {
  private cache = new Map<string, any>();
  private active = true;

  async cleanup(): Promise<void> {
    this.cache.clear();
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  getResourceInfo(): ResourceInfo {
    return {
      type: 'cache',
      size: this.cache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private estimateMemoryUsage(): number {
    // Estimate memory usage for monitoring
    return this.cache.size * 100; // Rough estimate
  }
}

// Registration
const cache = new CustomCacheResource();
resourceCleanupManager.registerResource({
  id: 'custom-cache',
  type: 'custom',
  resource: cache,
  cleanup: () => cache.cleanup(),
  priority: 4
});
```

## Performance Guidelines

### 1. Cleanup Prioritization

```typescript
// ✅ Best Practice: Priority-based cleanup order
const CLEANUP_PRIORITIES = {
  CRITICAL_DATABASE: 1,    // Close database connections first
  SERVERS: 2,              // Stop servers second
  BACKGROUND_JOBS: 3,      // Stop background processes
  CACHES: 4,              // Clear caches
  TEMPORARY_FILES: 5       // Clean up files last
};

// Usage
resourceCleanupManager.registerResource({
  id: 'primary-db',
  type: 'database',
  resource: connection,
  cleanup: () => connection.close(),
  priority: CLEANUP_PRIORITIES.CRITICAL_DATABASE
});
```

### 2. Timeout Configuration

```typescript
// ✅ Best Practice: Resource-specific timeouts
const CLEANUP_TIMEOUTS = {
  DATABASE: 5000,      // 5 seconds for database connections
  SERVER: 3000,        // 3 seconds for server shutdown
  FILE_OPERATIONS: 10000, // 10 seconds for file operations
  NETWORK: 8000,       // 8 seconds for network resources
  DEFAULT: 5000        // Default timeout
};

function registerResourceWithTimeout(
  id: string, 
  type: ResourceType, 
  resource: any, 
  cleanup: CleanupFunction
) {
  const timeout = CLEANUP_TIMEOUTS[type.toUpperCase()] || CLEANUP_TIMEOUTS.DEFAULT;
  
  resourceCleanupManager.registerResource({
    id,
    type,
    resource,
    cleanup,
    timeout
  });
}
```

### 3. Parallel Cleanup Optimization

```typescript
// ✅ Best Practice: Group independent resources for parallel cleanup
class OptimizedCleanupManager {
  private resourceGroups = new Map<number, CleanupResource[]>();

  registerResource(resource: CleanupResource) {
    const priority = resource.priority;
    if (!this.resourceGroups.has(priority)) {
      this.resourceGroups.set(priority, []);
    }
    this.resourceGroups.get(priority)!.push(resource);
  }

  async cleanup(): Promise<void> {
    const priorities = Array.from(this.resourceGroups.keys()).sort();
    
    for (const priority of priorities) {
      const resources = this.resourceGroups.get(priority)!;
      
      // Clean up resources of same priority in parallel
      await Promise.allSettled(
        resources.map(resource => this.cleanupResource(resource))
      );
    }
  }

  private async cleanupResource(resource: CleanupResource): Promise<void> {
    try {
      await Promise.race([
        resource.cleanup(),
        this.createTimeout(resource.timeout || 5000)
      ]);
    } catch (error) {
      console.warn(`Cleanup failed for ${resource.id}:`, error);
    }
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cleanup timeout')), ms);
    });
  }
}
```

## Error Handling

### 1. Graceful Degradation

```typescript
// ✅ Best Practice: Continue cleanup even when individual resources fail
class RobustCleanupManager {
  async cleanup(): Promise<CleanupReport> {
    const report: CleanupReport = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    const resources = this.getRegisteredResources();
    report.total = resources.length;

    for (const resource of resources) {
      try {
        await this.cleanupWithRetry(resource);
        report.successful++;
      } catch (error) {
        report.failed++;
        report.errors.push({
          resourceId: resource.id,
          error: error.message
        });
        
        // Continue with other resources
        console.warn(`Failed to cleanup ${resource.id}, continuing...`);
      }
    }

    return report;
  }

  private async cleanupWithRetry(
    resource: CleanupResource, 
    maxRetries = 3
  ): Promise<void> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await resource.cleanup();
        return; // Success
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * attempt, 5000); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
}
```

### 2. Error Classification and Handling

```typescript
// ✅ Best Practice: Classify errors and handle appropriately
enum CleanupErrorSeverity {
  LOW = 'low',       // Non-critical resources (caches, temp files)
  MEDIUM = 'medium', // Important but recoverable (connections)
  HIGH = 'high'      // Critical resources (data integrity)
}

class ErrorAwareCleanupManager {
  async cleanupResource(resource: CleanupResource): Promise<void> {
    try {
      await resource.cleanup();
    } catch (error) {
      const severity = this.classifyError(resource, error);
      
      switch (severity) {
        case CleanupErrorSeverity.LOW:
          console.debug(`Minor cleanup issue for ${resource.id}:`, error);
          break;
          
        case CleanupErrorSeverity.MEDIUM:
          console.warn(`Cleanup warning for ${resource.id}:`, error);
          await this.attemptForceCleanup(resource);
          break;
          
        case CleanupErrorSeverity.HIGH:
          console.error(`Critical cleanup failure for ${resource.id}:`, error);
          await this.attemptForceCleanup(resource);
          throw error; // Re-throw critical errors
      }
    }
  }

  private classifyError(resource: CleanupResource, error: Error): CleanupErrorSeverity {
    if (resource.type === 'database' || resource.type === 'server') {
      return CleanupErrorSeverity.HIGH;
    }
    
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      return CleanupErrorSeverity.MEDIUM;
    }
    
    return CleanupErrorSeverity.LOW;
  }

  private async attemptForceCleanup(resource: CleanupResource): Promise<void> {
    try {
      // Attempt more aggressive cleanup
      if (resource.resource?.destroy) {
        resource.resource.destroy();
      } else if (resource.resource?.kill) {
        resource.resource.kill();
      }
    } catch (forceError) {
      console.error(`Force cleanup also failed for ${resource.id}:`, forceError);
    }
  }
}
```

## CI/CD Integration

### 1. Environment-Specific Configuration

```typescript
// ✅ Best Practice: Different settings for different environments
class EnvironmentAwareConfig {
  static getCleanupConfig(): CleanupConfig {
    const isCI = process.env.CI === 'true';
    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
      // Longer timeouts in CI due to resource constraints
      gracefulTimeout: isCI ? 15000 : 10000,
      forceTimeout: isCI ? 30000 : 20000,
      
      // More retries in CI
      maxRetries: isCI ? 5 : 3,
      retryDelay: isCI ? 2000 : 1000,
      
      // More verbose logging in CI
      logLevel: isCI ? 'debug' : (isDevelopment ? 'info' : 'warn'),
      
      // Always detect handles in CI
      detectHandles: isCI,
      
      // Stricter validation in CI
      strictMode: isCI,
      
      // Log to file in CI for artifact collection
      logToFile: isCI,
      logFilePath: isCI ? './test-cleanup.log' : undefined
    };
  }
}
```

### 2. CI Pipeline Integration

```yaml
# ✅ Best Practice: CI configuration with proper cleanup
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with cleanup monitoring
        env:
          CI: true
          TEST_CLEANUP_TIMEOUT: 20000
          TEST_CLEANUP_LOG_LEVEL: debug
          TEST_CLEANUP_DETECT_HANDLES: true
          TEST_CLEANUP_LOG_TO_FILE: true
        run: |
          npm test -- --detectOpenHandles --forceExit=false
      
      - name: Upload cleanup logs
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-cleanup-logs
          path: test-cleanup.log
      
      - name: Check for resource leaks
        if: always()
        run: |
          if grep -q "Resource leaks detected" test-cleanup.log; then
            echo "⚠️ Resource leaks detected in tests"
            grep "Resource leaks detected" test-cleanup.log
            exit 1
          fi
```

### 3. Performance Monitoring in CI

```typescript
// ✅ Best Practice: Track cleanup performance over time
class CIPerformanceMonitor {
  static async recordCleanupMetrics(report: CleanupReport): Promise<void> {
    if (process.env.CI !== 'true') return;

    const metrics = {
      timestamp: Date.now(),
      duration: report.duration,
      resourceCount: report.resources.total,
      successRate: report.resources.cleaned / report.resources.total,
      errorCount: report.errors.length,
      commit: process.env.GITHUB_SHA,
      branch: process.env.GITHUB_REF_NAME
    };

    // Log metrics in a format that can be parsed by monitoring tools
    console.log(`CLEANUP_METRICS: ${JSON.stringify(metrics)}`);

    // Fail build if cleanup performance degrades significantly
    if (report.duration > 30000) { // 30 seconds threshold
      throw new Error(`Cleanup took too long: ${report.duration}ms`);
    }

    if (metrics.successRate < 0.95) { // 95% success rate threshold
      throw new Error(`Cleanup success rate too low: ${metrics.successRate * 100}%`);
    }
  }
}
```

## Team Collaboration

### 1. Shared Test Utilities

```typescript
// ✅ Best Practice: Team-wide test utilities
// shared/utils/test/teamTestUtils.ts
export class TeamTestUtils {
  /**
   * Standard setup for integration tests
   * Use this for all new integration test suites
   */
  static async setupStandardIntegrationTest(): Promise<StandardTestContext> {
    const context = await setupIntegrationTest();
    
    // Add team-specific setup
    await this.setupTeamDatabase(context);
    await this.setupTeamServices(context);
    
    return context as StandardTestContext;
  }

  /**
   * Create a test user with standard permissions
   */
  static async createTestUser(
    context: StandardTestContext,
    overrides: Partial<User> = {}
  ): Promise<User> {
    const userData = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      role: 'user',
      ...overrides
    };

    const db = await context.dbManager.getConnection('users');
    const result = await db.db('test').collection('users').insertOne(userData);
    
    return { ...userData, id: result.insertedId.toString() };
  }

  /**
   * Standard cleanup verification
   */
  static async verifyCleanup(): Promise<void> {
    const report = await resourceCleanupManager.getCleanupReport();
    
    // Team standards for cleanup
    expect(report.resources.failed).toBe(0);
    expect(report.openHandles.leaks).toHaveLength(0);
    expect(report.duration).toBeLessThan(15000); // 15 second max
  }

  private static async setupTeamDatabase(context: TestContext): Promise<void> {
    // Standard database setup for the team
    const connection = await MongoClient.connect(process.env.MONGO_TEST_URL!);
    await context.dbManager.registerConnection('team-db', connection, 'mongodb');
    
    // Create standard collections and indexes
    const db = connection.db('test');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('orders').createIndex({ userId: 1 });
  }

  private static async setupTeamServices(context: TestContext): Promise<void> {
    // Standard service setup
    const userService = createUserService();
    const orderService = createOrderService();
    
    await context.serverManager.startServer('user-service', userService);
    await context.serverManager.startServer('order-service', orderService);
  }
}
```

### 2. Code Review Guidelines

```typescript
// ✅ Best Practice: Code review checklist for test cleanup

/**
 * TEST CLEANUP CODE REVIEW CHECKLIST
 * 
 * ✅ Resources are registered immediately after creation
 * ✅ Resource names are descriptive and unique
 * ✅ Appropriate timeouts are set for resource types
 * ✅ Error handling doesn't prevent other cleanup operations
 * ✅ Tests use team-standard utilities where possible
 * ✅ No manual cleanup in afterAll/afterEach hooks
 * ✅ Handle detection is enabled for integration tests
 * ✅ Performance impact is considered (parallel cleanup, timeouts)
 */

// Example of reviewable test code
describe('Order Processing (Review Example)', () => {
  let testContext: StandardTestContext;

  beforeAll(async () => {
    // ✅ Good: Using team standard setup
    testContext = await TeamTestUtils.setupStandardIntegrationTest();
  });

  // ✅ Good: No manual afterAll - cleanup is automatic

  it('should process order end-to-end', async () => {
    // ✅ Good: Using team utilities for test data
    const user = await TeamTestUtils.createTestUser(testContext);
    
    // ✅ Good: Resources managed by context
    const orderService = testContext.getService('order-service');
    
    // Test implementation...
  });

  afterAll(async () => {
    // ✅ Good: Using team standard verification
    await TeamTestUtils.verifyCleanup();
  });
});
```

### 3. Documentation Standards

```typescript
// ✅ Best Practice: Document resource usage patterns

/**
 * @fileoverview Integration tests for user authentication
 * 
 * RESOURCE USAGE:
 * - MongoDB connection (users database)
 * - Redis connection (session storage)  
 * - Auth service server (port auto-assigned)
 * - Email service mock
 * 
 * CLEANUP STRATEGY:
 * - Automatic cleanup via setupIntegrationTest()
 * - Custom cleanup for email mock
 * - Verification of no leaked handles
 * 
 * PERFORMANCE NOTES:
 * - Expected cleanup time: 2-5 seconds
 * - Resource count: 4-6 resources
 * - Memory usage: ~50MB peak
 */
describe('User Authentication Integration', () => {
  // Implementation...
});
```

## Monitoring and Maintenance

### 1. Cleanup Performance Monitoring

```typescript
// ✅ Best Practice: Monitor cleanup performance trends
class CleanupPerformanceMonitor {
  private static metrics: CleanupMetric[] = [];

  static recordCleanup(report: CleanupReport): void {
    const metric: CleanupMetric = {
      timestamp: Date.now(),
      duration: report.duration,
      resourceCount: report.resources.total,
      successRate: report.resources.cleaned / report.resources.total,
      errorCount: report.errors.length,
      testSuite: expect.getState().currentTestName || 'unknown'
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    // Alert on performance degradation
    this.checkPerformanceThresholds(metric);
  }

  static getPerformanceReport(): PerformanceReport {
    const recent = this.metrics.slice(-100); // Last 100 cleanups
    
    return {
      averageDuration: recent.reduce((sum, m) => sum + m.duration, 0) / recent.length,
      averageSuccessRate: recent.reduce((sum, m) => sum + m.successRate, 0) / recent.length,
      totalErrors: recent.reduce((sum, m) => sum + m.errorCount, 0),
      trends: this.calculateTrends(recent)
    };
  }

  private static checkPerformanceThresholds(metric: CleanupMetric): void {
    // Alert on slow cleanup
    if (metric.duration > 20000) {
      console.warn(`🐌 Slow cleanup detected: ${metric.duration}ms in ${metric.testSuite}`);
    }

    // Alert on low success rate
    if (metric.successRate < 0.9) {
      console.warn(`❌ Low cleanup success rate: ${metric.successRate * 100}% in ${metric.testSuite}`);
    }

    // Alert on high error count
    if (metric.errorCount > 2) {
      console.warn(`🚨 High error count: ${metric.errorCount} errors in ${metric.testSuite}`);
    }
  }

  private static calculateTrends(metrics: CleanupMetric[]): PerformanceTrends {
    // Calculate performance trends over time
    const half = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, half);
    const secondHalf = metrics.slice(half);

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.duration, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.duration, 0) / secondHalf.length;

    return {
      durationTrend: secondAvg > firstAvg ? 'increasing' : 'decreasing',
      trendMagnitude: Math.abs(secondAvg - firstAvg),
      recommendation: this.getRecommendation(secondAvg, firstAvg)
    };
  }

  private static getRecommendation(current: number, previous: number): string {
    const change = ((current - previous) / previous) * 100;
    
    if (change > 20) {
      return 'Consider optimizing cleanup timeouts or resource management';
    } else if (change < -20) {
      return 'Cleanup performance has improved significantly';
    } else {
      return 'Cleanup performance is stable';
    }
  }
}
```

### 2. Health Checks and Alerts

```typescript
// ✅ Best Practice: Automated health monitoring
class CleanupHealthMonitor {
  static async performHealthCheck(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      status: 'healthy',
      checks: [],
      timestamp: Date.now()
    };

    // Check 1: Resource leak detection
    const leakCheck = await this.checkForResourceLeaks();
    result.checks.push(leakCheck);

    // Check 2: Cleanup performance
    const performanceCheck = this.checkCleanupPerformance();
    result.checks.push(performanceCheck);

    // Check 3: Error rate
    const errorCheck = this.checkErrorRate();
    result.checks.push(errorCheck);

    // Overall status
    const failedChecks = result.checks.filter(c => c.status === 'failed');
    if (failedChecks.length > 0) {
      result.status = 'unhealthy';
    } else if (result.checks.some(c => c.status === 'warning')) {
      result.status = 'degraded';
    }

    return result;
  }

  private static async checkForResourceLeaks(): Promise<HealthCheck> {
    const detector = new OpenHandleDetector();
    const leaks = detector.detectLeaks();

    return {
      name: 'Resource Leak Detection',
      status: leaks.length === 0 ? 'passed' : 'failed',
      message: leaks.length === 0 
        ? 'No resource leaks detected'
        : `${leaks.length} resource leaks detected`,
      details: leaks.map(leak => ({
        type: leak.type,
        description: leak.description
      }))
    };
  }

  private static checkCleanupPerformance(): HealthCheck {
    const report = CleanupPerformanceMonitor.getPerformanceReport();
    const avgDuration = report.averageDuration;

    let status: 'passed' | 'warning' | 'failed' = 'passed';
    let message = `Average cleanup time: ${avgDuration}ms`;

    if (avgDuration > 15000) {
      status = 'failed';
      message += ' (exceeds 15s threshold)';
    } else if (avgDuration > 10000) {
      status = 'warning';
      message += ' (approaching 15s threshold)';
    }

    return {
      name: 'Cleanup Performance',
      status,
      message,
      details: {
        averageDuration: avgDuration,
        successRate: report.averageSuccessRate,
        trends: report.trends
      }
    };
  }

  private static checkErrorRate(): HealthCheck {
    const report = CleanupPerformanceMonitor.getPerformanceReport();
    const errorRate = report.totalErrors / 100; // Errors per 100 cleanups

    let status: 'passed' | 'warning' | 'failed' = 'passed';
    let message = `Error rate: ${errorRate.toFixed(2)} errors per 100 cleanups`;

    if (errorRate > 5) {
      status = 'failed';
      message += ' (exceeds 5% threshold)';
    } else if (errorRate > 2) {
      status = 'warning';
      message += ' (approaching 5% threshold)';
    }

    return {
      name: 'Error Rate',
      status,
      message,
      details: {
        totalErrors: report.totalErrors,
        errorRate: errorRate
      }
    };
  }
}

// Automated health check in CI
if (process.env.CI === 'true') {
  afterAll(async () => {
    const healthCheck = await CleanupHealthMonitor.performHealthCheck();
    
    if (healthCheck.status === 'unhealthy') {
      console.error('🚨 Cleanup health check failed:', healthCheck);
      process.exit(1);
    } else if (healthCheck.status === 'degraded') {
      console.warn('⚠️ Cleanup health check shows degraded performance:', healthCheck);
    } else {
      console.log('✅ Cleanup health check passed');
    }
  });
}
```

### 3. Maintenance Procedures

```typescript
// ✅ Best Practice: Regular maintenance tasks
class CleanupMaintenance {
  /**
   * Run weekly maintenance tasks
   */
  static async performWeeklyMaintenance(): Promise<MaintenanceReport> {
    const report: MaintenanceReport = {
      timestamp: Date.now(),
      tasks: []
    };

    // Task 1: Analyze performance trends
    const performanceTask = await this.analyzePerformanceTrends();
    report.tasks.push(performanceTask);

    // Task 2: Update timeout configurations
    const timeoutTask = await this.optimizeTimeouts();
    report.tasks.push(timeoutTask);

    // Task 3: Clean up old logs
    const logCleanupTask = await this.cleanupOldLogs();
    report.tasks.push(logCleanupTask);

    // Task 4: Validate resource registrations
    const validationTask = await this.validateResourceRegistrations();
    report.tasks.push(validationTask);

    return report;
  }

  private static async analyzePerformanceTrends(): Promise<MaintenanceTask> {
    const report = CleanupPerformanceMonitor.getPerformanceReport();
    
    const recommendations: string[] = [];
    
    if (report.averageDuration > 10000) {
      recommendations.push('Consider increasing parallel cleanup operations');
    }
    
    if (report.averageSuccessRate < 0.95) {
      recommendations.push('Review and improve error handling in cleanup functions');
    }
    
    if (report.trends.durationTrend === 'increasing') {
      recommendations.push('Investigate causes of increasing cleanup times');
    }

    return {
      name: 'Performance Trend Analysis',
      status: recommendations.length === 0 ? 'completed' : 'needs_attention',
      recommendations,
      metrics: report
    };
  }

  private static async optimizeTimeouts(): Promise<MaintenanceTask> {
    // Analyze actual cleanup times to optimize timeout values
    const metrics = CleanupPerformanceMonitor.getPerformanceReport();
    
    const recommendations: string[] = [];
    
    // Suggest timeout adjustments based on actual performance
    if (metrics.averageDuration < 5000) {
      recommendations.push('Consider reducing default timeouts to fail faster');
    } else if (metrics.averageDuration > 15000) {
      recommendations.push('Consider increasing timeouts to reduce forced cleanups');
    }

    return {
      name: 'Timeout Optimization',
      status: 'completed',
      recommendations
    };
  }

  private static async cleanupOldLogs(): Promise<MaintenanceTask> {
    // Clean up old cleanup logs to prevent disk space issues
    const logDir = './logs/cleanup';
    const cutoffDate = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    let cleanedFiles = 0;
    
    try {
      const files = await fs.readdir(logDir);
      
      for (const file of files) {
        const filePath = path.join(logDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffDate) {
          await fs.unlink(filePath);
          cleanedFiles++;
        }
      }
    } catch (error) {
      // Log directory might not exist, which is fine
    }

    return {
      name: 'Log Cleanup',
      status: 'completed',
      details: {
        filesRemoved: cleanedFiles
      }
    };
  }

  private static async validateResourceRegistrations(): Promise<MaintenanceTask> {
    // Validate that all resource types have appropriate cleanup handlers
    const activeResources = resourceCleanupManager.getActiveResources();
    const issues: string[] = [];
    
    for (const resource of activeResources) {
      // Check for missing cleanup functions
      if (!resource.cleanup) {
        issues.push(`Resource ${resource.id} has no cleanup function`);
      }
      
      // Check for unreasonable timeouts
      if (resource.timeout && resource.timeout > 60000) {
        issues.push(`Resource ${resource.id} has excessive timeout: ${resource.timeout}ms`);
      }
      
      // Check for duplicate IDs
      const duplicates = activeResources.filter(r => r.id === resource.id);
      if (duplicates.length > 1) {
        issues.push(`Duplicate resource ID detected: ${resource.id}`);
      }
    }

    return {
      name: 'Resource Registration Validation',
      status: issues.length === 0 ? 'completed' : 'needs_attention',
      issues,
      details: {
        totalResources: activeResources.length,
        resourceTypes: [...new Set(activeResources.map(r => r.type))]
      }
    };
  }
}
```

These best practices provide a comprehensive framework for using the Test Resource Cleanup System effectively, ensuring reliable, performant, and maintainable test suites across your development team.