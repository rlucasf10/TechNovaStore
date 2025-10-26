/**
 * Integration Example: Timer Cleanup with Existing Test Infrastructure
 * 
 * This example shows how to integrate the Timer Cleanup Manager
 * with the existing resource cleanup system used in TechNovaStore tests.
 */

import { resourceCleanupManager } from '../resourceCleanupManager';
import { setupJestTimerCleanup, createTestTimeout, createTestInterval } from '../jestTimerSetup';
import { waitForDatabaseOperations } from '../testHelpers';

/**
 * Example test suite showing integration with existing cleanup system
 */
describe('Integration Example: Timer Cleanup with Resource Manager', () => {
  // Setup timer cleanup for this test suite
  setupJestTimerCleanup({
    cleanupInAfterEach: true,
    cleanupInAfterAll: true,
    warnOnRemainingTimers: true,
    logStats: false // Set to true for debugging
  });

  afterEach(async () => {
    // Wait for any pending database operations (existing pattern)
    await waitForDatabaseOperations();
    
    // Clean up any resources that might have been created during the test
    const activeResources = resourceCleanupManager.getActiveResources();
    if (activeResources.length > 0) {
      await resourceCleanupManager.cleanup();
    }
    
    // Timer cleanup is handled automatically by setupJestTimerCleanup
  });

  describe('Service with Timers', () => {
    class MockPollingService {
      private pollInterval?: NodeJS.Timeout;
      private retryTimeouts: NodeJS.Timeout[] = [];
      private isRunning = false;

      async start(): Promise<void> {
        this.isRunning = true;
        
        // Use createTestTimeout for better tracking
        this.pollInterval = createTestInterval(() => {
          if (this.isRunning) {
            this.performPoll();
          }
        }, 100);

        // Register the service for cleanup with the resource manager
        resourceCleanupManager.registerResource({
          id: 'mock-polling-service',
          type: 'custom',
          resource: this,
          cleanup: () => this.stop(),
          priority: 4,
          metadata: { serviceType: 'PollingService' }
        });
      }

      private async performPoll(): Promise<void> {
        try {
          // Simulate API call that might fail
          if (Math.random() < 0.2) {
            throw new Error('Simulated API failure');
          }
          
          console.log('Poll successful');
        } catch (error) {
          // Schedule retry with createTestTimeout for proper tracking
          const retryTimeout = createTestTimeout(() => {
            this.performPoll();
          }, 200);
          
          this.retryTimeouts.push(retryTimeout);
        }
      }

      stop(): void {
        this.isRunning = false;
        
        if (this.pollInterval) {
          clearTimeout(this.pollInterval);
          this.pollInterval = undefined;
        }
        
        this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
        this.retryTimeouts = [];
        
        // Unregister from resource manager
        resourceCleanupManager.unregisterResource('mock-polling-service');
      }
    }

    test('should handle service lifecycle with automatic cleanup', async () => {
      const service = new MockPollingService();
      
      // Start the service
      await service.start();
      
      // Let it run for a bit
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Manually stop the service
      service.stop();
      
      // Verify cleanup worked
      const activeResources = resourceCleanupManager.getActiveResources();
      const serviceResource = activeResources.find(r => r.id === 'mock-polling-service');
      expect(serviceResource).toBeUndefined();
    });

    test('should cleanup automatically even without manual stop', async () => {
      const service = new MockPollingService();
      
      // Start the service but don't stop it manually
      await service.start();
      
      // Let it run briefly
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Don't call service.stop() - let automatic cleanup handle it
      // The afterEach hook will clean up both timers and resources
    });
  });

  describe('Complex Timer Scenarios', () => {
    test('should handle nested timers and async operations', async () => {
      const results: string[] = [];
      
      // Create a complex scenario with nested timers
      const mainOperation = new Promise<void>((resolve) => {
        createTestTimeout(() => {
          results.push('step1');
          
          // Nested timeout
          createTestTimeout(() => {
            results.push('step2');
            
            // Another nested timeout
            createTestTimeout(() => {
              results.push('step3');
              resolve();
            }, 30);
          }, 20);
        }, 10);
      });

      // Parallel interval operation
      let intervalCount = 0;
      const intervalOperation = new Promise<void>((resolve) => {
        const interval = createTestInterval(() => {
          intervalCount++;
          results.push(`interval-${intervalCount}`);
          
          if (intervalCount >= 3) {
            clearTimeout(interval);
            resolve();
          }
        }, 25);
      });

      // Wait for both operations to complete
      await Promise.all([mainOperation, intervalOperation]);
      
      expect(results).toContain('step1');
      expect(results).toContain('step2');
      expect(results).toContain('step3');
      expect(results).toContain('interval-1');
      expect(results).toContain('interval-2');
      expect(results).toContain('interval-3');
    });

    test('should handle timer errors gracefully', async () => {
      // Test error handling in timer callbacks
      const errorPromise = new Promise<void>((resolve) => {
        createTestTimeout(() => {
          try {
            throw new Error('Timer callback error');
          } catch (error) {
            console.log('Caught timer error:', (error as Error).message);
            resolve();
          }
        }, 10);
      });

      await errorPromise;
      
      // Cleanup should still work properly despite the error
    });
  });

  describe('Performance and Resource Usage', () => {
    test('should handle many concurrent timers efficiently', async () => {
      const promises: Promise<number>[] = [];
      
      // Create many concurrent timers
      for (let i = 0; i < 20; i++) {
        promises.push(
          new Promise(resolve => {
            createTestTimeout(() => resolve(i), Math.random() * 50);
          })
        );
      }
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(20);
      
      // All timers should be cleaned up automatically
    });

    test('should integrate with database operations', async () => {
      // Simulate a scenario where timers are used alongside database operations
      const dbOperation = new Promise<string>((resolve) => {
        createTestTimeout(() => {
          // Simulate database query completion
          resolve('database-result');
        }, 50);
      });

      const result = await dbOperation;
      expect(result).toBe('database-result');
      
      // Wait for any pending database operations (existing pattern)
      await waitForDatabaseOperations();
      
      // Both timer and database cleanup should work together
    });
  });
});

