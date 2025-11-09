import { resourceCleanupManager } from './resourceCleanupManager';
import { CleanupErrorType, CleanupError } from './types';

/**
 * Database connection interface for tracking
 */
interface DatabaseConnection {
  connection: any;
  type: DatabaseType;
  name: string;
  createdAt: number;
  metadata?: Record<string, any>;
}

/**
 * Supported database types
 */
export type DatabaseType = 'mongodb' | 'postgresql' | 'redis' | 'sequelize';

/**
 * Database Cleanup Manager
 * Manages the lifecycle of database connections during test execution
 */
export class DatabaseCleanupManager {
  private connections: Map<string, DatabaseConnection> = new Map();
  private isShuttingDown = false;

  /**
   * Register a MongoDB connection (mongoose)
   */
  async registerMongoConnection(name: string, connection: any, metadata?: Record<string, any>): Promise<void> {
    if (this.isShuttingDown) {
      console.warn(`[DatabaseCleanup] Cannot register MongoDB connection ${name} during shutdown`);
      return;
    }

    const dbConnection: DatabaseConnection = {
      connection,
      type: 'mongodb',
      name,
      createdAt: Date.now(),
      metadata
    };

    this.connections.set(name, dbConnection);

    // Register with Resource Cleanup Manager
    resourceCleanupManager.registerResource({
      id: `db-mongo-${name}`,
      type: 'database',
      resource: connection,
      cleanup: () => this.closeMongoConnection(name),
      priority: 1, // High priority for databases
      timeout: 5000,
      metadata: { ...metadata, dbType: 'mongodb', dbName: name }
    });
  }

  /**
   * Register a PostgreSQL connection (pg)
   */
  async registerPostgreSQLConnection(name: string, connection: any, metadata?: Record<string, any>): Promise<void> {
    if (this.isShuttingDown) {
      console.warn(`[DatabaseCleanup] Cannot register PostgreSQL connection ${name} during shutdown`);
      return;
    }

    const dbConnection: DatabaseConnection = {
      connection,
      type: 'postgresql',
      name,
      createdAt: Date.now(),
      metadata
    };

    this.connections.set(name, dbConnection);

    // Register with Resource Cleanup Manager
    resourceCleanupManager.registerResource({
      id: `db-pg-${name}`,
      type: 'database',
      resource: connection,
      cleanup: () => this.closePostgreSQLConnection(name),
      priority: 1, // High priority for databases
      timeout: 5000,
      metadata: { ...metadata, dbType: 'postgresql', dbName: name }
    });
  }

  /**
   * Register a Sequelize connection
   */
  async registerSequelizeConnection(name: string, sequelize: any, metadata?: Record<string, any>): Promise<void> {
    if (this.isShuttingDown) {
      console.warn(`[DatabaseCleanup] Cannot register Sequelize connection ${name} during shutdown`);
      return;
    }

    const dbConnection: DatabaseConnection = {
      connection: sequelize,
      type: 'sequelize',
      name,
      createdAt: Date.now(),
      metadata
    };

    this.connections.set(name, dbConnection);

    // Register with Resource Cleanup Manager
    resourceCleanupManager.registerResource({
      id: `db-sequelize-${name}`,
      type: 'database',
      resource: sequelize,
      cleanup: () => this.closeSequelizeConnection(name),
      priority: 1, // High priority for databases
      timeout: 8000, // Sequelize might need more time
      metadata: { ...metadata, dbType: 'sequelize', dbName: name }
    });
  }

  /**
   * Register a Redis connection
   */
  async registerRedisConnection(name: string, connection: any, metadata?: Record<string, any>): Promise<void> {
    if (this.isShuttingDown) {
      console.warn(`[DatabaseCleanup] Cannot register Redis connection ${name} during shutdown`);
      return;
    }

    const dbConnection: DatabaseConnection = {
      connection,
      type: 'redis',
      name,
      createdAt: Date.now(),
      metadata
    };

    this.connections.set(name, dbConnection);

    // Register with Resource Cleanup Manager
    resourceCleanupManager.registerResource({
      id: `db-redis-${name}`,
      type: 'database',
      resource: connection,
      cleanup: () => this.closeRedisConnection(name),
      priority: 2, // Slightly lower priority than SQL databases
      timeout: 3000,
      metadata: { ...metadata, dbType: 'redis', dbName: name }
    });
  }

