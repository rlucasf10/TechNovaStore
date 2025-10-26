import { OpenHandleDetector } from '../handleDetector';
import { setTimeout as nodeSetTimeout, setInterval as nodeSetInterval } from 'timers';

describe('OpenHandleDetector', () => {
  let detector: OpenHandleDetector;

  beforeEach(() => {
    detector = new OpenHandleDetector({ captureStacks: false, logLevel: 'error' });
  });

  afterEach(() => {
    detector.reset();
  });

  describe('baseline capture and leak detection', () => {
    it('should capture baseline handles', () => {
      detector.captureBaseline();
      const report = detector.getHandleReport();
      
      expect(report.baseline).toBeGreaterThanOrEqual(0);
      expect(report.total).toBeGreaterThanOrEqual(0);
    });

    it('should detect timer leaks', (done) => {
      detector.captureBaseline();
      
      // Create a timer that will be a leak
      const timer = nodeSetTimeout(() => {
        // This timer should be detected as a leak
      }, 5000);
      
      const leaks = detector.detectLeaks();
      
      // Clean up the timer
      clearTimeout(timer);
      
      // We should detect at least one leak (the timer we created)
      expect(leaks.length).toBeGreaterThan(0);
      
      // Check that we can identify it as a timer-related handle
      const timerLeak = leaks.find(leak => 
        leak.type.includes('Timer') || 
        leak.type.includes('Timeout') ||
        leak.description.includes('timeout')
      );
      
      expect(timerLeak).toBeDefined();
      done();
    });

    it('should not detect leaks when no new handles are created', () => {
      detector.captureBaseline();
      
      // Don't create any new handles
      const leaks = detector.detectLeaks();
      
      expect(leaks.length).toBe(0);
    });

    it('should generate a comprehensive leak report', () => {
      detector.captureBaseline();
      
      // Create a timer leak
      const timer = nodeSetTimeout(() => {}, 5000);
      
      const report = detector.generateLeakReport();
      
      expect(report).toContain('Open Handle Detection Report');
      expect(report).toContain('Baseline handles:');
      expect(report).toContain('Current handles:');
      expect(report).toContain('Potential leaks:');
      
      // Clean up
      clearTimeout(timer);
    });
  });

  describe('handle information extraction', () => {
    it('should provide detailed handle information', () => {
      detector.captureBaseline();
      
      const timer = nodeSetTimeout(() => {}, 1000);
      
      const report = detector.getHandleReport();
      
      expect(report.current).toBeInstanceOf(Array);
      expect(report.current.length).toBeGreaterThan(0);
      
      // Each handle should have type and description
      report.current.forEach(handle => {
        expect(handle).toHaveProperty('type');
        expect(handle).toHaveProperty('description');
        expect(typeof handle.type).toBe('string');
        expect(typeof handle.description).toBe('string');
      });
      
      clearTimeout(timer);
    });

    it('should detect Jest hanging conditions', () => {
      detector.captureBaseline();
      
      // Initially should not detect hanging
      expect(detector.wouldJestDetectHandles()).toBe(false);
      
      // Create a handle that would cause Jest to hang
      const timer = nodeSetTimeout(() => {}, 10000);
      
      // Now should detect potential hanging
      expect(detector.wouldJestDetectHandles()).toBe(true);
      
      clearTimeout(timer);
    });
  });

  describe('handle cleanup', () => {
    it('should attempt to force close leaked handles', async () => {
      detector.captureBaseline();
      
      // Create handles that can be closed
      const timer1 = nodeSetTimeout(() => {}, 5000);
      const timer2 = nodeSetInterval(() => {}, 1000);
      
      const result = await detector.forceCloseLeakedHandles();
      
      expect(result).toHaveProperty('closed');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('errors');
      
      expect(typeof result.closed).toBe('number');
      expect(typeof result.failed).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
      
      // Clean up any remaining handles
      clearTimeout(timer1);
      clearInterval(timer2);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully when getting active handles fails', () => {
      // Mock process._getActiveHandles to throw an error
      const originalGetActiveHandles = (process as any)._getActiveHandles;
      (process as any)._getActiveHandles = () => {
        throw new Error('Mock error');
      };
      
      try {
        detector.captureBaseline();
        const leaks = detector.detectLeaks();
        
        // Should not throw and should return empty array
        expect(Array.isArray(leaks)).toBe(true);
      } finally {
        // Restore original function
        (process as any)._getActiveHandles = originalGetActiveHandles;
      }
    });

    it('should handle missing handle properties gracefully', () => {
      detector.captureBaseline();
      
      // This should not throw even if handles have unexpected structure
      const report = detector.getHandleReport();
      
      expect(report).toHaveProperty('total');
      expect(report).toHaveProperty('baseline');
      expect(report).toHaveProperty('current');
      expect(report).toHaveProperty('leaks');
    });
  });
});