/**
 * Example showing how to migrate existing tests to use timer cleanup
 */
describe('Migration Example: Before and After', () => {
  setupJestTimerCleanup();

  describe('Before: Manual timer management (problematic)', () => {
    test('old way - manual cleanup required', async () => {
      // This is how timers might have been used before
      let timerId: NodeJS.Timeout;
      
      const promise = new Promise<string>((resolve) => {
        timerId = setTimeout(() => {
          resolve('completed');
        }, 50);
      });

      const result = await promise;
      expect(result).toBe('completed');
      
      // Manual cleanup was required and often forgotten
      // clearTimeout(timerId); // Often forgotten!
    });
  });

  describe('After: Automatic timer management (improved)', () => {
    test('new way - automatic cleanup', async () => {
      // This is the improved way using timer cleanup
      const promise = new Promise<string>((resolve) => {
        createTestTimeout(() => {
          resolve('completed');
        }, 50);
      });

      const result = await promise;
      expect(result).toBe('completed');
      
      // No manual cleanup needed - handled automatically!
    });
  });
});

/**
 * Example showing best practices for timer usage in tests
 */
describe('Best Practices Example', () => {
  setupJestTimerCleanup({
    warnOnRemainingTimers: true,
    maxTimersWarningThreshold: 5,
    logStats: true
  });

  test('use createTestTimeout for one-off delays', async () => {
    const result = await new Promise<string>((resolve) => {
      createTestTimeout(() => resolve('delayed-result'), 30);
    });
    
    expect(result).toBe('delayed-result');
  });

  test('use createTestInterval for periodic operations', async () => {
    let count = 0;
    
    const result = await new Promise<number>((resolve) => {
      const interval = createTestInterval(() => {
        count++;
        if (count >= 3) {
          clearTimeout(interval);
          resolve(count);
        }
      }, 20);
    });
    
    expect(result).toBe(3);
  });

  test('combine with resource cleanup for complex services', async () => {
    class TestService {
      private timer?: NodeJS.Timeout;
      
      start(): void {
        this.timer = createTestInterval(() => {
          console.log('Service tick');
        }, 100);
        
        // Register with resource manager for comprehensive cleanup
        resourceCleanupManager.registerResource({
          id: 'test-service',
          type: 'custom',
          resource: this,
          cleanup: () => this.stop(),
          priority: 3
        });
      }
      
      stop(): void {
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = undefined;
        }
      }
    }

    const service = new TestService();
    service.start();
    
    // Let it run briefly
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Service will be cleaned up automatically by resource manager
  });
});