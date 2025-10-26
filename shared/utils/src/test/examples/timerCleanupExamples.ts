/**
 * Timer Cleanup Examples
 * 
 * This file demonstrates how to use the Timer Cleanup Manager
 * in various testing scenarios to prevent Jest from hanging.
 */

import { 
  setupJestTimerCleanup, 
  withTimerIsolation,
  createTestTimeout,
  createTestInterval,
  assertNoActiveTimers,
  setupFakeTimersWithCleanup
} from '../jestTimerSetup';
import { managedTimers } from '../timerCleanup';

/**
 * Example 1: Basic Jest setup with automatic timer cleanup
 */
describe('Example 1: Basic Timer Cleanup Setup', () => {
  // Setup automatic timer cleanup for this test suite
  setupJestTimerCleanup({
    cleanupInAfterEach: true,
    cleanupInAfterAll: true,
    warnOnRemainingTimers: true,
    logStats: true
  });

  test('should automatically clean up setTimeout', async () => {
    // This timer will be automatically cleaned up after the test
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('completed'), 100);
    });

    const result = await promise;
    expect(result).toBe('completed');
    
    // No manual cleanup needed - handled automatically
  });

  test('should automatically clean up setInterval', (done) => {
    let count = 0;
    
    const interval = setInterval(() => {
      count++;
      if (count >= 3) {
        clearInterval(interval);
        expect(count).toBe(3);
        done();
      }
    }, 10);
    
    // Interval will be cleaned up automatically if test fails or doesn't clear it
  });
});

/**
 * Example 2: Using managed timers for better tracking
 */
describe('Example 2: Managed Timers', () => {
  setupJestTimerCleanup();

  test('should use managed timers for better control', async () => {
    // Use managed timers instead of global setTimeout/setInterval
    const promise = new Promise<number>((resolve) => {
      managedTimers.setTimeout(() => resolve(42), 50);
    });

    const result = await promise;
    expect(result).toBe(42);
  });

  test('should track managed intervals', (done) => {
    let counter = 0;
    
    const interval = managedTimers.setInterval(() => {
      counter++;
      if (counter === 2) {
        managedTimers.clearInterval(interval);
        expect(counter).toBe(2);
        done();
      }
    }, 25);
  });
});

/**
 * Example 3: Timer isolation for complex tests
 */
describe('Example 3: Timer Isolation', () => {
  setupJestTimerCleanup();

  test('should isolate timers within test execution', async () => {
    await withTimerIsolation(async () => {
      // Any timers created here are automatically cleaned up
      const results = await Promise.all([
        new Promise(resolve => setTimeout(() => resolve('timer1'), 10)),
        new Promise(resolve => setTimeout(() => resolve('timer2'), 20)),
        new Promise(resolve => setTimeout(() => resolve('timer3'), 30))
      ]);

      expect(results).toEqual(['timer1', 'timer2', 'timer3']);
      // Timers are cleaned up automatically when this function exits
    });

    // Verify no timers remain after isolation
    assertNoActiveTimers();
  });
});

/**
 * Example 4: Using fake timers with cleanup
 */
describe('Example 4: Fake Timers Integration', () => {
  setupFakeTimersWithCleanup();

  test('should work with Jest fake timers', () => {
    const callback = jest.fn();
    
    // Use fake timers for synchronous testing
    setTimeout(callback, 1000);
    
    // Fast-forward time
    jest.advanceTimersByTime(1000);
    
    expect(callback).toHaveBeenCalledTimes(1);
    // Cleanup is handled automatically
  });

  test('should handle intervals with fake timers', () => {
    const callback = jest.fn();
    
    setInterval(callback, 100);
    
    // Advance time to trigger interval multiple times
    jest.advanceTimersByTime(350);
    
    expect(callback).toHaveBeenCalledTimes(3);
  });
});

/**
 * Example 5: Testing timer-heavy components
 */
describe('Example 5: Timer-Heavy Component Testing', () => {
  setupJestTimerCleanup({
    warnOnRemainingTimers: true,
    maxTimersWarningThreshold: 5
  });

  class TimerComponent {
    private timers: NodeJS.Timeout[] = [];
    private intervals: NodeJS.Timeout[] = [];

    startPeriodicTask(interval: number): void {
      const timer = setInterval(() => {
        console.log('Periodic task executed');
      }, interval);
      this.intervals.push(timer);
    }

    scheduleDelayedTask(delay: number): Promise<void> {
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          console.log('Delayed task executed');
          resolve();
        }, delay);
        this.timers.push(timer);
      });
    }

    cleanup(): void {
      this.timers.forEach(timer => clearTimeout(timer));
      this.intervals.forEach(interval => clearTimeout(interval));
      this.timers = [];
      this.intervals = [];
    }
  }

  test('should properly cleanup component timers', async () => {
    const component = new TimerComponent();
    
    // Start some timers
    component.startPeriodicTask(100);
    await component.scheduleDelayedTask(50);
    
    // Cleanup component timers
    component.cleanup();
    
    // Verify no timers remain
    assertNoActiveTimers();
  });

  test('should handle component without manual cleanup', () => {
    const component = new TimerComponent();
    
    // Start timers but don't clean up manually
    component.startPeriodicTask(200);
    
    // The automatic cleanup will handle remaining timers
    // and warn if there are too many
  });
});

