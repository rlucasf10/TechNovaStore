#!/usr/bin/env node

/**
 * Example demonstrating handle leak detection with actual leaks
 */

import { OpenHandleDetector } from '../handleDetector';
import * as http from 'http';

async function demonstrateHandleLeaks() {
  console.log('=== Handle Leak Detection Demo ===\n');
  
  const detector = new OpenHandleDetector({ captureStacks: false, logLevel: 'info' });
  
  // Step 1: Capture baseline
  console.log('1. Capturing baseline handles...');
  detector.captureBaseline();
  const initialReport = detector.getHandleReport();
  console.log(`   Baseline handles: ${initialReport.baseline}\n`);
  
  // Step 2: Create actual leaks
  console.log('2. Creating resource leaks...');
  
  // Create a long-running timer (leak)
  const leakyTimer = setTimeout(() => {
    console.log('This timer should be detected as a leak');
  }, 30000);
  
  // Create an HTTP server (leak)
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World');
  });
  
  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      console.log(`   Created HTTP server on port ${address && typeof address === 'object' ? address.port : 'unknown'}`);
      resolve();
    });
  });
  
  console.log('   Created long-running timer (30s)');
  
  // Step 3: Detect leaks
  console.log('\n3. Detecting resource leaks...');
  const leaks = detector.detectLeaks();
  console.log(`   Detected ${leaks.length} potential leaks:`);
  
  leaks.forEach((leak, index) => {
    console.log(`   ${index + 1}. ${leak.type}: ${leak.description}`);
  });
  
  // Step 4: Check if Jest would hang
  console.log(`\n4. Would Jest hang? ${detector.wouldJestDetectHandles() ? 'YES - Jest would hang!' : 'NO'}`);
  
  // Step 5: Generate detailed report
  console.log('\n5. Detailed Handle Report:');
  console.log('----------------------------');
  const detailedReport = detector.generateLeakReport();
  console.log(detailedReport);
  
  // Step 6: Demonstrate force cleanup
  console.log('\n6. Attempting to force close leaked handles...');
  const forceResult = await detector.forceCloseLeakedHandles();
  console.log(`   Closed: ${forceResult.closed}`);
  console.log(`   Failed: ${forceResult.failed}`);
  if (forceResult.errors.length > 0) {
    console.log('   Errors:');
    forceResult.errors.forEach(error => console.log(`     - ${error}`));
  }
  
  // Step 7: Manual cleanup of remaining resources
  console.log('\n7. Manual cleanup of remaining resources...');
  clearTimeout(leakyTimer);
  await new Promise<void>((resolve) => {
    server.close(() => {
      console.log('   Manually closed HTTP server');
      resolve();
    });
  });
  console.log('   Manually cleared timer');
  
  // Step 8: Final verification
  console.log('\n8. Final verification after manual cleanup:');
  const finalLeaks = detector.detectLeaks();
  console.log(`   Final leaks detected: ${finalLeaks.length}`);
  console.log(`   Would Jest hang now? ${detector.wouldJestDetectHandles() ? 'YES' : 'NO'}`);
  
  console.log('\n=== Demo Complete ===');
}

// Run the demonstration
if (require.main === module) {
  demonstrateHandleLeaks()
    .then(() => {
      console.log('\nDemo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateHandleLeaks };