import { resourceCleanupManager } from './resourceCleanupManager';
import { CleanupResource, CleanupFunction, ResourceType, CleanupConfig } from './types';
import { getDefaultPriority, createPriorityCalculator } from './priorities';
import { createCleanupConfig } from './config';

/**
 * Helper functions for easier integration with test frameworks
 */

/**
 * Setup test cleanup with optional configuration
 */
export function setupTestCleanup(config?: Partial<CleanupConfig>): void {
  if (config) {
    const fullConfig = createCleanupConfig(config);
    resourceCleanupManager.updateConfig(fullConfig);
  }
}

/**
 * Create and register a test resource with automatic cleanup
 */
export function createTestResource<T>(
  id: string,
  type: ResourceType,
  resource: T,
  cleanup: CleanupFunction,
  options?: {
    priority?: number;
    timeout?: number;
    metadata?: Record<string, any>;
  }
): T {
  const priority = options?.priority ?? getDefaultPriority(type);
  
  resourceCleanupManager.registerResource({
    id,
    type,
    resource,
    cleanup,
    priority,
    timeout: options?.timeout,
    metadata: options?.metadata
  });
  
  return resource;
}

/**
 * Wrapper function that automatically registers cleanup for a resource
 */
export async function withCleanup<T>(
  id: string,
  type: ResourceType,
  factory: () => Promise<T> | T,
  cleanup: (resource: T) => Promise<void> | void,
  options?: {
    priority?: number;
    timeout?: number;
    metadata?: Record<string, any>;
  }
): Promise<T> {
  const resource = await factory();
  
  createTestResource(
    id,
    type,
    resource,
    () => cleanup(resource),
    options
  );
  
  return resource;
}

/**
 * Register cleanup to run after each test (for Jest afterEach)
 */
export function cleanupAfterTest(): void {
  if (typeof afterEach !== 'undefined') {
    afterEach(async () => {
      await resourceCleanupManager.cleanup();
    });
  }
}

/**
 * Register cleanup to run after all tests (for Jest afterAll)
 */
export function cleanupAfterAll(): void {
  if (typeof afterAll !== 'undefined') {
    afterAll(async () => {
      await resourceCleanupManager.cleanup();
    });
  }
}

/**
 * Create a scoped cleanup manager for a specific test suite
 */
export function createScopedCleanup(suiteName: string) {
  const scopedResources = new Set<string>();
  
  return {
    /**
     * Register a resource with scope tracking
     */
    register<T>(
      id: string,
      type: ResourceType,
      resource: T,
      cleanup: CleanupFunction,
      options?: {
        priority?: number;
        timeout?: number;
        metadata?: Record<string, any>;
      }
    ): T {
      const scopedId = `${suiteName}:${id}`;
      scopedResources.add(scopedId);
      
      return createTestResource(scopedId, type, resource, cleanup, options);
    },

    /**
     * Cleanup only resources registered in this scope
     */
    async cleanup(): Promise<void> {
      const allResources = resourceCleanupManager.getActiveResources();
      const scopeResources = allResources.filter(r => scopedResources.has(r.id));
      
      // Temporarily remove other resources
      const otherResources = allResources.filter(r => !scopedResources.has(r.id));
      otherResources.forEach(r => resourceCleanupManager.unregisterResource(r.id));
      
      try {
        await resourceCleanupManager.cleanup();
      } finally {
        // Re-register other resources
        otherResources.forEach(r => {
          resourceCleanupManager.registerResource(r);
        });
        scopedResources.clear();
      }
    },

    /**
     * Get resources in this scope
     */
    getResources(): CleanupResource[] {
      return resourceCleanupManager.getActiveResources()
        .filter(r => scopedResources.has(r.id));
    }
  };
}

/**
 * Utility to create a cleanup function that handles errors gracefully
 */
export function safeCleanup(cleanup: CleanupFunction, fallback?: CleanupFunction): CleanupFunction {
  return async () => {
    try {
      await cleanup();
    } catch (error) {
      console.warn('Primary cleanup failed, trying fallback:', error);
      if (fallback) {
        try {
          await fallback();
        } catch (fallbackError) {
          console.error('Fallback cleanup also failed:', fallbackError);
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
  };
}

/**
 * Create a timeout wrapper for cleanup functions
 */
export function withTimeout(cleanup: CleanupFunction, timeoutMs: number): CleanupFunction {
  return () => {
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Cleanup timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve(cleanup())
        .then(() => {
          clearTimeout(timeoutId);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  };
}

/**
 * Batch register multiple resources
 */
export function registerResources(resources: Array<{
  id: string;
  type: ResourceType;
  resource: any;
  cleanup: CleanupFunction;
  priority?: number;
  timeout?: number;
  metadata?: Record<string, any>;
}>): void {
  const priorityCalculator = createPriorityCalculator();
  
  resources.forEach(({ id, type, resource, cleanup, priority, timeout, metadata }) => {
    const calculatedPriority = priority ?? priorityCalculator(type, Date.now(), metadata);
    
    resourceCleanupManager.registerResource({
      id,
      type,
      resource,
      cleanup,
      priority: calculatedPriority,
      timeout,
      metadata
    });
  });
}

/**
 * Create a resource factory with automatic cleanup registration
 */
export function createResourceFactory<T>(
  type: ResourceType,
  defaultCleanup: (resource: T) => Promise<void> | void,
  defaultOptions?: {
    priority?: number;
    timeout?: number;
    metadata?: Record<string, any>;
  }
) {
  return (
    id: string,
    resource: T,
    customCleanup?: CleanupFunction,
    customOptions?: {
      priority?: number;
      timeout?: number;
      metadata?: Record<string, any>;
    }
  ): T => {
    const cleanup = customCleanup || (() => defaultCleanup(resource));
    const options = { ...defaultOptions, ...customOptions };
    
    return createTestResource(id, type, resource, cleanup, options);
  };
}

/**
 * Database-specific helper functions
 */

/**
 * Create a MongoDB connection with automatic cleanup
 */
export async function createTestMongoConnection(
  id: string,
  connectionFactory: () => Promise<any> | any,
  options?: {
    timeout?: number;
    metadata?: Record<string, any>;
  }
): Promise<any> {
  const { databaseCleanupManager } = await import('./databaseCleanup');
  
  const connection = await connectionFactory();
  await databaseCleanupManager.registerMongoConnection(id, connection, options?.metadata);
  
  return connection;
}

/**
 * Create a PostgreSQL connection with automatic cleanup
 */
export async function createTestPostgreSQLConnection(
  id: string,
  connectionFactory: () => Promise<any> | any,
  options?: {
    timeout?: number;
    metadata?: Record<string, any>;
  }
): Promise<any> {
  const { databaseCleanupManager } = await import('./databaseCleanup');
  
  const connection = await connectionFactory();
  await databaseCleanupManager.registerPostgreSQLConnection(id, connection, options?.metadata);
  
  return connection;
}

/**
 * Create a Sequelize connection with automatic cleanup
 */
export async function createTestSequelizeConnection(
  id: string,
  sequelizeFactory: () => Promise<any> | any,
  options?: {
    timeout?: number;
    metadata?: Record<string, any>;
  }
): Promise<any> {
  const { databaseCleanupManager } = await import('./databaseCleanup');
  
  const sequelize = await sequelizeFactory();
  await databaseCleanupManager.registerSequelizeConnection(id, sequelize, options?.metadata);
  
  return sequelize;
}

/**
 * Create a Redis connection with automatic cleanup
 */
export async function createTestRedisConnection(
  id: string,
  connectionFactory: () => Promise<any> | any,
  options?: {
    timeout?: number;
    metadata?: Record<string, any>;
  }
): Promise<any> {
  const { databaseCleanupManager } = await import('./databaseCleanup');
  
  const connection = await connectionFactory();
  await databaseCleanupManager.registerRedisConnection(id, connection, options?.metadata);
  
  return connection;
}

/**
 * Setup database cleanup for Jest tests
 */
export function setupDatabaseCleanup(): void {
  if (typeof afterAll !== 'undefined') {
    afterAll(async () => {
      const { databaseCleanupManager } = await import('./databaseCleanup');
      await databaseCleanupManager.closeAllConnections();
    });
  }
}