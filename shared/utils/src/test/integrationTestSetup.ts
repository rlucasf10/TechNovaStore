/**
 * Enhanced setup for integration tests that require database connections
 */

import { resourceCleanupManager } from './resourceCleanupManager';
import { databaseCleanupManager } from './databaseCleanup';
import { testServerManager } from './serverCleanup';
import { TestMongoConnection, TestPostgreSQLConnection, verifyDatabaseCleanup } from './databaseTestWrapper';

export interface IntegrationTestContext {
  mongoConnection?: TestMongoConnection;
  postgresConnection?: TestPostgreSQLConnection;
  cleanup: () => Promise<void>;
  verifyCleanup: () => void;
}

/**
 * Setup function for integration tests that need database connections
 */
export async function setupIntegrationTestWithDatabases(options: {
  useMongoDB?: boolean;
  usePostgreSQL?: boolean;
  connectionNames?: {
    mongo?: string;
    postgres?: string;
  };
} = {}): Promise<IntegrationTestContext> {
  const {
    useMongoDB = false,
    usePostgreSQL = false,
    connectionNames = {}
  } = options;

  const context: IntegrationTestContext = {
    cleanup: async () => {
      await testServerManager.stopAllServers();
      await databaseCleanupManager.closeAllConnections();
      await resourceCleanupManager.cleanup();
    },
    verifyCleanup: () => {
      verifyDatabaseCleanup();
    }
  };

  // Create MongoDB connection if requested
  if (useMongoDB) {
    context.mongoConnection = new TestMongoConnection(connectionNames.mongo);
    try {
      await context.mongoConnection.connect();
    } catch (error) {
      console.warn('Failed to setup MongoDB for integration test:', error);
    }
  }

  // Create PostgreSQL connection if requested
  if (usePostgreSQL) {
    context.postgresConnection = new TestPostgreSQLConnection(connectionNames.postgres);
    try {
      await context.postgresConnection.connect();
    } catch (error) {
      console.warn('Failed to setup PostgreSQL for integration test:', error);
    }
  }

  return context;
}

/**
 * Jest setup hooks for integration tests
 */
export function setupIntegrationTestHooks(options: {
  useMongoDB?: boolean;
  usePostgreSQL?: boolean;
  verifyCleanupAfterEach?: boolean;
} = {}) {
  let testContext: IntegrationTestContext;

  beforeAll(async () => {
    testContext = await setupIntegrationTestWithDatabases(options);
  });

  afterEach(async () => {
    // Optional verification after each test
    if (options.verifyCleanupAfterEach) {
      try {
        testContext.verifyCleanup();
      } catch (error) {
        console.warn('Cleanup verification failed after test:', error);
      }
    }
  });

  afterAll(async () => {
    if (testContext) {
      await testContext.cleanup();
    }
  });

  return {
    getContext: () => testContext
  };
}

/**
 * Decorator for test functions that automatically handles database cleanup
 */
export function withDatabaseCleanup<T extends (...args: any[]) => Promise<any>>(
  testFn: T,
  options: {
    useMongoDB?: boolean;
    usePostgreSQL?: boolean;
  } = {}
): T {
  return (async (...args: any[]) => {
    const context = await setupIntegrationTestWithDatabases(options);
    
    try {
      return await testFn(...args);
    } finally {
      await context.cleanup();
    }
  }) as T;
}

/**
 * Utility to wait for database operations to complete
 */
export async function waitForDatabaseOperations(timeoutMs = 1000): Promise<void> {
  // Give time for any pending database operations to complete
  await new Promise(resolve => setTimeout(resolve, Math.min(timeoutMs, 100)));
  
  // Check if there are any pending operations
  const stats = databaseCleanupManager.getConnectionStats();
  if (stats.total > 0) {
    // Wait a bit more if there are active connections
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * Enhanced afterEach hook that ensures proper cleanup
 */
export async function enhancedAfterEach(): Promise<void> {
  // Wait for any pending operations
  await waitForDatabaseOperations();
  
  // Clean up any resources that might have been created
  const activeResources = resourceCleanupManager.getActiveResources();
  if (activeResources.length > 0) {
    await resourceCleanupManager.cleanup();
  }
  
  // Verify no test connections are left open
  try {
    verifyDatabaseCleanup();
  } catch (error) {
    console.warn('Database cleanup verification failed:', error);
    // Force cleanup if verification fails
    await databaseCleanupManager.closeAllConnections();
  }
}

/**
 * Enhanced afterAll hook for comprehensive cleanup
 */
export async function enhancedAfterAll(): Promise<void> {
  try {
    // Perform comprehensive cleanup
    await testServerManager.stopAllServers();
    await databaseCleanupManager.closeAllConnections();
    await resourceCleanupManager.cleanup();
  } catch (error) {
    console.error('Error during comprehensive cleanup:', error);
  }
}