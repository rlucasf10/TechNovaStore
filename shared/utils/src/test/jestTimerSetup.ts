/**
 * Jest Timer Setup Utilities
 * Provides easy integration of timer cleanup with Jest test lifecycle
 */

import { timerCleanupManager, setupTimerCleanup, cleanupTimers, teardownTimerCleanup } from './timerCleanup';

/**
 * Configuration for Jest timer setup
 */
export interface JestTimerConfig {
  /** Whether to install timer wrappers automatically */
  autoInstallWrappers: boolean;
  /** Whether to cleanup timers in afterEach hooks */
  cleanupInAfterEach: boolean;
  /** Whether to cleanup timers in afterAll hooks */
  cleanupInAfterAll: boolean;
  /** Whether to log timer statistics */
  logStats: boolean;
  /** Whether to warn about remaining timers */
  warnOnRemainingTimers: boolean;
  /** Maximum number of timers before warning */
  maxTimersWarningThreshold: number;
}

const defaultConfig: JestTimerConfig = {
  autoInstallWrappers: true,
  cleanupInAfterEach: true,
  cleanupInAfterAll: true,
  logStats: false,
  warnOnRemainingTimers: true,
  maxTimersWarningThreshold: 10
};

/**
 * Setup timer cleanup for Jest test suites
 * Call this in your test files or in a setup file
 */
export function setupJestTimerCleanup(config: Partial<JestTimerConfig> = {}): void {
  const finalConfig = { ...defaultConfig, ...config };

  // Install wrappers at the beginning
  if (finalConfig.autoInstallWrappers) {
    beforeAll(() => {
      setupTimerCleanup();
      if (finalConfig.logStats) {
        console.log('[JestTimerSetup] Timer cleanup wrappers installed');
      }
    });
  }

  // Cleanup after each test if configured
  if (finalConfig.cleanupInAfterEach) {
    afterEach(() => {
      const statsBefore = timerCleanupManager.getStats();
      
      if (finalConfig.warnOnRemainingTimers && statsBefore.totalTimers > 0) {
        if (statsBefore.totalTimers > finalConfig.maxTimersWarningThreshold) {
          console.warn(
            `[JestTimerSetup] Warning: ${statsBefore.totalTimers} active timers detected after test. ` +
            `This may indicate a timer leak.`
          );
          
          // Log details about the timers
          const timerDetails = timerCleanupManager.getTimerDetails();
          timerDetails.forEach((timer, index) => {
            console.warn(`  Timer ${index + 1}: ${timer.type}, delay: ${timer.delay}ms, age: ${timer.age}ms`);
          });
        }
      }

      cleanupTimers();

      if (finalConfig.logStats && statsBefore.totalTimers > 0) {
        console.log(`[JestTimerSetup] Cleaned up ${statsBefore.totalTimers} timers after test`);
      }
    });
  }

  // Final cleanup after all tests
  if (finalConfig.cleanupInAfterAll) {
    afterAll(() => {
      const statsBefore = timerCleanupManager.getStats();
      
      if (finalConfig.logStats && statsBefore.totalTimers > 0) {
        console.log(`[JestTimerSetup] Final cleanup: ${statsBefore.totalTimers} timers remaining`);
      }

      teardownTimerCleanup();
      
      if (finalConfig.logStats) {
        console.log('[JestTimerSetup] Timer cleanup completed and wrappers restored');
      }
    });
  }
}

/**
 * Manual timer cleanup for specific test scenarios
 * Use this when you need to cleanup timers at specific points
 */
export function manualTimerCleanup(): void {
  const stats = timerCleanupManager.getStats();
  if (stats.totalTimers > 0) {
    console.log(`[JestTimerSetup] Manual cleanup: clearing ${stats.totalTimers} active timers`);
    cleanupTimers();
  }
}

/**
 * Get current timer statistics for debugging
 */
export function getTimerStats(): {
  stats: ReturnType<typeof timerCleanupManager.getStats>;
  details: ReturnType<typeof timerCleanupManager.getTimerDetails>;
} {
  return {
    stats: timerCleanupManager.getStats(),
    details: timerCleanupManager.getTimerDetails()
  };
}

/**
 * Assert that no timers are active (useful for test assertions)
 */
export function assertNoActiveTimers(): void {
  const stats = timerCleanupManager.getStats();
  if (stats.totalTimers > 0) {
    const details = timerCleanupManager.getTimerDetails();
    const timerInfo = details.map(t => `${t.type}(${t.delay}ms, age: ${t.age}ms)`).join(', ');
    throw new Error(
      `Expected no active timers, but found ${stats.totalTimers}: ${timerInfo}`
    );
  }
}

/**
 * Wait for all timers to complete (useful for testing async timer behavior)
 * Note: This only works with fake timers
 */
export function flushAllTimers(): void {
  if (jest.isMockFunction(setTimeout)) {
    jest.runAllTimers();
  } else {
    console.warn('[JestTimerSetup] flushAllTimers() only works with jest.useFakeTimers()');
  }
}

/**
 * Advance timers by specified time (useful for testing timer behavior)
 * Note: This only works with fake timers
 */
export function advanceTimersByTime(ms: number): void {
  if (jest.isMockFunction(setTimeout)) {
    jest.advanceTimersByTime(ms);
  } else {
    console.warn('[JestTimerSetup] advanceTimersByTime() only works with jest.useFakeTimers()');
  }
}

/**
 * Setup fake timers with automatic cleanup
 * This combines Jest's fake timers with our cleanup system
 */
export function setupFakeTimersWithCleanup(): void {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Run all pending timers before cleanup
    if (jest.isMockFunction(setTimeout)) {
      jest.runAllTimers();
    }
    
    // Restore real timers
    jest.useRealTimers();
    
    // Clean up any real timers that might have been created
    cleanupTimers();
  });
}

/**
 * Utility to run a test with timer isolation
 * Ensures timers created in the test don't affect other tests
 */
export async function withTimerIsolation<T>(testFn: () => Promise<T> | T): Promise<T> {
  const statsBefore = timerCleanupManager.getStats();
  
  try {
    const result = await testFn();
    return result;
  } finally {
    // Clean up any timers created during the test
    cleanupTimers();
    
    // Verify we're back to the original state
    const statsAfter = timerCleanupManager.getStats();
    if (statsAfter.totalTimers > statsBefore.totalTimers) {
      console.warn(
        `[JestTimerSetup] Timer leak detected: ${statsAfter.totalTimers - statsBefore.totalTimers} timers not cleaned up`
      );
    }
  }
}

/**
 * Create a test timeout that automatically cleans up
 * Use this instead of setTimeout in tests for better cleanup
 */
export function createTestTimeout(callback: () => void, delay: number): NodeJS.Timeout {
  return timerCleanupManager.setTimeout(callback, delay);
}

/**
 * Create a test interval that automatically cleans up
 * Use this instead of setInterval in tests for better cleanup
 */
export function createTestInterval(callback: () => void, delay: number): NodeJS.Timeout {
  return timerCleanupManager.setInterval(callback, delay);
}