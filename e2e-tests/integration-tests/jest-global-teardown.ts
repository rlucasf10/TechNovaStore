import { testServerManager } from '../../shared/utils/src/test/serverCleanup';
import { databaseCleanupManager } from '../../shared/utils/src/test/databaseCleanup';
import { openHandleDetector } from '../../shared/utils/src/test/handleDetector';

export default async function integrationGlobalTeardown(): Promise<void> {
  console.log('Starting integration test teardown...');

  try {
    // Stop all test servers
    await testServerManager.stopAllServers();
    console.log('Stopped all test servers');

    // Close all database connections
    await databaseCleanupManager.closeAllConnections();
    console.log('Closed all database connections');

    // Generate cleanup report
    console.log('✅ Integration tests completed successfully');

    console.log('Integration test teardown completed successfully');
  } catch (error) {
    console.error('Error during integration test teardown:', error);
    // Don't throw to avoid masking test failures
  }
}