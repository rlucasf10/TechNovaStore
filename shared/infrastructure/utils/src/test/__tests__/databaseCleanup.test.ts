/**
 * Tests for the Database Cleanup Manager
 */

import { databaseCleanupManager } from '../databaseCleanup';
import { resourceCleanupManager } from '../resourceCleanupManager';

describe('Database Cleanup Manager', () => {
  afterEach(async () => {
    // Clean up after each test
    await databaseCleanupManager.closeAllConnections();
    await resourceCleanupManager.cleanup();
  });

  describe('Connection Registration', () => {
    it('should register and track MongoDB connections', async () => {
      const mockConnection = {
        close: jest.fn().mockResolvedValue(undefined)
      };

      await databaseCleanupManager.registerMongoConnection('test-mongo', mockConnection, {
        testDatabase: true
      });

      const stats = databaseCleanupManager.getConnectionStats();
      expect(stats.total).toBe(1);
      expect(stats.byType.mongodb).toBe(1);

      const connections = databaseCleanupManager.getActiveConnections();
      expect(connections).toHaveLength(1);
      expect(connections[0].name).toBe('test-mongo');
      expect(connections[0].type).toBe('mongodb');
    });

    it('should register and track PostgreSQL connections', async () => {
      const mockConnection = {
        end: jest.fn().mockResolvedValue(undefined)
      };

      await databaseCleanupManager.registerPostgreSQLConnection('test-postgres', mockConnection, {
        testDatabase: true
      });

      const stats = databaseCleanupManager.getConnectionStats();
      expect(stats.total).toBe(1);
      expect(stats.byType.postgresql).toBe(1);

      const connections = databaseCleanupManager.getActiveConnections();
      expect(connections).toHaveLength(1);
      expect(connections[0].name).toBe('test-postgres');
      expect(connections[0].type).toBe('postgresql');
    });

    it('should register and track Sequelize connections', async () => {
      const mockSequelize = {
        close: jest.fn().mockResolvedValue(undefined)
      };

      await databaseCleanupManager.registerSequelizeConnection('test-sequelize', mockSequelize, {
        testDatabase: true
      });

      const stats = databaseCleanupManager.getConnectionStats();
      expect(stats.total).toBe(1);
      expect(stats.byType.sequelize).toBe(1);
    });

    it('should register and track Redis connections', async () => {
      const mockRedis = {
        quit: jest.fn().mockResolvedValue(undefined)
      };

      await databaseCleanupManager.registerRedisConnection('test-redis', mockRedis, {
        testDatabase: true
      });

      const stats = databaseCleanupManager.getConnectionStats();
      expect(stats.total).toBe(1);
      expect(stats.byType.redis).toBe(1);
    });
  });

  describe('Connection Cleanup', () => {
    it('should close MongoDB connections gracefully', async () => {
      const mockConnection = {
        close: jest.fn().mockResolvedValue(undefined)
      };

      await databaseCleanupManager.registerMongoConnection('test-mongo', mockConnection);
      await databaseCleanupManager.closeMongoConnection('test-mongo');

      expect(mockConnection.close).toHaveBeenCalledTimes(1);

      const stats = databaseCleanupManager.getConnectionStats();
      expect(stats.total).toBe(0);
    });

    it('should close PostgreSQL connections gracefully', async () => {
      const mockConnection = {
        end: jest.fn().mockResolvedValue(undefined)
      };

      await databaseCleanupManager.registerPostgreSQLConnection('test-postgres', mockConnection);
      await databaseCleanupManager.closePostgreSQLConnection('test-postgres');

      expect(mockConnection.end).toHaveBeenCalledTimes(1);

      const stats = databaseCleanupManager.getConnectionStats();
      expect(stats.total).toBe(0);
    });

    it('should handle connection close failures gracefully', async () => {
      const mockConnection = {
        close: jest.fn().mockRejectedValue(new Error('Close failed')),
        destroy: jest.fn()
      };

      await databaseCleanupManager.registerMongoConnection('test-mongo', mockConnection);

      // Should not throw, but should handle the error
      await expect(databaseCleanupManager.closeMongoConnection('test-mongo')).rejects.toThrow();

      expect(mockConnection.close).toHaveBeenCalledTimes(1);
      expect(mockConnection.destroy).toHaveBeenCalledTimes(1);
    });

    it('should close all connections at once', async () => {
      const mockMongo = {
        close: jest.fn().mockResolvedValue(undefined)
      };
      const mockPostgres = {
        end: jest.fn().mockResolvedValue(undefined)
      };

      await databaseCleanupManager.registerMongoConnection('test-mongo', mockMongo);
      await databaseCleanupManager.registerPostgreSQLConnection('test-postgres', mockPostgres);

      const statsBefore = databaseCleanupManager.getConnectionStats();
      expect(statsBefore.total).toBe(2);

      await databaseCleanupManager.closeAllConnections();

      expect(mockMongo.close).toHaveBeenCalledTimes(1);
      expect(mockPostgres.end).toHaveBeenCalledTimes(1);

      const statsAfter = databaseCleanupManager.getConnectionStats();
      expect(statsAfter.total).toBe(0);
    });
  });

  describe('Integration with Resource Cleanup Manager', () => {
    it('should register database connections with resource cleanup manager', async () => {
      const mockConnection = {
        close: jest.fn().mockResolvedValue(undefined)
      };

      await databaseCleanupManager.registerMongoConnection('test-mongo', mockConnection);

      const activeResources = resourceCleanupManager.getActiveResources();
      const dbResource = activeResources.find(r => r.id === 'db-mongo-test-mongo');

      expect(dbResource).toBeDefined();
      expect(dbResource?.type).toBe('database');
      expect(dbResource?.priority).toBe(1);
    });

    it('should cleanup database connections through resource manager', async () => {
      const mockConnection = {
        close: jest.fn().mockResolvedValue(undefined)
      };

      await databaseCleanupManager.registerMongoConnection('test-mongo', mockConnection);

      // Cleanup through resource manager should also close database connections
      await resourceCleanupManager.cleanup();

      expect(mockConnection.close).toHaveBeenCalledTimes(1);

      const stats = databaseCleanupManager.getConnectionStats();
      expect(stats.total).toBe(0);
    });
  });

  describe('Connection Information', () => {
    it('should provide connection statistics', async () => {
      const mockMongo = { close: jest.fn().mockResolvedValue(undefined) };
      const mockPostgres = { end: jest.fn().mockResolvedValue(undefined) };

      await databaseCleanupManager.registerMongoConnection('mongo1', mockMongo);
      await databaseCleanupManager.registerMongoConnection('mongo2', mockMongo);
      await databaseCleanupManager.registerPostgreSQLConnection('postgres1', mockPostgres);

      const stats = databaseCleanupManager.getConnectionStats();

      expect(stats.total).toBe(3);
      expect(stats.byType.mongodb).toBe(2);
      expect(stats.byType.postgresql).toBe(1);
      expect(stats.byType.redis).toBe(0);
      expect(stats.byType.sequelize).toBe(0);
      expect(stats.oldestConnection).toBeDefined();
    });

    it('should check if connections exist', async () => {
      const mockConnection = {
        close: jest.fn().mockResolvedValue(undefined)
      };

      expect(databaseCleanupManager.hasConnection('test-mongo')).toBe(false);

      await databaseCleanupManager.registerMongoConnection('test-mongo', mockConnection);

      expect(databaseCleanupManager.hasConnection('test-mongo')).toBe(true);

      await databaseCleanupManager.closeMongoConnection('test-mongo');

      expect(databaseCleanupManager.hasConnection('test-mongo')).toBe(false);
    });

    it('should get connection info', async () => {
      const mockConnection = {
        close: jest.fn().mockResolvedValue(undefined)
      };

      await databaseCleanupManager.registerMongoConnection('test-mongo', mockConnection, {
        testDatabase: true,
        customField: 'value'
      });

      const info = databaseCleanupManager.getConnectionInfo('test-mongo');

      expect(info).toBeDefined();
      expect(info?.name).toBe('test-mongo');
      expect(info?.type).toBe('mongodb');
      expect(info?.metadata?.testDatabase).toBe(true);
      expect(info?.metadata?.customField).toBe('value');
    });
  });
});