/**
 * Example 6: Integration test with multiple timer sources
 */
describe('Example 6: Integration Test Scenarios', () => {
  setupJestTimerCleanup({
    cleanupInAfterEach: true,
    logStats: true
  });

  test('should handle complex timer interactions', async () => {
    const results: string[] = [];
    
    // Simulate complex async operations with multiple timers
    const operations = [
      new Promise<void>(resolve => {
        setTimeout(() => {
          results.push('operation1');
          resolve();
        }, 10);
      }),
      
      new Promise<void>(resolve => {
        let count = 0;
        const interval = setInterval(() => {
          count++;
          results.push(`interval-${count}`);
          if (count >= 2) {
            clearInterval(interval);
            resolve();
          }
        }, 15);
      }),
      
      new Promise<void>(resolve => {
        setTimeout(() => {
          setTimeout(() => {
            results.push('nested-timer');
            resolve();
          }, 5);
        }, 20);
      })
    ];

    await Promise.all(operations);
    
    expect(results).toContain('operation1');
    expect(results).toContain('interval-1');
    expect(results).toContain('interval-2');
    expect(results).toContain('nested-timer');
  });
});

/**
 * Example 7: Error handling with timers
 */
describe('Example 7: Error Handling', () => {
  setupJestTimerCleanup();

  test('should cleanup timers even when test fails', async () => {
    try {
      // Create some timers
      setTimeout(() => console.log('This timer should be cleaned up'), 1000);
      setInterval(() => console.log('This interval should be cleaned up'), 500);
      
      // Simulate test failure
      throw new Error('Test failed');
    } catch (error) {
      expect((error as Error).message).toBe('Test failed');
    }
    
    // Timers will still be cleaned up automatically in afterEach
  });

  test('should handle timer creation errors gracefully', () => {
    // Test with invalid timer parameters
    expect(() => {
      // This might fail in some environments
      setTimeout(null as any, -1);
    }).not.toThrow();
    
    // Cleanup should still work properly
  });
});

/**
 * Example 8: Performance testing with timers
 */
describe('Example 8: Performance Considerations', () => {
  setupJestTimerCleanup({
    logStats: true,
    maxTimersWarningThreshold: 100
  });

  test('should handle many concurrent timers', async () => {
    const promises: Promise<number>[] = [];
    
    // Create many concurrent timers
    for (let i = 0; i < 50; i++) {
      promises.push(
        new Promise(resolve => {
          setTimeout(() => resolve(i), Math.random() * 100);
        })
      );
    }
    
    const results = await Promise.all(promises);
    expect(results).toHaveLength(50);
    
    // All timers should be cleaned up automatically
  });
});

/**
 * Example 9: Custom timer utilities
 */
describe('Example 9: Custom Timer Utilities', () => {
  setupJestTimerCleanup();

  // Custom utility that uses timers internally
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = createTestTimeout(() => func(...args), delay);
    };
  }

  test('should work with custom timer utilities', async () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 50);
    
    // Call multiple times rapidly
    debouncedFn('call1');
    debouncedFn('call2');
    debouncedFn('call3');
    
    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should only be called once with the last arguments
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call3');
  });
});

/**
 * Example 10: Real-world integration test scenario
 */
describe('Example 10: Real-world Scenario', () => {
  setupJestTimerCleanup({
    cleanupInAfterEach: true,
    cleanupInAfterAll: true,
    warnOnRemainingTimers: true
  });

  // Simulate a service that uses timers for polling
  class PollingService {
    private pollInterval?: NodeJS.Timeout;
    private retryTimeouts: NodeJS.Timeout[] = [];
    
    startPolling(intervalMs: number): void {
      this.pollInterval = setInterval(() => {
        this.poll();
      }, intervalMs);
    }
    
    private async poll(): Promise<void> {
      try {
        // Simulate API call that might fail
        if (Math.random() < 0.3) {
          throw new Error('API call failed');
        }
        console.log('Poll successful');
      } catch (error) {
        // Retry after delay
        const retryTimeout = setTimeout(() => {
          this.poll();
        }, 1000);
        this.retryTimeouts.push(retryTimeout);
      }
    }
    
    stop(): void {
      if (this.pollInterval) {
        clearTimeout(this.pollInterval);
        this.pollInterval = undefined;
      }
      
      this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
      this.retryTimeouts = [];
    }
  }

  test('should handle polling service lifecycle', async () => {
    const service = new PollingService();
    
    // Start polling
    service.startPolling(100);
    
    // Let it run for a bit
    await new Promise(resolve => setTimeout(resolve, 250));
    
    // Stop the service
    service.stop();
    
    // Verify cleanup
    assertNoActiveTimers();
  });

  test('should cleanup even if service.stop() is not called', async () => {
    const service = new PollingService();
    
    // Start polling but don't stop it manually
    service.startPolling(50);
    
    // Let it run briefly
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Don't call service.stop() - let automatic cleanup handle it
    // The afterEach hook will clean up any remaining timers
  });
});