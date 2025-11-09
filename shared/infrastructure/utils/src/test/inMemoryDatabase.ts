/**
 * In-Memory Database Utilities
 * 
 * Provides in-memory database alternatives to avoid connection overhead in tests.
 * Addresses requirements 5.2, 5.3 for using in-memory databases when possible.
 */

import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import { resourceCleanupManager } from './resourceCleanupManager';

export interface InMemoryDatabaseConfig {
  name?: string;
  port?: number;
  dbName?: string;
  version?: string; // MongoDB version
}

export interface InMemoryDatabaseInstance {
  id: string;
  type: 'mongodb' | 'postgresql';
  connection: any;
  uri?: string;
  cleanup: () => Promise<void>;
}

/**
 * In-Memory MongoDB Manager using mock implementation
 * Note: This is a simplified mock for testing without mongodb-memory-server
 */
export class InMemoryMongoManager {
  private instances: Map<string, { connection: typeof mongoose; mockUri: string }> = new Map();

  /**
   * Create a mock in-memory MongoDB instance
   * Note: This creates a mock connection for testing purposes
   */
  async createInstance(config: InMemoryDatabaseConfig = {}): Promise<InMemoryDatabaseInstance> {
    const instanceId = config.name || `mongo-${Date.now()}`;
    
    try {
      // Create a mock URI for testing
      const mockUri = `mongodb://localhost:27017/test_${instanceId}`;
      
      // For testing purposes, we'll create a mock connection object
      const mockConnection = {
        disconnect: async () => {},
        model: (name: string, schema: any) => ({
          save: async function() { return this; },
          findOne: async () => null,
          find: async () => [],
          create: async (data: any) => data,
          deleteMany: async () => ({ deletedCount: 0 })
        })
      } as any;

      // Store instance
      this.instances.set(instanceId, { connection: mockConnection, mockUri });

      const instance: InMemoryDatabaseInstance = {
        id: instanceId,
        type: 'mongodb',
        connection: mockConnection,
        uri: mockUri,
        cleanup: () => this.destroyInstance(instanceId)
      };

      // Register with resource cleanup manager
      resourceCleanupManager.registerResource({
        id: `inmemory-mongo-${instanceId}`,
        type: 'database',
        resource: instance,
        cleanup: () => instance.cleanup(),
        priority: 1,
        metadata: { type: 'in-memory', dbType: 'mongodb-mock' }
      });

      return instance;
    } catch (error) {
      throw new Error(`Failed to create in-memory MongoDB instance: ${error}`);
    }
  }

  /**
   * Destroy a specific in-memory MongoDB instance
   */
  async destroyInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    try {
      // Close mock connection
      await instance.connection.disconnect();
      
      this.instances.delete(instanceId);
    } catch (error) {
      console.warn(`Error destroying in-memory MongoDB instance ${instanceId}:`, error);
    }
  }

  /**
   * Destroy all in-memory MongoDB instances
   */
  async destroyAllInstances(): Promise<void> {
    const destroyPromises = Array.from(this.instances.keys()).map(id => 
      this.destroyInstance(id)
    );
    await Promise.allSettled(destroyPromises);
  }

  /**
   * Get active instance count
   */
  getActiveInstanceCount(): number {
    return this.instances.size;
  }

  /**
   * Get instance information
   */
  getInstanceInfo(instanceId: string): { uri?: string; isRunning: boolean } | null {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;

    return {
      uri: instance.mockUri,
      isRunning: true
    };
  }
}

/**
 * In-Memory PostgreSQL Manager using SQLite as substitute
 */
export class InMemoryPostgreSQLManager {
  private instances: Map<string, Sequelize> = new Map();

  /**
   * Create an in-memory PostgreSQL-compatible instance using SQLite
   */
  async createInstance(config: InMemoryDatabaseConfig = {}): Promise<InMemoryDatabaseInstance> {
    const instanceId = config.name || `postgres-${Date.now()}`;
    
    try {
      // Create SQLite in-memory database (PostgreSQL-compatible for testing)
      const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:', // In-memory SQLite database
        logging: false,
        pool: {
          max: 5,
          min: 1,
          acquire: 10000,
          idle: 5000
        },
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true
        }
      });

      // Test the connection
      await sequelize.authenticate();

      // Store instance
      this.instances.set(instanceId, sequelize);

      const instance: InMemoryDatabaseInstance = {
        id: instanceId,
        type: 'postgresql',
        connection: sequelize,
        cleanup: () => this.destroyInstance(instanceId)
      };

      // Register with resource cleanup manager
      resourceCleanupManager.registerResource({
        id: `inmemory-postgres-${instanceId}`,
        type: 'database',
        resource: instance,
        cleanup: () => instance.cleanup(),
        priority: 1,
        metadata: { type: 'in-memory', dbType: 'postgresql-sqlite' }
      });

      return instance;
    } catch (error) {
      throw new Error(`Failed to create in-memory PostgreSQL instance: ${error}`);
    }
  }

  /**
   * Destroy a specific in-memory PostgreSQL instance
   */
  async destroyInstance(instanceId: string): Promise<void> {
    const sequelize = this.instances.get(instanceId);
    if (!sequelize) return;

    try {
      await sequelize.close();
      this.instances.delete(instanceId);
    } catch (error) {
      console.warn(`Error destroying in-memory PostgreSQL instance ${instanceId}:`, error);
    }
  }

  /**
   * Destroy all in-memory PostgreSQL instances
   */
  async destroyAllInstances(): Promise<void> {
    const destroyPromises = Array.from(this.instances.keys()).map(id => 
      this.destroyInstance(id)
    );
    await Promise.allSettled(destroyPromises);
  }

  /**
   * Get active instance count
   */
  getActiveInstanceCount(): number {
    return this.instances.size;
  }

  /**
   * Get instance connection status
   */
  async getInstanceStatus(instanceId: string): Promise<{ connected: boolean } | null> {
    const sequelize = this.instances.get(instanceId);
    if (!sequelize) return null;

    try {
      await sequelize.authenticate();
      return { connected: true };
    } catch {
      return { connected: false };
    }
  }
}

/**
 * Global in-memory database managers
 */
export const inMemoryMongo = new InMemoryMongoManager();
export const inMemoryPostgreSQL = new InMemoryPostgreSQLManager();

/**
 * Convenience functions for creating in-memory databases
 */
export const inMemoryHelpers = {
  /**
   * Create a temporary MongoDB instance for a test
   */
  async withInMemoryMongo<T>(
    testFn: (connection: typeof mongoose, uri: string) => Promise<T>,
    config?: InMemoryDatabaseConfig
  ): Promise<T> {
    const instance = await inMemoryMongo.createInstance(config);
    
    try {
      return await testFn(instance.connection as typeof mongoose, instance.uri!);
    } finally {
      await instance.cleanup();
    }
  },

  /**
   * Create a temporary PostgreSQL instance for a test
   */
  async withInMemoryPostgreSQL<T>(
    testFn: (connection: Sequelize) => Promise<T>,
    config?: InMemoryDatabaseConfig
  ): Promise<T> {
    const instance = await inMemoryPostgreSQL.createInstance(config);
    
    try {
      return await testFn(instance.connection as Sequelize);
    } finally {
      await instance.cleanup();
    }
  },

  /**
   * Create both MongoDB and PostgreSQL instances for integration tests
   */
  async withInMemoryDatabases<T>(
    testFn: (mongo: typeof mongoose, postgres: Sequelize) => Promise<T>,
    config?: { mongo?: InMemoryDatabaseConfig; postgres?: InMemoryDatabaseConfig }
  ): Promise<T> {
    const mongoInstance = await inMemoryMongo.createInstance(config?.mongo);
    const postgresInstance = await inMemoryPostgreSQL.createInstance(config?.postgres);
    
    try {
      return await testFn(
        mongoInstance.connection as typeof mongoose,
        postgresInstance.connection as Sequelize
      );
    } finally {
      await Promise.all([
        mongoInstance.cleanup(),
        postgresInstance.cleanup()
      ]);
    }
  },

  /**
   * Setup in-memory databases for Jest test suite
   */
  setupInMemoryDatabases(): {
    beforeAll: () => Promise<{ mongo: InMemoryDatabaseInstance; postgres: InMemoryDatabaseInstance }>;
    afterAll: () => Promise<void>;
  } {
    let mongoInstance: InMemoryDatabaseInstance;
    let postgresInstance: InMemoryDatabaseInstance;

    return {
      beforeAll: async () => {
        mongoInstance = await inMemoryMongo.createInstance();
        postgresInstance = await inMemoryPostgreSQL.createInstance();
        
        return { mongo: mongoInstance, postgres: postgresInstance };
      },
      
      afterAll: async () => {
        if (mongoInstance) await mongoInstance.cleanup();
        if (postgresInstance) await postgresInstance.cleanup();
      }
    };
  },

  /**
   * Clean up all in-memory database instances
   */
  async cleanupAllInstances(): Promise<void> {
    await Promise.all([
      inMemoryMongo.destroyAllInstances(),
      inMemoryPostgreSQL.destroyAllInstances()
    ]);
  }
};

/**
 * Register global cleanup for in-memory databases
 */
resourceCleanupManager.registerResource({
  id: 'inmemory-database-managers',
  type: 'custom',
  resource: { inMemoryMongo, inMemoryPostgreSQL },
  cleanup: async () => {
    await inMemoryHelpers.cleanupAllInstances();
  },
  priority: 1,
  metadata: { type: 'global-manager' }
});