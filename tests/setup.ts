/**
 * Global test setup for TechNovaStore
 * Integrates the Resource Cleanup Manager for proper resource management
 */

/// <reference types="jest" />

import { resourceCleanupManager } from '../shared/utils/src/test/resourceCleanupManager';
import { databaseCleanupManager } from '../shared/utils/src/test/databaseCleanup';
import { testServerManager } from '../shared/utils/src/test/serverCleanup';
import { timerCleanupManager } from '../shared/utils/src/test/timerCleanup';
import { openHandleDetector } from '../shared/utils/src/test/handleDetector';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = process.env.CI ? 'error' : 'warn';

// Configure cleanup manager for test environment
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

// Mock console methods to reduce noise during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  // Capture baseline handles for leak detection
  if (process.env.CI === 'true') {
    openHandleDetector.captureBaseline();
  }

  // Only show errors during tests unless in debug mode
  if (process.env.DEBUG !== 'true') {
    console.log = jest.fn();
    if (process.env.CI === 'true') {
      console.warn = jest.fn();
    }
  }
  console.error = originalConsoleError;
});

beforeEach(() => {
  // Clear any timers from previous tests
  timerCleanupManager.clearAllTimers();
});

afterEach(async () => {
  // Clean up resources after each test
  try {
    await resourceCleanupManager.cleanup();
  } catch (error) {
    console.error('Error during afterEach cleanup:', error);
  }
});

afterAll(async () => {
  // Perform comprehensive cleanup
  try {
    await testServerManager.stopAllServers();
    await databaseCleanupManager.closeAllConnections();
    await resourceCleanupManager.cleanup();
    
    // Check for resource leaks in CI
    if (process.env.CI === 'true') {
      const leaks = openHandleDetector.detectLeaks();
      if (leaks.length > 0) {
        console.warn(`Unit tests completed with ${leaks.length} potential resource leaks`);
      }
    }
  } catch (error) {
    console.error('Error during resource cleanup:', error);
  }

  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Handle unhandled rejections and exceptions during tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Export test utilities for use in test files
export { 
  resourceCleanupManager,
  databaseCleanupManager,
  testServerManager,
  timerCleanupManager 
} from '../shared/utils/src/test';