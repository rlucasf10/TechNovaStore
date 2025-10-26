/**
 * Example showing how to integrate the Open Handle Detector with Jest tests
 */

import { resourceCleanupManager, openHandleDetector } from '../index';

/**
 * Setup function to be called in Jest's beforeAll or setupFilesAfterEnv
 */
export function setupHandleDetection() {
  // Capture baseline handles at the start of test suite
  resourceCleanupManager.captureHandleBaseline();
  
  // Configure handle detection
  resourceCleanupManager.updateConfig({
    detectHandles: true,
    handleDetectionTimeout: 2000,
    logLevel: process.env.CI ? 'warn' : 'info'
  });
}

/**
 * Cleanup function to be called in Jest's afterAll
 */
export async function cleanupWithHandleDetection() {
  // Perform cleanup and get report with handle detection
  const report = await resourceCleanupManager.cleanup();
  
  // Log warnings if handles are detected
  if (report.openHandles && report.openHandles.leaks.length > 0) {
    console.warn(`⚠️  Detected ${report.openHandles.leaks.length} resource leaks that may cause Jest to hang:`);
    report.openHandles.leaks.forEach((leak, index) => {
      console.warn(`   ${index + 1}. ${leak.type}: ${leak.description}`);
    });
    
    // In CI, we might want to fail the test
    if (process.env.CI === 'true') {
      throw new Error(`Resource leaks detected in CI environment. This will cause Jest to hang.`);
    }
  }
  
  return report;
}

/**
 * Utility function to check for leaks during test execution
 */
export function assertNoHandleLeaks() {
  const leaks = openHandleDetector.detectLeaks();
  if (leaks.length > 0) {
    const report = openHandleDetector.generateLeakReport();
    throw new Error(`Handle leaks detected during test execution:\n${report}`);
  }
}

/**
 * Example Jest setup file content
 */
export const jestSetupExample = `
// jest.setup.ts
import { setupHandleDetection, cleanupWithHandleDetection } from '@technovastore/shared-utils/test';

// Setup handle detection for all tests
beforeAll(() => {
  setupHandleDetection();
});

// Cleanup after all tests with handle detection
afterAll(async () => {
  await cleanupWithHandleDetection();
});

// Optional: Check for leaks after each test in development
if (process.env.NODE_ENV !== 'production') {
  afterEach(() => {
    const leaks = require('@technovastore/shared-utils/test').openHandleDetector.detectLeaks();
    if (leaks.length > 0) {
      console.warn('⚠️  Handle leaks detected after test:', leaks.map(l => l.description));
    }
  });
}
`;

/**
 * Example test file showing proper resource management
 */
export const testFileExample = `
// example.test.ts
import { resourceCleanupManager } from '@technovastore/shared-utils/test';
import * as http from 'http';

describe('Example Service', () => {
  let server: http.Server;
  
  beforeEach(() => {
    // Register cleanup for resources created in this test
    resourceCleanupManager.registerCleanupFunction('test-server', async () => {
      if (server) {
        await new Promise<void>((resolve) => {
          server.close(() => resolve());
        });
      }
    });
  });
  
  afterEach(async () => {
    // Cleanup resources created in this test
    await resourceCleanupManager.cleanup();
  });
  
  it('should create and cleanup server properly', async () => {
    // Create server
    server = http.createServer();
    
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });
    
    // Test logic here...
    
    // Cleanup will happen automatically in afterEach
  });
});
`;

/**
 * Example Jest configuration with handle detection
 */
export const jestConfigExample = `
// jest.config.js
module.exports = {
  // ... other config
  
  // Setup file that includes handle detection
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Enable Jest's built-in handle detection in CI
  detectOpenHandles: process.env.CI === 'true',
  
  // Increase timeout to allow for cleanup
  testTimeout: 30000,
  
  // Don't force exit - let our cleanup system handle it
  forceExit: false,
  
  // Additional configuration for better resource management
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Clear mocks to prevent handle leaks from mock timers
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
`;