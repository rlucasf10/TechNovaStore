/**
 * Example demonstrating server cleanup functionality
 */

import { createServer } from 'http';
import { testServerManager, createTestServer } from '../serverCleanup';
import { resourceCleanupManager } from '../resourceCleanupManager';

async function demonstrateServerCleanup() {
  console.log('🚀 Starting Server Cleanup Demonstration');
  
  try {
    // Create a simple HTTP server
    const app = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Test server is running!', timestamp: new Date() }));
    });

    console.log('📡 Starting test server...');
    const serverInstance = await createTestServer('demo-server', app);
    console.log(`✅ Server started on port ${serverInstance.port}`);

    // Show server is registered
    const runningServers = testServerManager.getRunningServers();
    console.log(`📊 Running servers: ${runningServers.length}`);
    console.log(`   - ${runningServers[0].name} on port ${runningServers[0].port}`);

    // Show resource is registered with cleanup manager
    const activeResources = resourceCleanupManager.getActiveResources();
    const serverResources = activeResources.filter(r => r.type === 'server');
    console.log(`🔧 Server resources registered: ${serverResources.length}`);
    console.log(`   - Resource ID: ${serverResources[0].id}`);
    console.log(`   - Priority: ${serverResources[0].priority}`);

    // Wait a moment to simulate some work
    console.log('⏳ Simulating server work...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Cleanup
    console.log('🧹 Starting cleanup...');
    const report = await resourceCleanupManager.cleanup();
    
    console.log('📋 Cleanup Report:');
    console.log(`   - Duration: ${report.duration}ms`);
    console.log(`   - Resources cleaned: ${report.resources.cleaned}/${report.resources.total}`);
    console.log(`   - Errors: ${report.errors.length}`);
    console.log(`   - Server cleanup time: ${report.byType.server?.avgTime || 0}ms`);

    // Verify cleanup
    const remainingServers = testServerManager.getRunningServers();
    console.log(`✅ Remaining servers after cleanup: ${remainingServers.length}`);

    console.log('🎉 Server cleanup demonstration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during demonstration:', error);
    throw error;
  }
}

// Export for use in tests or direct execution
export { demonstrateServerCleanup };

// Allow direct execution
if (require.main === module) {
  demonstrateServerCleanup()
    .then(() => {
      console.log('Demo completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}