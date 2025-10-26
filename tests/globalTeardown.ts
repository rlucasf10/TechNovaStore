/**
 * Global Jest Teardown for TechNovaStore
 * Performs final cleanup and resource leak detection
 */

import { resourceCleanupManager } from '../shared/utils/src/test/resourceCleanupManager';
import { openHandleDetector } from '../shared/utils/src/test/handleDetector';
import { databaseCleanupManager } from '../shared/utils/src/test/databaseCleanup';
import { testServerManager } from '../shared/utils/src/test/serverCleanup';

export default async function globalTeardown(): Promise<void> {
  console.log('Starting global test teardown...');

  try {
    // Perform comprehensive cleanup
    await testServerManager.stopAllServers();
    await databaseCleanupManager.closeAllConnections();
    await resourceCleanupManager.cleanup();

    // Detect resource leaks in CI environment
    if (process.env.CI === 'true') {
      const leaks = openHandleDetector.detectLeaks();
      if (leaks.length > 0) {
        console.warn('Resource leaks detected after test completion:');
        leaks.forEach((leak, index) => {
          console.warn(`  ${index + 1}. ${leak.type}: ${leak.description}`);
          if (leak.stack) {
            console.warn(`     Stack: ${leak.stack.slice(0, 200)}...`);
          }
        });
      } else {
        console.log('No resource leaks detected');
      }
    }

    console.log('Global test teardown completed successfully');
  } catch (error) {
    console.error('Error during global teardown:', error);
    // Don't throw to avoid masking test failures
  }
}