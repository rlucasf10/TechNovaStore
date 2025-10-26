/**
 * Test helper utilities for database connections and resource management
 */

import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import { databaseCleanupManager } from './databaseCleanup';
import { testServerManager } from './serverCleanup';
import { config } from '@technovastore/shared-config';

/**
 * Create and register a test MongoDB connection
 */
export async function createTestMongoConnection(name = 'test-mongo'): Promise<typeof mongoose> {
  const testDbName = `${config.mongodb.uri.split('/').pop()}_test_${Date.now()}`;
  const testUri = config.mongodb.uri.replace(/\/[^/]*$/, `/${testDbName}`);
  
  const connection = await mongoose.connect(testUri, {
    ...config.mongodb.options,
    maxPoolSize: 5, // Reduced pool size for tests
    minPoolSize: 1
  });

  // Register with cleanup manager
  await databaseCleanupManager.registerMongoConnection(name, connection, {
    testDatabase: true,
    originalUri: testUri
  });

  return connection;
}

/**
 * Create and register a test PostgreSQL connection
 */
export async function createTestPostgreSQLConnection(name = 'test-postgres'): Promise<Sequelize> {
  const testDbName = `${config.postgresql.database}_test_${Date.now()}`;
  
  const sequelize = new Sequelize({
    database: testDbName,
    username: config.postgresql.username,
    password: config.postgresql.password,
    host: config.postgresql.host,
    port: config.postgresql.port,
    dialect: 'postgres',
    pool: {
      max: 5, // Reduced pool size for tests
      min: 1,
      acquire: 10000,
      idle: 5000
    },
    logging: false, // Disable logging in tests
    dialectOptions: config.postgresql.dialectOptions
  });

  // Test the connection
  await sequelize.authenticate();

  // Register with cleanup manager
  await databaseCleanupManager.registerSequelizeConnection(name, sequelize, {
    testDatabase: true,
    databaseName: testDbName
  });

  return sequelize;
}

/**
 * Setup function for integration tests that need databases
 */
export async function setupIntegrationTest(): Promise<{
  mongo?: typeof mongoose;
  postgres?: Sequelize;
  cleanup: () => Promise<void>;
}> {
  const resources: {
    mongo?: typeof mongoose;
    postgres?: Sequelize;
  } = {};

  // Create test databases if needed
  try {
    // Only create connections if the services actually use them
    if (process.env.USE_MONGODB !== 'false') {
      resources.mongo = await createTestMongoConnection('integration-mongo');
    }
    
    if (process.env.USE_POSTGRESQL !== 'false') {
      resources.postgres = await createTestPostgreSQLConnection('integration-postgres');
    }
  } catch (error) {
    console.warn('Failed to setup test databases:', error);
  }

  return {
    ...resources,
    cleanup: async () => {
      await testServerManager.stopAllServers();
      await databaseCleanupManager.closeAllConnections();
    }
  };
}

/**
 * Wrapper for test functions that automatically handles database cleanup
 */
export function withDatabaseCleanup<T extends any[], R>(
  testFn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await testFn(...args);
    } finally {
      // Ensure cleanup happens even if test fails
      await testServerManager.stopAllServers();
      await databaseCleanupManager.closeAllConnections();
    }
  };
}

/**
 * Create a test-specific database connection that's automatically cleaned up
 */
export async function withTestDatabase<T>(
  type: 'mongodb' | 'postgresql',
  testFn: (connection: any) => Promise<T>
): Promise<T> {
  let connection: any;
  const connectionName = `test-${type}-${Date.now()}`;

  try {
    if (type === 'mongodb') {
      connection = await createTestMongoConnection(connectionName);
    } else {
      connection = await createTestPostgreSQLConnection(connectionName);
    }

    return await testFn(connection);
  } finally {
    // Cleanup the specific connection
    if (type === 'mongodb') {
      await databaseCleanupManager.closeMongoConnection(connectionName);
    } else {
      await databaseCleanupManager.closeSequelizeConnection(connectionName);
    }
  }
}

/**
 * Verify that no database connections are left open
 */
export function verifyNoOpenConnections(): void {
  const stats = databaseCleanupManager.getConnectionStats();
  
  if (stats.total > 0) {
    const activeConnections = databaseCleanupManager.getActiveConnections();
    console.warn('Open database connections detected:', activeConnections.map(conn => ({
      name: conn.name,
      type: conn.type,
      age: Date.now() - conn.createdAt
    })));
    
    throw new Error(`${stats.total} database connections are still open after test completion`);
  }
}

/**
 * Create a test server with automatic cleanup
 */
export async function createTestServer(name: string, app: any, port?: number) {
  return testServerManager.startServer(name, app, port);
}

/**
 * Wait for all database operations to complete
 */
export async function waitForDatabaseOperations(timeoutMs = 2000): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.min(timeoutMs, 100));
  });
}