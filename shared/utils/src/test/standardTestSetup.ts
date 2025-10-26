/**
 * Standardized Test Setup and Teardown Utilities
 * 
 * Provides consistent setup/teardown patterns across all test suites.
 * Addresses requirements 5.4, 5.5 for standardized test helpers and proper cleanup.
 */

import { mockProvider, MockRule } from './mockProvider';
import { inMemoryHelpers, InMemoryDatabaseConfig } from './inMemoryDatabase';
import { resourceCleanupManager } from './resourceCleanupManager';
import { testServerManager } from './serverCleanup';
import { timerCleanupManager } from './timerCleanup';
import { openHandleDetector } from './handleDetector';

export interface TestSetupConfig {
  // Database configuration
  databases?: {
    mongodb?: boolean | InMemoryDatabaseConfig;
    postgresql?: boolean | InMemoryDatabaseConfig;
    useInMemory?: boolean; // Default: true
  };
  
  // Mock configuration
  mocks?: {
    enabled?: boolean; // Default: true
    rules?: Record<string, MockRule>;
    autoActivate?: boolean; // Default: true
  };
  
  // Resource cleanup configuration
  cleanup?: {
    timeout?: number;
    detectHandles?: boolean;
    strictMode?: boolean; // Fail tests if resources leak
  };
  
  // Server configuration
  servers?: {
    autoCleanup?: boolean; // Default: true
  };
  
  // Timer configuration
  timers?: {
    useFakeTimers?: boolean;
    autoCleanup?: boolean; // Default: true
  };
}

export interface TestContext {
  // Database connections (if requested)
  mongo?: any;
  postgres?: any;
  
  // Mock provider
  mockProvider: typeof mockProvider;
  
  // Cleanup functions
  cleanup: () => Promise<void>;
  reset: () => void;
  
  // Utilities
  createServer: (name: string, app: any, port?: number) => Promise<any>;
  addMockRule: (id: string, rule: MockRule) => void;
  getStats: () => any;
}

/**
 * Standard test setup for unit tests
 */
export function setupUnitTest(config: TestSetupConfig = {}): {
  beforeEach: () => Promise<TestContext>;
  afterEach: () => Promise<void>;
} {
  let testContext: TestContext;

  return {
    beforeEach: async (): Promise<TestContext> => {
      // Reset mock provider
      mockProvider.reset();
      
      // Configure and activate mocks if enabled
      if (config.mocks?.enabled !== false) {
        if (config.mocks?.rules) {
          mockProvider.addRules(config.mocks.rules);
        }
        
        if (config.mocks?.autoActivate !== false) {
          mockProvider.activate();
        }
      }

      // Setup fake timers if requested
      if (config.timers?.useFakeTimers) {
        jest.useFakeTimers();
      }

      testContext = {
        mockProvider,
        cleanup: async () => {
          await resourceCleanupManager.cleanup();
        },
        reset: () => {
          mockProvider.reset();
          timerCleanupManager.clearAllTimers();
        },
        createServer: async (name: string, app: any, port?: number) => {
          return testServerManager.startServer(name, app, port);
        },
        addMockRule: (id: string, rule: MockRule) => {
          mockProvider.addRule(id, rule);
        },
        getStats: () => ({
          mock: mockProvider.getStats(),
          resources: resourceCleanupManager.getActiveResources().length,
          timers: timerCleanupManager.getActiveTimers().length
        })
      };

      return testContext;
    },

    afterEach: async (): Promise<void> => {
      try {
        // Cleanup resources
        if (testContext) {
          await testContext.cleanup();
        }

        // Restore timers
        if (config.timers?.useFakeTimers) {
          jest.useRealTimers();
        }

        // Deactivate mocks
        mockProvider.deactivate();
        
        // Clear timers if auto cleanup enabled
        if (config.timers?.autoCleanup !== false) {
          timerCleanupManager.clearAllTimers();
        }

      } catch (error) {
        console.warn('Error during unit test cleanup:', error);
        if (config.cleanup?.strictMode) {
          throw error;
        }
      }
    }
  };
}

/**
 * Standard test setup for integration tests
 */
