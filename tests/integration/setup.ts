/**
 * Integration Test Setup for TechNovaStore
 * Configures enhanced cleanup for integration tests with databases and servers
 */

/// <reference types="jest" />

import { resourceCleanupManager } from '../../shared/utils/src/test/resourceCleanupManager';
import { databaseCleanupManager } from '../../shared/utils/src/test/databaseCleanup';
import { testServerManager } from '../../shared/utils/src/test/serverCleanup';
import { openHandleDetector } from '../../shared/utils/src/test/handleDetector';
import { enhancedAfterEach, enhancedAfterAll } from '../../shared/utils/src/test/integrationTestSetup';

// Set integration test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Minimal logging for integration tests

// Configure cleanup manager for integration tests with longer timeouts
resourceCleanupManager.updateConfig({
  gracefulTimeout: 10000,
  forceTimeout: 20000,
  maxRetries: 3,
  retryDelay: 1000,
  logLevel: 'error',
  detectHandles: true,
  databaseStrategy: 'hybrid',
  serverStrategy: 'hybrid'
});

// Global setup for all integration tests
beforeAll(async () => {
  // Capture baseline handles for leak detection
  openHandleDetector.captureBaseline();
  
  console.log('Integration test environment initialized');
});

// Enhanced cleanup after each test
afterEach(async () => {
  await enhancedAfterEach();
});

// Comprehensive cleanup after all tests
afterAll(async () => {
  await enhancedAfterAll();
  
  // Final leak detection for integration tests
  const leaks = openHandleDetector.detectLeaks();
  if (leaks.length > 0) {
    console.warn(`Integration tests completed with ${leaks.length} potential resource leaks`);
    leaks.forEach((leak, index) => {
      console.warn(`  ${index + 1}. ${leak.type}: ${leak.description}`);
    });
  }
});

// Handle unhandled rejections and exceptions during integration tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in integration test:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception in integration test:', error);
});

// Export utilities for integration tests
export { 
  setupIntegrationTestWithDatabases,
  setupIntegrationTestHooks,
  withDatabaseCleanup 
} from '../../shared/utils/src/test/integrationTestSetup';