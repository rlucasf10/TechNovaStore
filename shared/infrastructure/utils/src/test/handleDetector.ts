import { OpenHandleLeak, CleanupLogEntry } from './types';

/**
 * Open Handle Detector
 * Detects and reports resource leaks by monitoring active Node.js handles
 */
export class OpenHandleDetector {
  private baselineHandles: any[] = [];
  private handleCreationStacks: Map<any, string> = new Map();
  private isCapturingStacks: boolean = false;

  constructor(private config: { captureStacks?: boolean; logLevel?: 'info' | 'warn' | 'error' } = {}) {
    this.isCapturingStacks = config.captureStacks ?? true;
    
    // Hook into handle creation if stack capture is enabled
    if (this.isCapturingStacks) {
      this.setupStackCapture();
    }
  }

  /**
   * Capture baseline of active handles at the start of test execution
   */
  captureBaseline(): void {
    this.baselineHandles = this.getActiveHandles();
    this.handleCreationStacks.clear();
    
    this.log({
      timestamp: Date.now(),
      level: 'info',
      resourceId: 'handle-detector',
      resourceType: 'custom',
      action: 'register',
      metadata: { 
        baselineHandles: this.baselineHandles.length,
        message: 'Baseline captured'
      }
    });
  }

  /**
   * Detect resource leaks by comparing current handles against baseline
   */
  detectLeaks(): OpenHandleLeak[] {
    const currentHandles = this.getActiveHandles();
    const leaks: OpenHandleLeak[] = [];
    
    // Find handles that weren't in the baseline
    for (const handle of currentHandles) {
      if (!this.isInBaseline(handle)) {
        const leak: OpenHandleLeak = {
          type: this.getHandleType(handle),
          description: this.getHandleDescription(handle),
          stack: this.getCreationStack(handle)
        };
        leaks.push(leak);
      }
    }
    
    this.log({
      timestamp: Date.now(),
      level: leaks.length > 0 ? 'warn' : 'info',
      resourceId: 'handle-detector',
      resourceType: 'custom',
      action: 'cleanup',
      metadata: {
        currentHandles: currentHandles.length,
        baselineHandles: this.baselineHandles.length,
        leaksDetected: leaks.length
      }
    });
    
    return leaks;
  }

  /**
   * Get detailed information about all current handles
   */
  getHandleReport(): {
    total: number;
    baseline: number;
    current: any[];
    leaks: OpenHandleLeak[];
  } {
    const currentHandles = this.getActiveHandles();
    const leaks = this.detectLeaks();
    
    return {
      total: currentHandles.length,
      baseline: this.baselineHandles.length,
      current: currentHandles.map(handle => ({
        type: this.getHandleType(handle),
        description: this.getHandleDescription(handle)
      })),
      leaks
    };
  }

  /**
   * Generate a comprehensive leak report
   */
  generateLeakReport(): string {
    const report = this.getHandleReport();
    const lines: string[] = [];
    
    lines.push('=== Open Handle Detection Report ===');
    lines.push(`Baseline handles: ${report.baseline}`);
    lines.push(`Current handles: ${report.total}`);
    lines.push(`Potential leaks: ${report.leaks.length}`);
    lines.push('');
    
    if (report.leaks.length > 0) {
      lines.push('DETECTED LEAKS:');
      report.leaks.forEach((leak, index) => {
        lines.push(`${index + 1}. ${leak.type}: ${leak.description}`);
        if (leak.stack) {
          lines.push(`   Stack trace:`);
          leak.stack.split('\n').forEach(line => {
            if (line.trim()) {
              lines.push(`     ${line.trim()}`);
            }
          });
        }
        lines.push('');
      });
    } else {
      lines.push('No resource leaks detected.');
    }
    
    lines.push('=== Current Handles ===');
    const handlesByType = this.groupHandlesByType(report.current);
    Object.entries(handlesByType).forEach(([type, handles]) => {
      lines.push(`${type}: ${handles.length}`);
      handles.forEach(handle => {
        lines.push(`  - ${handle.description}`);
      });
    });
    
    return lines.join('\n');
  }

