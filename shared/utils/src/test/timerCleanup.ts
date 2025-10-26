/**
 * Timer Cleanup Manager
 * Manages setTimeout and setInterval cleanup for test environments
 */

import { resourceCleanupManager } from './resourceCleanupManager';

export interface TimerInstance {
  id: NodeJS.Timeout;
  type: 'timeout' | 'interval';
  createdAt: number;
  delay: number;
  callback?: Function;
  stack?: string;
}

export interface TimerCleanupStats {
  totalTimers: number;
  activeTimeouts: number;
  activeIntervals: number;
  clearedTimers: number;
}

/**
 * Timer Cleanup Manager with automatic registration and cleanup
 */
export class TimerCleanupManager {
  private timers: Map<NodeJS.Timeout, TimerInstance> = new Map();
  private originalSetTimeout: typeof setTimeout;
  private originalSetInterval: typeof setInterval;
  private originalClearTimeout: typeof clearTimeout;
  private originalClearInterval: typeof clearInterval;
  private isWrappersInstalled = false;

  constructor() {
    // Store original functions
    this.originalSetTimeout = global.setTimeout;
    this.originalSetInterval = global.setInterval;
    this.originalClearTimeout = global.clearTimeout;
    this.originalClearInterval = global.clearInterval;
  }

  /**
   * Install timer wrappers that automatically register timers for cleanup
   */
  installWrappers(): void {
    if (this.isWrappersInstalled) {
      return;
    }

    const self = this;

    // Wrap setTimeout
    global.setTimeout = function(callback: (...args: any[]) => void, delay: number, ...args: any[]): NodeJS.Timeout {
      const timer = self.originalSetTimeout(() => {
        // Remove from tracking when timer executes
        self.timers.delete(timer);
        callback(...args);
      }, delay);

      self.registerTimer(timer, 'timeout', delay, callback);
      return timer;
    } as any;

    // Wrap setInterval
    global.setInterval = function(callback: (...args: any[]) => void, delay: number, ...args: any[]): NodeJS.Timeout {
      const timer = self.originalSetInterval(callback, delay, ...args);
      self.registerTimer(timer, 'interval', delay, callback);
      return timer;
    } as any;

    // Wrap clearTimeout
    global.clearTimeout = function(timer?: string | number | NodeJS.Timeout): void {
      if (timer && typeof timer === 'object') {
        self.timers.delete(timer);
        self.originalClearTimeout(timer);
      } else if (timer) {
        self.originalClearTimeout(timer as any);
      }
    };

    // Wrap clearInterval
    global.clearInterval = function(timer?: string | number | NodeJS.Timeout): void {
      if (timer && typeof timer === 'object') {
        self.timers.delete(timer);
        self.originalClearInterval(timer as any);
      } else if (timer) {
        self.originalClearInterval(timer as any);
      }
    };

    this.isWrappersInstalled = true;

    // Register cleanup function with resource manager
    resourceCleanupManager.registerResource({
      id: 'timer-cleanup-manager',
      type: 'timer',
      resource: this,
      cleanup: () => this.clearAllTimers(),
      priority: 3, // Medium-high priority
      metadata: { managerType: 'TimerCleanupManager' }
    });
  }

  /**
   * Restore original timer functions
   */
  uninstallWrappers(): void {
    if (!this.isWrappersInstalled) {
      return;
    }

    global.setTimeout = this.originalSetTimeout;
    global.setInterval = this.originalSetInterval;
    global.clearTimeout = this.originalClearTimeout;
    global.clearInterval = this.originalClearInterval;

    this.isWrappersInstalled = false;
  }

  /**
   * Create a timeout with automatic registration (alternative to wrapper)
   */
  setTimeout(callback: (...args: any[]) => void, delay: number, ...args: any[]): NodeJS.Timeout {
    const timer = this.originalSetTimeout(() => {
      // Remove from tracking when timer executes
      this.timers.delete(timer);
      callback(...args);
    }, delay);

    this.registerTimer(timer, 'timeout', delay, callback);
    return timer;
  }

  /**
   * Create an interval with automatic registration (alternative to wrapper)
   */
  setInterval(callback: (...args: any[]) => void, delay: number, ...args: any[]): NodeJS.Timeout {
    const timer = this.originalSetInterval(callback, delay, ...args);
    this.registerTimer(timer, 'interval', delay, callback);
    return timer;
  }

  /**
   * Clear a timeout and remove from tracking
   */
  clearTimeout(timer?: NodeJS.Timeout): void {
    if (timer) {
      this.timers.delete(timer);
      this.originalClearTimeout(timer);
    }
  }

  /**
   * Clear an interval and remove from tracking
   */
  clearInterval(timer?: NodeJS.Timeout): void {
    if (timer) {
      this.timers.delete(timer);
      this.originalClearInterval(timer as any);
    }
  }

