# Test Resource Cleanup - Examples and Best Practices

## Table of Contents
1. [Basic Usage Examples](#basic-usage-examples)
2. [Integration Test Examples](#integration-test-examples)
3. [Advanced Patterns](#advanced-patterns)
4. [Best Practices](#best-practices)
5. [Common Scenarios](#common-scenarios)
6. [Performance Optimization](#performance-optimization)
7. [Troubleshooting Examples](#troubleshooting-examples)

## Basic Usage Examples

### Example 1: Simple Database Test

```typescript
import { DatabaseCleanupManager } from '../shared/utils/test/databaseCleanup';
import { MongoClient } from 'mongodb';

describe('User Repository Tests', () => {
  let dbManager: DatabaseCleanupManager;
  let mongoClient: MongoClient;
  let userRepository: UserRepository;

  beforeAll(async () => {
    // Initialize cleanup manager
    dbManager = new DatabaseCleanupManager();
    
    // Create and register MongoDB connection
    mongoClient = await MongoClient.connect(process.env.MONGO_TEST_URL!);
    await dbManager.registerConnection('users-db', mongoClient, 'mongodb');
    
    // Initialize repository
    userRepository = new UserRepository(mongoClient.db('test'));
  });

  // Cleanup handled automatically

  it('should create a user', async () => {
    const user = await userRepository.create({
      name: 'John Doe',
      email: 'john@example.com'
    });
    
    expect(user.id).toBeDefined();
    expect(user.name).toBe('John Doe');
  });

  it('should find user by email', async () => {
    const user = await userRepository.findByEmail('john@example.com');
    expect(user).toBeTruthy();
    expect(user.name).toBe('John Doe');
  });
});
```

### Example 2: API Server Test

```typescript
import { TestServerManager } from '../shared/utils/test/serverCleanup';
import { createApp } from '../api/app';
import request from 'supertest';

describe('API Endpoints', () => {
  let serverManager: TestServerManager;
  let serverInstance: ServerInstance;
  let app: Express;

  beforeAll(async () => {
    // Initialize server manager
    serverManager = new TestServerManager();
    
    // Create Express app
    app = createApp();
    
    // Start test server with automatic cleanup
    serverInstance = await serverManager.startServer('api-test', app);
  });

  // Server cleanup handled automatically

  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
  });

  it('should handle user creation', async () => {
    const userData = {
      name: 'Jane Doe',
      email: 'jane@example.com'
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);
    
    expect(response.body.user.name).toBe(userData.name);
  });
});
```

### Example 3: Timer-Based Test

```typescript
import { TimerCleanupManager } from '../shared/utils/test/timerCleanup';

describe('Async Operations', () => {
  let timerManager: TimerCleanupManager;

  beforeAll(() => {
    timerManager = new TimerCleanupManager();
  });

  // Timer cleanup handled automatically

  it('should handle delayed operations', async () => {
    const result = await new Promise<string>((resolve) => {
      timerManager.setTimeout(() => {
        resolve('delayed result');
      }, 100);
    });

    expect(result).toBe('delayed result');
  });

  it('should handle periodic operations', async () => {
    let counter = 0;
    
    const interval = timerManager.setInterval(() => {
      counter++;
    }, 50);

    // Wait for a few ticks
    await new Promise(resolve => {
      timerManager.setTimeout(resolve, 200);
    });

    expect(counter).toBeGreaterThan(2);
  });
});
```

## Integration Test Examples

### Example 4: Full E2E Test with Multiple Resources

```typescript
import { setupIntegrationTest } from '../shared/utils/test/testSetup';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import { createApp } from '../api/app';
import request from 'supertest';

describe('E2E Order Processing', () => {
  let testContext: TestContext;
  let mongoClient: MongoClient;
  let pgPool: Pool;
  let apiServer: ServerInstance;
  let app: Express;

  beforeAll(async () => {
    // Setup comprehensive test environment
    testContext = await setupIntegrationTest();
    
    // Setup databases
    mongoClient = await MongoClient.connect(process.env.MONGO_TEST_URL!);
    await testContext.dbManager.registerConnection('orders', mongoClient, 'mongodb');
    
    pgPool = new Pool({ connectionString: process.env.PG_TEST_URL });
    await testContext.dbManager.registerConnection('users', pgPool, 'postgresql');
    
    // Setup API server
    app = createApp();
    apiServer = await testContext.serverManager.startServer('api', app);
    
    // Setup test data
    await setupTestData(mongoClient, pgPool);
  });

  // All cleanup handled automatically by setupIntegrationTest

  it('should process complete order flow', async () => {
    // Create user
    const userResponse = await request(app)
      .post('/api/users')
      .send({
        name: 'Test User',
        email: 'test@example.com'
      })
      .expect(201);

    const userId = userResponse.body.user.id;

    // Create order
    const orderResponse = await request(app)
      .post('/api/orders')
      .send({
        userId,
        items: [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-2', quantity: 1 }
        ]
      })
      .expect(201);

    const orderId = orderResponse.body.order.id;

    // Process payment (async operation with timer)
    const paymentPromise = new Promise<void>((resolve) => {
      testContext.timerManager.setTimeout(async () => {
        await request(app)
          .post(`/api/orders/${orderId}/payment`)
          .send({ method: 'credit_card', token: 'test-token' })
          .expect(200);
        resolve();
      }, 100);
    });

    await paymentPromise;

    // Verify order status
    const statusResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .expect(200);

    expect(statusResponse.body.order.status).toBe('paid');
  });

  async function setupTestData(mongo: MongoClient, pg: Pool) {
    // Setup test products in MongoDB
    const productsCollection = mongo.db('test').collection('products');
    await productsCollection.insertMany([
      { _id: 'prod-1', name: 'Product 1', price: 10.99 },
      { _id: 'prod-2', name: 'Product 2', price: 25.50 }
    ]);

    // Setup test data in PostgreSQL
    await pg.query(`
      CREATE TABLE IF NOT EXISTS test_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE
      )
    `);
  }
});
```

### Example 5: Microservices Integration Test

```typescript
import { setupIntegrationTest } from '../shared/utils/test/testSetup';
import { createUserService } from '../services/user/app';
import { createOrderService } from '../services/order/app';
import { createPaymentService } from '../services/payment/app';

describe('Microservices Integration', () => {
  let testContext: TestContext;
  let userService: ServerInstance;
  let orderService: ServerInstance;
  let paymentService: ServerInstance;

  beforeAll(async () => {
    testContext = await setupIntegrationTest();
    
    // Start multiple microservices
    userService = await testContext.serverManager.startServer(
      'user-service', 
      createUserService()
    );
    
    orderService = await testContext.serverManager.startServer(
      'order-service', 
      createOrderService()
    );
    
    paymentService = await testContext.serverManager.startServer(
      'payment-service', 
      createPaymentService()
    );

    // Setup service discovery
    process.env.USER_SERVICE_URL = `http://localhost:${userService.port}`;
    process.env.ORDER_SERVICE_URL = `http://localhost:${orderService.port}`;
    process.env.PAYMENT_SERVICE_URL = `http://localhost:${paymentService.port}`;
  });

  // All services cleaned up automatically

  it('should handle cross-service communication', async () => {
    // Test service-to-service communication
    const userResponse = await fetch(`${process.env.USER_SERVICE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com' })
    });

    const user = await userResponse.json();
    expect(user.id).toBeDefined();

    // Order service calls user service
    const orderResponse = await fetch(`${process.env.ORDER_SERVICE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, items: [] })
    });

    const order = await orderResponse.json();
    expect(order.userId).toBe(user.id);
  });
});
```

## Advanced Patterns

### Example 6: Custom Resource Cleanup

```typescript
import { resourceCleanupManager } from '../shared/utils/test/resourceCleanupManager';