export function setupIntegrationTest(config: TestSetupConfig = {}): {
  beforeAll: () => Promise<TestContext>;
  afterAll: () => Promise<void>;
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
} {
  let testContext: TestContext;
  let mongoInstance: any;
  let postgresInstance: any;

  return {
    beforeAll: async (): Promise<TestContext> => {
      // Capture baseline handles if detection enabled
      if (config.cleanup?.detectHandles !== false) {
        openHandleDetector.captureBaseline();
      }

      // Setup databases if requested
      const useInMemory = config.databases?.useInMemory !== false;
      
      if (config.databases?.mongodb) {
        if (useInMemory) {
          const mongoConfig = typeof config.databases.mongodb === 'object' 
            ? config.databases.mongodb 
            : undefined;
          mongoInstance = await inMemoryHelpers.withInMemoryMongo(
            async (connection) => connection,
            mongoConfig
          );
        } else {
          // Use real MongoDB connection (from existing helpers)
          const { createTestMongoConnection } = await import('./testHelpers');
          mongoInstance = await createTestMongoConnection('integration-test');
        }
      }

      if (config.databases?.postgresql) {
        if (useInMemory) {
          const postgresConfig = typeof config.databases.postgresql === 'object' 
            ? config.databases.postgresql 
            : undefined;
          postgresInstance = await inMemoryHelpers.withInMemoryPostgreSQL(
            async (connection) => connection,
            postgresConfig
          );
        } else {
          // Use real PostgreSQL connection (from existing helpers)
          const { createTestPostgreSQLConnection } = await import('./testHelpers');
          postgresInstance = await createTestPostgreSQLConnection('integration-test');
        }
      }

      // Setup mock provider
      mockProvider.reset();
      if (config.mocks?.enabled !== false) {
        if (config.mocks?.rules) {
          mockProvider.addRules(config.mocks.rules);
        }
        
        if (config.mocks?.autoActivate !== false) {
          mockProvider.activate();
        }
      }

      testContext = {
        mongo: mongoInstance,
        postgres: postgresInstance,
        mockProvider,
        cleanup: async () => {
          await resourceCleanupManager.cleanup();
        },
        reset: () => {
          mockProvider.reset();
          timerCleanupManager.clearAllTimers();
        },
        createServer: async (name: string, app: any, port?: number) => {
          return testServerManager.startServer(name, app, port);
        },
        addMockRule: (id: string, rule: MockRule) => {
          mockProvider.addRule(id, rule);
        },
        getStats: () => ({
          mock: mockProvider.getStats(),
          resources: resourceCleanupManager.getActiveResources().length,
          timers: timerCleanupManager.getActiveTimers().length,
          handles: openHandleDetector.detectLeaks().length
        })
      };

      return testContext;
    },

    afterAll: async (): Promise<void> => {
      try {
        // Cleanup all resources
        await resourceCleanupManager.cleanup();
        
        // Deactivate mocks
        mockProvider.deactivate();
        
        // Check for handle leaks if detection enabled
        if (config.cleanup?.detectHandles !== false) {
          const leaks = openHandleDetector.detectLeaks();
          if (leaks.length > 0) {
            console.warn('Resource leaks detected after integration test:', leaks);
            if (config.cleanup?.strictMode) {
              throw new Error(`${leaks.length} resource leaks detected`);
            }
          }
        }

      } catch (error) {
        console.warn('Error during integration test cleanup:', error);
        if (config.cleanup?.strictMode) {
          throw error;
        }
      }
    },

    beforeEach: async (): Promise<void> => {
      // Reset state between tests
      if (testContext) {
        testContext.reset();
      }
    },

    afterEach: async (): Promise<void> => {
      // Light cleanup between tests
      timerCleanupManager.clearAllTimers();
      
      // Stop any servers started during the test
      await testServerManager.stopAllServers();
    }
  };
}

/**
 * Convenience function for setting up e-commerce specific tests
 */
export function setupECommerceTest(config: Partial<TestSetupConfig> = {}) {
  const ecommerceConfig: TestSetupConfig = {
    databases: {
      mongodb: true,
      postgresql: true,
      useInMemory: true,
      ...config.databases
    },
    mocks: {
      enabled: true,
      autoActivate: true,
      rules: {
        // Common e-commerce mock rules
        'provider-api': {
          method: 'GET',
          url: /\/api\/products\/\d+/,
          response: {
            status: 200,
            data: {
              id: '123',
              price: 99.99,
              available: true,
              shipping: { cost: 9.99, estimatedDays: 3 }
            }
          }
        },
        'order-service': {
          method: 'POST',
          url: '/api/orders',
          response: {
            status: 201,
            data: {
              orderId: 12345,
              status: 'confirmed',
              trackingNumber: 'TRACK123'
            }
          }
        }
      },
      ...config.mocks
    },
    cleanup: {
      detectHandles: true,
      strictMode: process.env.CI === 'true',
      ...config.cleanup
    },
    ...config
  };

  return setupIntegrationTest(ecommerceConfig);
}

/**
 * Quick setup for simple unit tests with minimal configuration
 */
export function setupSimpleTest() {
  return setupUnitTest({
    mocks: { enabled: true },
    timers: { autoCleanup: true },
    cleanup: { strictMode: false }
  });
}

/**
 * Setup for performance-sensitive tests (minimal overhead)
 */
export function setupPerformanceTest() {
  return setupUnitTest({
    mocks: { enabled: false },
    timers: { useFakeTimers: false, autoCleanup: true },
    cleanup: { detectHandles: false, strictMode: false }
  });
}

/**
 * Global test utilities that can be used across all test types
 */
export const testUtils = {
  /**
   * Wait for async operations to complete
   */
  async waitFor(conditionFn: () => boolean | Promise<boolean>, timeoutMs = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const result = await conditionFn();
      if (result) return;
      
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  },

  /**
   * Create a promise that resolves after specified delay
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Retry a function with exponential backoff
   */
  async retry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    baseDelayMs = 100
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) break;
        
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }
    
    throw lastError!;
  },

  /**
   * Generate test data with consistent patterns
   */
  generateTestData: {
    orderId: () => Math.floor(Math.random() * 1000000),
    userId: () => Math.floor(Math.random() * 10000),
    productSku: () => `TEST-SKU-${Date.now()}`,
    email: () => `test${Date.now()}@example.com`,
    orderNumber: () => `ORD-TEST-${Date.now()}`,
    trackingNumber: () => `TRACK-${Date.now()}`
  }
};