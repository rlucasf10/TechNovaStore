/**
 * Timer Cleanup Manager Tests
 */

import { 
  TimerCleanupManager, 
  timerCleanupManager,
  setupTimerCleanup,
  cleanupTimers,
  managedTimers
} from '../timerCleanup';

describe('TimerCleanupManager', () => {
  let manager: TimerCleanupManager;

  beforeEach(() => {
    manager = new TimerCleanupManager();
  });

  afterEach(() => {
    // Clean up any timers created during tests
    manager.clearAllTimers();
    manager.uninstallWrappers();
  });

  describe('Basic Timer Management', () => {
    test('should track setTimeout calls', (done) => {
      const timer = manager.setTimeout(() => {
        expect(manager.getStats().totalTimers).toBe(0); // Timer should be removed after execution
        done();
      }, 10);

      expect(manager.getStats().totalTimers).toBe(1);
      expect(manager.getStats().activeTimeouts).toBe(1);
      expect(manager.getActiveTimers()[0].type).toBe('timeout');
    });

    test('should track setInterval calls', (done) => {
      let count = 0;
      const timer = manager.setInterval(() => {
        count++;
        if (count === 2) {
          manager.clearInterval(timer);
          expect(manager.getStats().totalTimers).toBe(0);
          done();
        }
      }, 10);

      expect(manager.getStats().totalTimers).toBe(1);
      expect(manager.getStats().activeIntervals).toBe(1);
    });

    test('should clear individual timers', () => {
      const timer1 = manager.setTimeout(() => {}, 1000);
      const timer2 = manager.setInterval(() => {}, 1000);

      expect(manager.getStats().totalTimers).toBe(2);

      manager.clearTimeout(timer1);
      expect(manager.getStats().totalTimers).toBe(1);

      manager.clearInterval(timer2);
      expect(manager.getStats().totalTimers).toBe(0);
    });

    test('should clear all timers', () => {
      manager.setTimeout(() => {}, 1000);
      manager.setTimeout(() => {}, 2000);
      manager.setInterval(() => {}, 1000);

      expect(manager.getStats().totalTimers).toBe(3);

      manager.clearAllTimers();
      expect(manager.getStats().totalTimers).toBe(0);
    });
  });

  describe('Timer Wrappers', () => {
    test('should install and uninstall wrappers', () => {
      const originalSetTimeout = global.setTimeout;
      
      manager.installWrappers();
      expect(global.setTimeout).not.toBe(originalSetTimeout);

      manager.uninstallWrappers();
      expect(global.setTimeout).toBe(originalSetTimeout);
    });

    test('should track timers created with wrapped functions', (done) => {
      manager.installWrappers();

      setTimeout(() => {
        expect(manager.getStats().totalTimers).toBe(0); // Should be removed after execution
        done();
      }, 10);

      expect(manager.getStats().totalTimers).toBe(1);
    });
  });

  describe('Timer Statistics', () => {
    test('should provide accurate statistics', () => {
      manager.setTimeout(() => {}, 1000);
      manager.setTimeout(() => {}, 2000);
      manager.setInterval(() => {}, 1000);
      manager.setInterval(() => {}, 2000);

      const stats = manager.getStats();
      expect(stats.totalTimers).toBe(4);
      expect(stats.activeTimeouts).toBe(2);
      expect(stats.activeIntervals).toBe(2);
    });

    test('should provide timer details', () => {
      manager.setTimeout(() => {}, 1000);
      manager.setInterval(() => {}, 500);

      const details = manager.getTimerDetails();
      expect(details).toHaveLength(2);
      expect(details[0].type).toBe('timeout');
      expect(details[0].delay).toBe(1000);
      expect(details[1].type).toBe('interval');
      expect(details[1].delay).toBe(500);
    });
  });

  describe('Managed Timers', () => {
    test('should work with managed timer utilities', (done) => {
      const timer = managedTimers.setTimeout(() => {
        expect(timerCleanupManager.getStats().totalTimers).toBe(0);
        done();
      }, 10);

      expect(timerCleanupManager.getStats().totalTimers).toBe(1);
    });

    test('should clear managed timers', () => {
      const timer1 = managedTimers.setTimeout(() => {}, 1000);
      const timer2 = managedTimers.setInterval(() => {}, 1000);

      expect(timerCleanupManager.getStats().totalTimers).toBe(2);

      managedTimers.clearTimeout(timer1);
      managedTimers.clearInterval(timer2);

      expect(timerCleanupManager.getStats().totalTimers).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle clearing non-existent timers gracefully', () => {
      expect(() => {
        manager.clearTimeout(undefined);
        manager.clearInterval(undefined);
      }).not.toThrow();
    });

    test('should handle force cleanup', () => {
      manager.setTimeout(() => {}, 1000);
      manager.setInterval(() => {}, 1000);

      expect(manager.getStats().totalTimers).toBe(2);

      expect(() => {
        manager.forceCleanAllTimers();
      }).not.toThrow();

      expect(manager.getStats().totalTimers).toBe(0);
    });
  });
});

describe('Global Timer Cleanup Functions', () => {
  afterEach(() => {
    timerCleanupManager.clearAllTimers();
    timerCleanupManager.uninstallWrappers();
  });

  test('setupTimerCleanup should install wrappers', () => {
    const originalSetTimeout = global.setTimeout;
    
    setupTimerCleanup();
    expect(global.setTimeout).not.toBe(originalSetTimeout);
  });

  test('cleanupTimers should clear all active timers', () => {
    setupTimerCleanup();
    
    setTimeout(() => {}, 1000);
    setInterval(() => {}, 1000);

    expect(timerCleanupManager.getStats().totalTimers).toBe(2);

    cleanupTimers();
    expect(timerCleanupManager.getStats().totalTimers).toBe(0);
  });
});