describe('Custom Resource Management', () => {
  let customResource: CustomResource;

  beforeAll(async () => {
    // Create custom resource
    customResource = new CustomResource();
    await customResource.initialize();

    // Register custom cleanup function
    resourceCleanupManager.registerResource({
      id: 'custom-resource',
      type: 'custom',
      resource: customResource,
      cleanup: async () => {
        await customResource.cleanup();
        await customResource.disconnect();
      },
      priority: 3, // Lower priority
      timeout: 8000 // Custom timeout
    });
  });

  it('should use custom resource', async () => {
    const result = await customResource.performOperation();
    expect(result).toBeDefined();
  });
});

class CustomResource {
  private connection: any;

  async initialize() {
    this.connection = await createCustomConnection();
  }

  async performOperation() {
    return this.connection.execute('some operation');
  }

  async cleanup() {
    if (this.connection) {
      await this.connection.flush();
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}
```

### Example 7: Conditional Cleanup

```typescript
import { resourceCleanupManager } from '../shared/utils/test/resourceCleanupManager';

describe('Conditional Resource Cleanup', () => {
  let expensiveResource: ExpensiveResource | null = null;

  beforeAll(() => {
    // Register conditional cleanup
    resourceCleanupManager.registerCleanupFunction(async () => {
      if (expensiveResource) {
        await expensiveResource.cleanup();
        expensiveResource = null;
      }
    });
  });

  it('should create resource only when needed', async () => {
    if (process.env.RUN_EXPENSIVE_TESTS === 'true') {
      expensiveResource = new ExpensiveResource();
      await expensiveResource.initialize();
      
      const result = await expensiveResource.performExpensiveOperation();
      expect(result).toBeDefined();
    } else {
      // Skip expensive test
      console.log('Skipping expensive test');
    }
  });
});
```

### Example 8: Resource Sharing Between Tests

```typescript
import { DatabaseCleanupManager } from '../shared/utils/test/databaseCleanup';

describe('Shared Resource Tests', () => {
  let sharedDbManager: DatabaseCleanupManager;
  let sharedConnection: MongoClient;

  beforeAll(async () => {
    sharedDbManager = new DatabaseCleanupManager();
    sharedConnection = await MongoClient.connect(process.env.MONGO_TEST_URL!);
    await sharedDbManager.registerConnection('shared', sharedConnection, 'mongodb');
  });

  describe('User Operations', () => {
    it('should create users', async () => {
      const db = sharedConnection.db('test');
      const result = await db.collection('users').insertOne({
        name: 'User 1',
        email: 'user1@example.com'
      });
      expect(result.insertedId).toBeDefined();
    });
  });

  describe('Product Operations', () => {
    it('should create products', async () => {
      const db = sharedConnection.db('test');
      const result = await db.collection('products').insertOne({
        name: 'Product 1',
        price: 29.99
      });
      expect(result.insertedId).toBeDefined();
    });
  });

  // Shared connection cleaned up once after all tests
});
```

## Best Practices

### 1. Resource Registration Patterns

```typescript
// ✅ Good: Register immediately after creation
beforeAll(async () => {
  const connection = await createConnection();
  await dbManager.registerConnection('main', connection, 'mongodb');
});

// ❌ Bad: Delay registration
beforeAll(async () => {
  const connection = await createConnection();
  // ... other setup
  await dbManager.registerConnection('main', connection, 'mongodb'); // Too late
});
```

### 2. Error Handling in Tests

```typescript
// ✅ Good: Let cleanup system handle errors
it('should handle database errors gracefully', async () => {
  try {
    await riskyDatabaseOperation();
  } catch (error) {
    // Test the error handling, cleanup happens automatically
    expect(error.message).toContain('expected error');
  }
});

// ❌ Bad: Manual cleanup in catch blocks
it('should handle errors', async () => {
  try {
    await riskyOperation();
  } catch (error) {
    await manualCleanup(); // Unnecessary and error-prone
    throw error;
  }
});
```

### 3. Resource Naming Conventions

```typescript
// ✅ Good: Descriptive, unique names
await dbManager.registerConnection('user-service-db', connection, 'mongodb');
await serverManager.startServer('user-api-server', app);

// ❌ Bad: Generic names that might conflict
await dbManager.registerConnection('db', connection, 'mongodb');
await serverManager.startServer('server', app);
```

### 4. Timeout Configuration

```typescript
// ✅ Good: Appropriate timeouts for resource types
resourceCleanupManager.registerResource({
  id: 'database-connection',
  type: 'database',
  resource: connection,
  cleanup: () => connection.close(),
  timeout: 5000 // Reasonable for database
});

resourceCleanupManager.registerResource({
  id: 'file-upload',
  type: 'custom',
  resource: uploadStream,
  cleanup: () => uploadStream.destroy(),
  timeout: 15000 // Longer for file operations
});
```

### 5. Priority-Based Cleanup

```typescript
// ✅ Good: Higher priority for critical resources
await dbManager.registerConnection('critical-db', connection, 'mongodb');
// Priority 1 (highest) - databases

await serverManager.startServer('api', app);
// Priority 2 - servers

resourceCleanupManager.registerResource({
  id: 'cache',
  type: 'custom',
  resource: cache,
  cleanup: () => cache.clear(),
  priority: 5 // Lower priority for cache
});
```

## Common Scenarios

### Scenario 1: Testing with External APIs

```typescript
import { MockProvider } from '../shared/utils/test/mockProvider';

describe('External API Integration', () => {
  let mockProvider: MockProvider;

  beforeAll(async () => {
    mockProvider = new MockProvider();
    
    // Mock external payment service
    mockProvider.mockService('payment-api', {
      baseUrl: 'https://api.payment-provider.com',
      responses: {
        '/charge': { status: 'success', transactionId: 'tx-123' },
        '/refund': { status: 'success', refundId: 'rf-456' }
      }
    });

    // Register for cleanup
    resourceCleanupManager.registerResource({
      id: 'payment-mock',
      type: 'custom',
      resource: mockProvider,
      cleanup: () => mockProvider.cleanup(),
      priority: 4
    });
  });

  it('should process payment through mocked API', async () => {
    const paymentService = new PaymentService();
    const result = await paymentService.charge({
      amount: 100,
      currency: 'USD',
      token: 'test-token'
    });

    expect(result.status).toBe('success');
    expect(result.transactionId).toBe('tx-123');
  });
});
```

### Scenario 2: Testing Background Jobs

```typescript
describe('Background Job Processing', () => {
  let jobQueue: JobQueue;
  let worker: Worker;

  beforeAll(async () => {
    const testContext = await setupIntegrationTest();
    
    // Setup job queue with Redis
    jobQueue = new JobQueue(redisConnection);
    worker = new Worker(jobQueue);
    
    // Register cleanup for background processes
    resourceCleanupManager.registerResource({
      id: 'job-worker',
      type: 'custom',
      resource: worker,
      cleanup: async () => {
        await worker.stop();
        await jobQueue.close();
      },
      priority: 2,
      timeout: 10000 // Allow time for jobs to complete
    });

    await worker.start();
  });

  it('should process jobs in background', async () => {
    const jobId = await jobQueue.add('email-job', {
      to: 'test@example.com',
      subject: 'Test Email'
    });

    // Wait for job completion
    const result = await jobQueue.waitForCompletion(jobId, 5000);
    expect(result.status).toBe('completed');
  });
});
```

### Scenario 3: Testing File Operations

```typescript
describe('File Processing', () => {
  let tempDir: string;
  let fileProcessor: FileProcessor;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
    fileProcessor = new FileProcessor(tempDir);

    // Register cleanup for temporary files
    resourceCleanupManager.registerCleanupFunction(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });
  });