  /**
   * Close a specific MongoDB connection
   */
  async closeMongoConnection(name: string): Promise<void> {
    const dbConnection = this.connections.get(name);
    if (!dbConnection || dbConnection.type !== 'mongodb') {
      return;
    }

    try {
      const connection = dbConnection.connection;
      
      // Handle different mongoose connection types
      if (connection && typeof connection.close === 'function') {
        // Mongoose connection
        await connection.close();
      } else if (connection && typeof connection.disconnect === 'function') {
        // Alternative mongoose method
        await connection.disconnect();
      } else if (connection && connection.connection && typeof connection.connection.close === 'function') {
        // Nested connection object
        await connection.connection.close();
      }

      this.connections.delete(name);
    } catch (error) {
      console.warn(`[DatabaseCleanup] Failed to close MongoDB connection ${name}:`, error);
      
      // Force close if graceful close fails
      try {
        const connection = dbConnection.connection;
        if (connection && typeof connection.destroy === 'function') {
          connection.destroy();
        }
        this.connections.delete(name);
      } catch (forceError) {
        throw new CleanupError(
          CleanupErrorType.CONNECTION_REFUSED,
          `db-mongo-${name}`,
          'database',
          `Failed to force close MongoDB connection ${name}`,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Close a specific PostgreSQL connection
   */
  async closePostgreSQLConnection(name: string): Promise<void> {
    const dbConnection = this.connections.get(name);
    if (!dbConnection || dbConnection.type !== 'postgresql') {
      return;
    }

    try {
      const connection = dbConnection.connection;
      
      // Handle different pg connection types
      if (connection && typeof connection.end === 'function') {
        // pg.Client or pg.Pool
        await connection.end();
      } else if (connection && typeof connection.close === 'function') {
        // Alternative close method
        await connection.close();
      }

      this.connections.delete(name);
    } catch (error) {
      console.warn(`[DatabaseCleanup] Failed to close PostgreSQL connection ${name}:`, error);
      
      // Force close if graceful close fails
      try {
        const connection = dbConnection.connection;
        if (connection && typeof connection.destroy === 'function') {
          connection.destroy();
        }
        this.connections.delete(name);
      } catch (forceError) {
        throw new CleanupError(
          CleanupErrorType.CONNECTION_REFUSED,
          `db-pg-${name}`,
          'database',
          `Failed to force close PostgreSQL connection ${name}`,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Close a specific Sequelize connection
   */
  async closeSequelizeConnection(name: string): Promise<void> {
    const dbConnection = this.connections.get(name);
    if (!dbConnection || dbConnection.type !== 'sequelize') {
      return;
    }

    try {
      const sequelize = dbConnection.connection;
      
      if (sequelize && typeof sequelize.close === 'function') {
        await sequelize.close();
      }

      this.connections.delete(name);
    } catch (error) {
      console.warn(`[DatabaseCleanup] Failed to close Sequelize connection ${name}:`, error);
      
      // Sequelize doesn't have a force close, so we just remove from tracking
      this.connections.delete(name);
      
      throw new CleanupError(
        CleanupErrorType.CONNECTION_REFUSED,
        `db-sequelize-${name}`,
        'database',
        `Failed to close Sequelize connection ${name}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Close a specific Redis connection
   */
  async closeRedisConnection(name: string): Promise<void> {
    const dbConnection = this.connections.get(name);
    if (!dbConnection || dbConnection.type !== 'redis') {
      return;
    }

    try {
      const connection = dbConnection.connection;
      
      // Handle different redis connection types
      if (connection && typeof connection.quit === 'function') {
        // Graceful close
        await connection.quit();
      } else if (connection && typeof connection.disconnect === 'function') {
        // Alternative method
        await connection.disconnect();
      }

      this.connections.delete(name);
    } catch (error) {
      console.warn(`[DatabaseCleanup] Failed to gracefully close Redis connection ${name}:`, error);
      
      // Force close if graceful close fails
      try {
        const connection = dbConnection.connection;
        if (connection && typeof connection.disconnect === 'function') {
          await connection.disconnect();
        }
        this.connections.delete(name);
      } catch (forceError) {
        throw new CleanupError(
          CleanupErrorType.CONNECTION_REFUSED,
          `db-redis-${name}`,
          'database',
          `Failed to force close Redis connection ${name}`,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Close all registered connections
   */
  async closeAllConnections(): Promise<void> {
    this.isShuttingDown = true;
    
    const connectionNames = Array.from(this.connections.keys());
    const closePromises = connectionNames.map(async (name) => {
      const connection = this.connections.get(name);
      if (!connection) return;

      try {
        switch (connection.type) {
          case 'mongodb':
            await this.closeMongoConnection(name);
            break;
          case 'postgresql':
            await this.closePostgreSQLConnection(name);
            break;
          case 'sequelize':
            await this.closeSequelizeConnection(name);
            break;
          case 'redis':
            await this.closeRedisConnection(name);
            break;
        }
      } catch (error) {
        console.error(`[DatabaseCleanup] Error closing connection ${name}:`, error);
      }
    });

    await Promise.allSettled(closePromises);
    this.isShuttingDown = false;
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): DatabaseConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connections by type
   */
  getConnectionsByType(type: DatabaseType): DatabaseConnection[] {
    return Array.from(this.connections.values()).filter(conn => conn.type === type);
  }

  /**
   * Check if a connection exists
   */
  hasConnection(name: string): boolean {
    return this.connections.has(name);
  }

  /**
   * Get connection info
   */
  getConnectionInfo(name: string): DatabaseConnection | undefined {
    return this.connections.get(name);
  }

  /**
   * Unregister a connection (useful when manually closed)
   */
  unregisterConnection(name: string): boolean {
    const removed = this.connections.delete(name);
    if (removed) {
      // Also unregister from Resource Cleanup Manager
      const connection = this.connections.get(name);
      if (connection) {
        const resourceId = `db-${connection.type}-${name}`;
        resourceCleanupManager.unregisterResource(resourceId);
      }
    }
    return removed;
  }

  /**
   * Get statistics about active connections
   */
  getConnectionStats(): {
    total: number;
    byType: Record<DatabaseType, number>;
    oldestConnection: { name: string; age: number } | null;
  } {
    const connections = Array.from(this.connections.values());
    const byType: Record<DatabaseType, number> = {
      mongodb: 0,
      postgresql: 0,
      sequelize: 0,
      redis: 0
    };

    let oldestConnection: { name: string; age: number } | null = null;
    const now = Date.now();

    connections.forEach(conn => {
      byType[conn.type]++;
      
      const age = now - conn.createdAt;
      if (!oldestConnection || age > oldestConnection.age) {
        oldestConnection = { name: conn.name, age };
      }
    });

    return {
      total: connections.length,
      byType,
      oldestConnection
    };
  }
}

// Global singleton instance
export const databaseCleanupManager = new DatabaseCleanupManager();