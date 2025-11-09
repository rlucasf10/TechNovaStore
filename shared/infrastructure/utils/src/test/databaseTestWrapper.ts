/**
 * Database connection wrapper for tests
 * Automatically manages database connections with proper cleanup
 */

import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import { databaseCleanupManager } from './databaseCleanup';
import { config } from '@technovastore/shared-config';

/**
 * MongoDB connection wrapper for tests
 */
export class TestMongoConnection {
  private connection: typeof mongoose | null = null;
  private connectionName: string;

  constructor(name?: string) {
    this.connectionName = name || `test-mongo-${Date.now()}`;
  }

  async connect(): Promise<typeof mongoose> {
    if (this.connection) {
      return this.connection;
    }

    // Create test database name
    const testDbName = `${config.mongodb.uri.split('/').pop()}_test_${Date.now()}`;
    const testUri = config.mongodb.uri.replace(/\/[^/]*$/, `/${testDbName}`);

    try {
      this.connection = await mongoose.connect(testUri, {
        ...config.mongodb.options,
        maxPoolSize: 3, // Reduced for tests
        minPoolSize: 1,
        serverSelectionTimeoutMS: 5000 // Faster timeout for tests
      });

      // Register with cleanup manager
      await databaseCleanupManager.registerMongoConnection(
        this.connectionName,
        this.connection,
        {
          testDatabase: true,
          uri: testUri,
          createdBy: 'TestMongoConnection'
        }
      );

      return this.connection;
    } catch (error) {
      console.error(`Failed to connect to test MongoDB: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await databaseCleanupManager.closeMongoConnection(this.connectionName);
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection !== null && mongoose.connection.readyState === 1;
  }

  getConnection(): typeof mongoose | null {
    return this.connection;
  }
}

/**
 * PostgreSQL connection wrapper for tests
 */
export class TestPostgreSQLConnection {
  private sequelize: Sequelize | null = null;
  private connectionName: string;

  constructor(name?: string) {
    this.connectionName = name || `test-postgres-${Date.now()}`;
  }

  async connect(): Promise<Sequelize> {
    if (this.sequelize) {
      return this.sequelize;
    }

    // Create test database name
    const testDbName = `${config.postgresql.database}_test_${Date.now()}`;

    try {
      this.sequelize = new Sequelize({
        database: testDbName,
        username: config.postgresql.username,
        password: config.postgresql.password,
        host: config.postgresql.host,
        port: config.postgresql.port,
        dialect: 'postgres',
        pool: {
          max: 3, // Reduced for tests
          min: 1,
          acquire: 10000,
          idle: 5000
        },
        logging: false, // Disable logging in tests
        dialectOptions: config.postgresql.dialectOptions
      });

      // Test the connection
      await this.sequelize.authenticate();

      // Register with cleanup manager
      await databaseCleanupManager.registerSequelizeConnection(
        this.connectionName,
        this.sequelize,
        {
          testDatabase: true,
          databaseName: testDbName,
          createdBy: 'TestPostgreSQLConnection'
        }
      );

      return this.sequelize;
    } catch (error) {
      console.error(`Failed to connect to test PostgreSQL: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.sequelize) {
      await databaseCleanupManager.closeSequelizeConnection(this.connectionName);
      this.sequelize = null;
    }
  }

  isConnected(): boolean {
    return this.sequelize !== null;
  }

  getConnection(): Sequelize | null {
    return this.sequelize;
  }
}

/**
 * Factory function to create database connections for tests
 */
export function createTestDatabaseConnection(type: 'mongodb'): TestMongoConnection;
export function createTestDatabaseConnection(type: 'postgresql'): TestPostgreSQLConnection;
export function createTestDatabaseConnection(type: 'mongodb' | 'postgresql', name?: string) {
  switch (type) {
    case 'mongodb':
      return new TestMongoConnection(name);
    case 'postgresql':
      return new TestPostgreSQLConnection(name);
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
}

/**
 * Utility to run a test with automatic database connection management
 */
export async function withManagedDatabase<T>(
  type: 'mongodb',
  testFn: (connection: any) => Promise<T>
): Promise<T>;
export async function withManagedDatabase<T>(
  type: 'postgresql',
  testFn: (connection: any) => Promise<T>
): Promise<T>;
export async function withManagedDatabase<T>(
  type: 'mongodb' | 'postgresql',
  testFn: (connection: any) => Promise<T>
): Promise<T> {
  if (type === 'mongodb') {
    const dbConnection = createTestDatabaseConnection('mongodb');
    try {
      const connection = await dbConnection.connect();
      return await testFn(connection);
    } finally {
      await dbConnection.disconnect();
    }
  } else {
    const dbConnection = createTestDatabaseConnection('postgresql');
    try {
      const connection = await dbConnection.connect();
      return await testFn(connection);
    } finally {
      await dbConnection.disconnect();
    }
  }
}

/**
 * Utility to check if all test database connections are properly closed
 */
export function verifyDatabaseCleanup(): void {
  const stats = databaseCleanupManager.getConnectionStats();
  
  if (stats.total > 0) {
    const connections = databaseCleanupManager.getActiveConnections();
    const testConnections = connections.filter(conn => 
      conn.metadata?.testDatabase === true
    );
    
    if (testConnections.length > 0) {
      console.warn('Test database connections still open:', testConnections.map(conn => ({
        name: conn.name,
        type: conn.type,
        age: Date.now() - conn.createdAt
      })));
      
      throw new Error(`${testConnections.length} test database connections are still open`);
    }
  }
}