  /**
   * Check if Jest's --detectOpenHandles would find issues
   */
  wouldJestDetectHandles(): boolean {
    const currentHandles = this.getActiveHandles();
    // Jest considers the process "hanging" if there are handles other than the baseline
    return currentHandles.length > this.baselineHandles.length;
  }

  /**
   * Force close handles that can be safely closed
   */
  async forceCloseLeakedHandles(): Promise<{ closed: number; failed: number; errors: string[] }> {
    const leaks = this.detectLeaks();
    const currentHandles = this.getActiveHandles();
    let closed = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const handle of currentHandles) {
      if (!this.isInBaseline(handle)) {
        try {
          await this.attemptHandleClose(handle);
          closed++;
        } catch (error) {
          failed++;
          errors.push(`Failed to close ${this.getHandleType(handle)}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    this.log({
      timestamp: Date.now(),
      level: failed > 0 ? 'warn' : 'info',
      resourceId: 'handle-detector',
      resourceType: 'custom',
      action: 'force',
      metadata: { closed, failed, errors: errors.length }
    });
    
    return { closed, failed, errors };
  }

  /**
   * Reset the detector state
   */
  reset(): void {
    this.baselineHandles = [];
    this.handleCreationStacks.clear();
  }

  private getActiveHandles(): any[] {
    try {
      // Use Node.js internal API to get active handles
      const process_: any = process;
      return process_._getActiveHandles?.() || [];
    } catch (error) {
      this.log({
        timestamp: Date.now(),
        level: 'warn',
        resourceId: 'handle-detector',
        resourceType: 'custom',
        action: 'error',
        error: `Failed to get active handles: ${error instanceof Error ? error.message : String(error)}`
      });
      return [];
    }
  }

  private isInBaseline(handle: any): boolean {
    // Compare handles by reference and by key properties
    return this.baselineHandles.some(baselineHandle => {
      if (baselineHandle === handle) {
        return true;
      }
      
      // For some handle types, we need to compare by properties
      if (this.getHandleType(baselineHandle) === this.getHandleType(handle)) {
        return this.compareHandleProperties(baselineHandle, handle);
      }
      
      return false;
    });
  }

  private compareHandleProperties(handle1: any, handle2: any): boolean {
    // Compare common properties that identify the same handle
    const props = ['fd', 'path', 'host', 'port', 'address'];
    
    for (const prop of props) {
      if (handle1[prop] !== undefined && handle2[prop] !== undefined) {
        if (handle1[prop] !== handle2[prop]) {
          return false;
        }
      }
    }
    
    return true;
  }

  private getHandleType(handle: any): string {
    if (!handle) return 'Unknown';
    
    if (handle.constructor && handle.constructor.name) {
      return handle.constructor.name;
    }
    
    // Fallback to checking common properties
    if (handle.fd !== undefined) return 'FileHandle';
    if (handle.address !== undefined) return 'NetworkHandle';
    if (handle._handle !== undefined) return 'StreamHandle';
    
    return 'Unknown';
  }

  private getHandleDescription(handle: any): string {
    const type = this.getHandleType(handle);
    
    try {
      // Network handles (servers, sockets)
      if (handle.address && typeof handle.address === 'function') {
        const addr = handle.address();
        if (addr) {
          return `${type} listening on ${addr.address || 'unknown'}:${addr.port || 'unknown'}`;
        }
      }
      
      // File handles
      if (handle.path) {
        return `${type} for file: ${handle.path}`;
      }
      
      // Socket handles
      if (handle.remoteAddress && handle.remotePort) {
        return `${type} connected to ${handle.remoteAddress}:${handle.remotePort}`;
      }
      
      // Timer handles
      if (handle._idleTimeout !== undefined) {
        return `${type} with timeout: ${handle._idleTimeout}ms`;
      }
      
      // Process handles
      if (handle.pid !== undefined) {
        return `${type} for process: ${handle.pid}`;
      }
      
      // Generic handle with file descriptor
      if (handle.fd !== undefined) {
        return `${type} with fd: ${handle.fd}`;
      }
      
      return type;
    } catch (error) {
      return `${type} (description unavailable)`;
    }
  }

  private getCreationStack(handle: any): string | undefined {
    // Try to get stack from our tracking
    const stack = this.handleCreationStacks.get(handle);
    if (stack) {
      return stack;
    }
    
    // Try to get stack from handle itself (some handles store this)
    if (handle._stack) {
      return handle._stack;
    }
    
    // If we can't find a specific stack, return a generic one
    if (this.isCapturingStacks) {
      return 'Stack trace not available (handle created before tracking started)';
    }
    
    return undefined;
  }

  private setupStackCapture(): void {
    // This is a simplified stack capture setup
    // In a real implementation, you might want to hook into more Node.js internals
    // For now, we'll capture stack traces when handles are created through common APIs
    
    const originalSetTimeout = global.setTimeout;
    const originalSetInterval = global.setInterval;
    
    // Wrap setTimeout to capture stack
    const wrappedSetTimeout = (callback: (...args: any[]) => void, delay?: number, ...args: any[]): NodeJS.Timeout => {
      const stack = new Error().stack;
      const timer = originalSetTimeout(callback, delay, ...args);
      if (stack) {
        this.handleCreationStacks.set(timer, stack);
      }
      return timer;
    };
    
    // Copy properties from original setTimeout
    Object.setPrototypeOf(wrappedSetTimeout, originalSetTimeout);
    Object.defineProperty(wrappedSetTimeout, 'name', { value: 'setTimeout' });
    
    global.setTimeout = wrappedSetTimeout as typeof setTimeout;
    
    // Wrap setInterval to capture stack
    const wrappedSetInterval = (callback: (...args: any[]) => void, delay?: number, ...args: any[]): NodeJS.Timer => {
      const stack = new Error().stack;
      const timer = originalSetInterval(callback, delay, ...args);
      if (stack) {
        this.handleCreationStacks.set(timer, stack);
      }
      return timer;
    };
    
    // Copy properties from original setInterval
    Object.setPrototypeOf(wrappedSetInterval, originalSetInterval);
    Object.defineProperty(wrappedSetInterval, 'name', { value: 'setInterval' });
    
    global.setInterval = wrappedSetInterval as typeof setInterval;
    
    // Note: In a production implementation, you'd want to be more careful about
    // restoring these overrides and handling edge cases
  }

  private async attemptHandleClose(handle: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Try different close methods based on handle type
        if (typeof handle.close === 'function') {
          handle.close((error?: Error) => {
            if (error) reject(error);
            else resolve();
          });
        } else if (typeof handle.end === 'function') {
          handle.end();
          resolve();
        } else if (typeof handle.destroy === 'function') {
          handle.destroy();
          resolve();
        } else if (typeof handle.unref === 'function') {
          handle.unref();
          resolve();
        } else {
          reject(new Error('No known close method available'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  private groupHandlesByType(handles: { type: string; description: string }[]): Record<string, { type: string; description: string }[]> {
    const grouped: Record<string, { type: string; description: string }[]> = {};
    
    handles.forEach(handle => {
      if (!grouped[handle.type]) {
        grouped[handle.type] = [];
      }
      grouped[handle.type].push(handle);
    });
    
    return grouped;
  }

  private log(entry: CleanupLogEntry): void {
    if (this.config.logLevel === 'info' || 
        (this.config.logLevel === 'warn' && entry.level !== 'info') ||
        (this.config.logLevel === 'error' && entry.level === 'error')) {
      
      const timestamp = new Date(entry.timestamp).toISOString();
      const message = `[${timestamp}] [HandleDetector] [${entry.level.toUpperCase()}] ${entry.action}${entry.error ? ` - ${entry.error}` : ''}`;
      
      if (entry.level === 'error') {
        console.error(message, entry.metadata);
      } else if (entry.level === 'warn') {
        console.warn(message, entry.metadata);
      } else {
        console.log(message, entry.metadata);
      }
    }
  }
}

// Global singleton instance
export const openHandleDetector = new OpenHandleDetector();