  it('should process uploaded files', async () => {
    const testFile = path.join(tempDir, 'test.txt');
    await fs.writeFile(testFile, 'test content');

    const result = await fileProcessor.process(testFile);
    expect(result.processed).toBe(true);
  });
});
```

## Performance Optimization

### Optimization 1: Resource Pooling

```typescript
// Shared resource pool for similar tests
class TestResourcePool {
  private static dbPool: Map<string, MongoClient> = new Map();
  private static serverPool: Map<string, ServerInstance> = new Map();

  static async getDatabase(name: string): Promise<MongoClient> {
    if (!this.dbPool.has(name)) {
      const connection = await MongoClient.connect(process.env.MONGO_TEST_URL!);
      this.dbPool.set(name, connection);
      
      // Register for cleanup once
      resourceCleanupManager.registerResource({
        id: `pooled-db-${name}`,
        type: 'database',
        resource: connection,
        cleanup: () => connection.close(),
        priority: 1
      });
    }
    
    return this.dbPool.get(name)!;
  }

  static async getServer(name: string, app: Express): Promise<ServerInstance> {
    if (!this.serverPool.has(name)) {
      const serverManager = new TestServerManager();
      const server = await serverManager.startServer(name, app);
      this.serverPool.set(name, server);
    }
    
    return this.serverPool.get(name)!;
  }
}

// Usage in tests
describe('Optimized Tests', () => {
  it('should use pooled resources', async () => {
    const db = await TestResourcePool.getDatabase('users');
    const server = await TestResourcePool.getServer('api', createApp());
    
    // Use resources...
  });
});
```

### Optimization 2: Parallel Test Execution

```typescript
// Configure Jest for parallel execution with proper cleanup
// jest.config.js
module.exports = {
  maxWorkers: 4, // Parallel test execution
  setupFilesAfterEnv: ['<rootDir>/shared/utils/test/jestSetup.ts'],
  testTimeout: 30000,
  
  // Ensure each worker has isolated cleanup
  testEnvironment: 'node',
  isolatedModules: true
};
```

## Troubleshooting Examples

### Debug Example 1: Handle Detection

```typescript
describe('Debug Handle Leaks', () => {
  let detector: OpenHandleDetector;

  beforeAll(() => {
    detector = new OpenHandleDetector();
    detector.captureBaseline();
  });

  afterAll(() => {
    const leaks = detector.detectLeaks();
    if (leaks.length > 0) {
      console.log('🔍 Handle leaks detected:');
      leaks.forEach(leak => {
        console.log(`  - ${leak.type}: ${leak.description}`);
        if (leak.stack) {
          console.log(`    Stack: ${leak.stack}`);
        }
      });
    }
  });

  it('should not leak handles', async () => {
    // Test that might leak handles
    const connection = await createSomeConnection();
    
    // Proper cleanup should be automatic
    // If handles leak, they'll be reported in afterAll
  });
});
```

### Debug Example 2: Cleanup Performance

```typescript
describe('Debug Cleanup Performance', () => {
  beforeAll(() => {
    // Enable detailed cleanup logging
    resourceCleanupManager.setLogLevel('debug');
  });

  afterAll(async () => {
    const report = await resourceCleanupManager.getCleanupReport();
    
    console.log('🔧 Cleanup Performance Report:');
    console.log(`  Total time: ${report.duration}ms`);
    console.log(`  Resources cleaned: ${report.resources.cleaned}/${report.resources.total}`);
    
    Object.entries(report.byType).forEach(([type, stats]) => {
      console.log(`  ${type}: ${stats.success}/${stats.count} (avg: ${stats.avgTime}ms)`);
    });

    if (report.errors.length > 0) {
      console.log('  Errors:');
      report.errors.forEach(error => {
        console.log(`    - ${error.resourceType}:${error.resourceId}: ${error.message}`);
      });
    }
  });

  // Tests...
});
```

### Debug Example 3: Resource Tracking

```typescript
describe('Debug Resource Tracking', () => {
  it('should track all resources', async () => {
    const initialResources = resourceCleanupManager.getActiveResources();
    console.log(`Initial resources: ${initialResources.length}`);

    // Create some resources
    const dbManager = new DatabaseCleanupManager();
    const connection = await MongoClient.connect(process.env.MONGO_TEST_URL!);
    await dbManager.registerConnection('debug-db', connection, 'mongodb');

    const serverManager = new TestServerManager();
    const server = await serverManager.startServer('debug-server', createApp());

    const currentResources = resourceCleanupManager.getActiveResources();
    console.log(`Current resources: ${currentResources.length}`);
    
    currentResources.forEach(resource => {
      console.log(`  - ${resource.type}:${resource.id} (priority: ${resource.priority})`);
    });

    expect(currentResources.length).toBeGreaterThan(initialResources.length);
  });
});
```

These examples demonstrate comprehensive usage patterns for the Test Resource Cleanup System, covering everything from basic usage to advanced optimization and debugging techniques.