/**
 * Global Jest Setup for TechNovaStore
 * Configures the Resource Cleanup Manager and test environment
 */

import { resourceCleanupManager } from '../shared/utils/src/test/resourceCleanupManager';
import { openHandleDetector } from '../shared/utils/src/test/handleDetector';

export default async function globalSetup(): Promise<void> {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = process.env.CI ? 'error' : 'warn';
  
  // Configure resource cleanup manager for the test environment
  resourceCleanupManager.updateConfig({
    gracefulTimeout: process.env.CI ? 8000 : 5000,
    forceTimeout: process.env.CI ? 15000 : 10000,
    maxRetries: process.env.CI ? 1 : 2,
    retryDelay: 500,
    logLevel: process.env.CI ? 'error' : 'warn',
    detectHandles: process.env.CI === 'true',
    databaseStrategy: 'hybrid',
    serverStrategy: 'hybrid'
  });

  // Capture baseline handles for leak detection
  if (process.env.CI === 'true') {
    openHandleDetector.captureBaseline();
  }

  // Configure global error handling
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection during tests:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception during tests:', error);
    process.exit(1);
  });

  console.log('Global test setup completed');
}