  /**
   * Register a timer for tracking
   */
  private registerTimer(
    timer: NodeJS.Timeout, 
    type: 'timeout' | 'interval', 
    delay: number, 
    callback?: Function
  ): void {
    const timerInstance: TimerInstance = {
      id: timer,
      type,
      createdAt: Date.now(),
      delay,
      callback,
      stack: this.captureStack()
    };

    this.timers.set(timer, timerInstance);
  }

  /**
   * Clear all active timers
   */
  clearAllTimers(): void {
    const timersToClean = Array.from(this.timers.keys());
    let clearedCount = 0;

    for (const timer of timersToClean) {
      const timerInstance = this.timers.get(timer);
      if (timerInstance) {
        try {
          if (timerInstance.type === 'timeout') {
            this.originalClearTimeout(timer);
          } else {
            this.originalClearInterval(timer as any);
          }
          clearedCount++;
        } catch (error) {
          console.warn(`Failed to clear ${timerInstance.type}:`, error);
        }
      }
    }

    this.timers.clear();

    if (clearedCount > 0) {
      console.log(`[TimerCleanup] Cleared ${clearedCount} active timers`);
    }
  }

  /**
   * Get statistics about active timers
   */
  getStats(): TimerCleanupStats {
    const timeouts = Array.from(this.timers.values()).filter(t => t.type === 'timeout');
    const intervals = Array.from(this.timers.values()).filter(t => t.type === 'interval');

    return {
      totalTimers: this.timers.size,
      activeTimeouts: timeouts.length,
      activeIntervals: intervals.length,
      clearedTimers: 0 // This would be tracked separately if needed
    };
  }

  /**
   * Get all active timers
   */
  getActiveTimers(): TimerInstance[] {
    return Array.from(this.timers.values());
  }

  /**
   * Get active timers by type
   */
  getActiveTimersByType(type: 'timeout' | 'interval'): TimerInstance[] {
    return Array.from(this.timers.values()).filter(t => t.type === type);
  }

  /**
   * Check if there are any active timers
   */
  hasActiveTimers(): boolean {
    return this.timers.size > 0;
  }

  /**
   * Get detailed information about active timers for debugging
   */
  getTimerDetails(): Array<{
    type: string;
    delay: number;
    age: number;
    stack?: string;
  }> {
    const now = Date.now();
    return Array.from(this.timers.values()).map(timer => ({
      type: timer.type,
      delay: timer.delay,
      age: now - timer.createdAt,
      stack: timer.stack
    }));
  }

  /**
   * Force clear all timers (for emergency cleanup)
   */
  forceCleanAllTimers(): void {
    console.warn('[TimerCleanup] Force clearing all timers');
    
    // Try to clear all timers we're tracking
    this.clearAllTimers();

    // Additional cleanup: try to clear any remaining timers using Node.js internals
    try {
      // This is a more aggressive approach for stubborn timers
      const activeHandles = (process as any)._getActiveHandles?.() || [];
      activeHandles.forEach((handle: any) => {
        if (handle && typeof handle.close === 'function') {
          try {
            handle.close();
          } catch (error) {
            // Ignore errors in force cleanup
          }
        }
      });
    } catch (error) {
      // Ignore errors in aggressive cleanup
    }
  }

  /**
   * Capture stack trace for debugging
   */
  private captureStack(): string {
    const stack = new Error().stack;
    if (!stack) return '';
    
    // Remove the first few lines (this function and timer creation)
    const lines = stack.split('\n');
    return lines.slice(3, 8).join('\n'); // Keep 5 lines of relevant stack
  }
}

// Global singleton instance
export const timerCleanupManager = new TimerCleanupManager();

/**
 * Utility functions for test setup
 */

/**
 * Setup timer cleanup for a test suite
 * Call this in beforeAll or beforeEach
 */
export function setupTimerCleanup(): void {
  timerCleanupManager.installWrappers();
}

/**
 * Cleanup timers for a test suite
 * Call this in afterEach or afterAll
 */
export function cleanupTimers(): void {
  timerCleanupManager.clearAllTimers();
}

/**
 * Complete timer cleanup and restore original functions
 * Call this in afterAll when completely done with tests
 */
export function teardownTimerCleanup(): void {
  timerCleanupManager.clearAllTimers();
  timerCleanupManager.uninstallWrappers();
}

/**
 * Enhanced timer functions that automatically register for cleanup
 * Use these instead of global setTimeout/setInterval for better tracking
 */
export const managedTimers = {
  setTimeout: (callback: (...args: any[]) => void, delay: number, ...args: any[]): NodeJS.Timeout => {
    return timerCleanupManager.setTimeout(callback, delay, ...args);
  },
  
  setInterval: (callback: (...args: any[]) => void, delay: number, ...args: any[]): NodeJS.Timeout => {
    return timerCleanupManager.setInterval(callback, delay, ...args);
  },
  
  clearTimeout: (timer?: NodeJS.Timeout): void => {
    timerCleanupManager.clearTimeout(timer);
  },
  
  clearInterval: (timer?: NodeJS.Timeout): void => {
    timerCleanupManager.clearInterval(timer);
  }
};