#!/usr/bin/env node

/**
 * Example demonstrating the Open Handle Detector functionality
 */

import { OpenHandleDetector } from '../handleDetector';
import { resourceCleanupManager } from '../resourceCleanupManager';

async function demonstrateHandleDetection() {
  console.log('=== Open Handle Detector Demo ===\n');
  
  const detector = new OpenHandleDetector({ captureStacks: false, logLevel: 'info' });
  
  // Step 1: Capture baseline
  console.log('1. Capturing baseline handles...');
  detector.captureBaseline();
  const initialReport = detector.getHandleReport();
  console.log(`   Baseline handles: ${initialReport.baseline}`);
  console.log(`   Current handles: ${initialReport.total}`);
  console.log(`   Initial leaks: ${initialReport.leaks.length}\n`);
  
  // Step 2: Create some handles that would cause leaks
  console.log('2. Creating handles that would cause Jest to hang...');
  
  const timer1 = setTimeout(() => {
    console.log('Timer 1 executed (this should not print)');
  }, 10000);
  
  const timer2 = setInterval(() => {
    console.log('Timer 2 executed (this should not print)');
  }, 5000);
  
  // Step 3: Detect leaks
  console.log('3. Detecting resource leaks...');
  const leaks = detector.detectLeaks();
  console.log(`   Detected ${leaks.length} potential leaks:`);
  
  leaks.forEach((leak, index) => {
    console.log(`   ${index + 1}. ${leak.type}: ${leak.description}`);
  });
  
  // Step 4: Check if Jest would hang
  console.log(`\n4. Would Jest hang? ${detector.wouldJestDetectHandles() ? 'YES' : 'NO'}`);
  
  // Step 5: Generate detailed report
  console.log('\n5. Detailed Handle Report:');
  console.log('----------------------------');
  const detailedReport = detector.generateLeakReport();
  console.log(detailedReport);
  
  // Step 6: Demonstrate integration with Resource Cleanup Manager
  console.log('\n6. Integration with Resource Cleanup Manager:');
  
  // Capture baseline in resource manager
  resourceCleanupManager.captureHandleBaseline();
  
  // Register some resources for cleanup
  resourceCleanupManager.registerCleanupFunction('timer1', () => {
    clearTimeout(timer1);
    console.log('   Cleaned up timer1');
  }, 1);
  
  resourceCleanupManager.registerCleanupFunction('timer2', () => {
    clearInterval(timer2);
    console.log('   Cleaned up timer2');
  }, 1);
  
  // Perform cleanup and get report with handle detection
  console.log('\n   Performing cleanup...');
  const cleanupReport = await resourceCleanupManager.cleanup();
  
  console.log('\n   Cleanup Report:');
  console.log(`   - Duration: ${cleanupReport.duration}ms`);
  console.log(`   - Resources cleaned: ${cleanupReport.resources.cleaned}/${cleanupReport.resources.total}`);
  console.log(`   - Errors: ${cleanupReport.errors.length}`);
  console.log(`   - Warnings: ${cleanupReport.warnings.length}`);
  
  if (cleanupReport.openHandles) {
    console.log(`   - Handles before: ${cleanupReport.openHandles.before}`);
    console.log(`   - Handles after: ${cleanupReport.openHandles.after}`);
    console.log(`   - Handle leaks: ${cleanupReport.openHandles.leaks.length}`);
  }
  
  // Step 7: Final verification
  console.log('\n7. Final verification:');
  const finalLeaks = detector.detectLeaks();
  console.log(`   Final leaks detected: ${finalLeaks.length}`);
  console.log(`   Would Jest hang now? ${detector.wouldJestDetectHandles() ? 'YES' : 'NO'}`);
  
  console.log('\n=== Demo Complete ===');
}

// Run the demonstration
if (require.main === module) {
  demonstrateHandleDetection()
    .then(() => {
      console.log('\nDemo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateHandleDetection };