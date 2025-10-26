import { databaseManager } from './database';

/**
 * Initialize all database connections
 * This function should be called at application startup
 */
export async function initializeDatabases(): Promise<void> {
  try {
    await databaseManager.connectAll();
  } catch (error) {
    console.error('Failed to initialize databases:', error);
    process.exit(1);
  }
}

/**
 * Gracefully shutdown all database connections
 * This function should be called during application shutdown
 */
export async function shutdownDatabases(): Promise<void> {
  try {
    await databaseManager.disconnectAll();
  } catch (error) {
    console.error('Error during database shutdown:', error);
  }
}

/**
 * Check health of all database connections
 */
export async function checkDatabaseHealth(): Promise<{
  mongodb: boolean;
  postgresql: boolean;
  redis: boolean;
  overall: boolean;
}> {
  const health = await databaseManager.healthCheck();
  const overall = health.mongodb && health.postgresql && health.redis;
  
  return {
    ...health,
    overall
  };
}