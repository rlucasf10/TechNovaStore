/**
 * Example of how to use the Database Cleanup Manager in tests
 * This file demonstrates best practices for testing with database connections
 */

import { setupIntegrationTestWithDatabases, withDatabaseCleanup } from '../integrationTestSetup';
import { createTestDatabaseConnection, withManagedDatabase } from '../databaseTestWrapper';
import { databaseCleanupManager } from '../databaseCleanup';

// Example 1: Using the integration test setup
describe('Service with Database - Integration Test Setup', () => {
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

  it('should work with MongoDB', async () => {
    const mongoConnection = testContext.mongoConnection?.getConnection();
    expect(mongoConnection).toBeDefined();
    
    // Use the connection for your test
    // ... test logic here
  });

  it('should work with PostgreSQL', async () => {
    const postgresConnection = testContext.postgresConnection?.getConnection();
    expect(postgresConnection).toBeDefined();
    
    // Use the connection for your test
    // ... test logic here
  });
});

// Example 2: Using the withDatabaseCleanup decorator
describe('Service with Database - Decorator Pattern', () => {
  it('should automatically cleanup MongoDB connection', withDatabaseCleanup(async () => {
    const mongoConnection = createTestDatabaseConnection('mongodb');
    await mongoConnection.connect();
    
    // Use the connection
    const connection = mongoConnection.getConnection();
    expect(connection).toBeDefined();
    
    // No need to manually cleanup - decorator handles it
  }, { useMongoDB: true }));

  it('should automatically cleanup PostgreSQL connection', withDatabaseCleanup(async () => {
    const postgresConnection = createTestDatabaseConnection('postgresql');
    await postgresConnection.connect();
    
    // Use the connection
    const connection = postgresConnection.getConnection();
    expect(connection).toBeDefined();
    
    // No need to manually cleanup - decorator handles it
  }, { usePostgreSQL: true }));
});

// Example 3: Using the withManagedDatabase utility
describe('Service with Database - Managed Connection', () => {
  it('should work with managed MongoDB connection', async () => {
    await withManagedDatabase('mongodb', async (mongooseConnection) => {
      expect(mongooseConnection).toBeDefined();
      
      // Use the connection for your test
      // Connection is automatically cleaned up when function exits
    });
  });

  it('should work with managed PostgreSQL connection', async () => {
    await withManagedDatabase('postgresql', async (sequelizeConnection) => {
      expect(sequelizeConnection).toBeDefined();
      
      // Use the connection for your test
      // Connection is automatically cleaned up when function exits
    });
  });
});

// Example 4: Manual connection management
describe('Service with Database - Manual Management', () => {
  afterEach(async () => {
    // Ensure all connections are closed after each test
    await databaseCleanupManager.closeAllConnections();
  });

  it('should manually manage database connections', async () => {
    // Register a MongoDB connection
    const mongoose = require('mongoose');
    const connection = await mongoose.connect('mongodb://localhost:27017/test_db');
    
    await databaseCleanupManager.registerMongoConnection('manual-test', connection, {
      testDatabase: true
    });

    // Use the connection
    expect(connection).toBeDefined();
    
    // Manually close specific connection
    await databaseCleanupManager.closeMongoConnection('manual-test');
  });
});

// Example 5: Testing database connection failures
describe('Database Connection Error Handling', () => {
  it('should handle MongoDB connection failures gracefully', async () => {
    const mongoConnection = createTestDatabaseConnection('mongodb');
    
    // Mock a connection failure
    jest.spyOn(require('mongoose'), 'connect').mockRejectedValueOnce(
      new Error('Connection failed')
    );
    
    await expect(mongoConnection.connect()).rejects.toThrow('Connection failed');
    
    // Verify no connections are tracked after failure
    const stats = databaseCleanupManager.getConnectionStats();
    expect(stats.total).toBe(0);
  });

  it('should handle cleanup failures gracefully', async () => {
    const mongoConnection = createTestDatabaseConnection('mongodb');
    await mongoConnection.connect();
    
    // Mock a cleanup failure
    const originalClose = databaseCleanupManager.closeMongoConnection;
    jest.spyOn(databaseCleanupManager, 'closeMongoConnection').mockRejectedValueOnce(
      new Error('Cleanup failed')
    );
    
    // Should not throw, but should log the error
    await expect(databaseCleanupManager.closeAllConnections()).resolves.not.toThrow();
    
    // Restore original method
    databaseCleanupManager.closeMongoConnection = originalClose;
  });
});