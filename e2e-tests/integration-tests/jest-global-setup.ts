/**
 * Global Setup for Integration Tests
 * Prepares the environment for integration tests with databases and external services
 */

import { resourceCleanupManager } from '../../shared/utils/src/test/resourceCleanupManager';
import { openHandleDetector } from '../../shared/utils/src/test/handleDetector';

export default async function integrationGlobalSetup(): Promise<void> {
  console.log('Setting up integration test environment...');

  // Set environment variables for integration tests
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  
  // Database configuration for tests
  process.env.MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/technovastore_test';
  process.env.POSTGRES_TEST_URI = process.env.POSTGRES_TEST_URI || 'postgresql://localhost:5432/technovastore_test';
  
  // Configure resource cleanup for integration tests
  resourceCleanupManager.updateConfig({
    gracefulTimeout: 15000,
    forceTimeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    logLevel: 'error',
    detectHandles: true,
    databaseStrategy: 'hybrid',
    serverStrategy: 'hybrid'
  });

  // Capture baseline handles
  openHandleDetector.captureBaseline();

  // Configure global error handling for integration tests
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection in integration test setup:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception in integration test setup:', error);
  });

  console.log('Integration test environment setup completed');
}