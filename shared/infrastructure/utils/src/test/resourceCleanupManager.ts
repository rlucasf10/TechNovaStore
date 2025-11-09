import {
  CleanupResource,
  CleanupFunction,
  CleanupConfig,
  CleanupResult,
  CleanupReport,
  CleanupError,
  CleanupErrorType,
  ResourceType,
  OpenHandleLeak
} from './types';
import { DEFAULT_CLEANUP_CONFIG } from './config';
import { OpenHandleDetector } from './handleDetector';
import { CleanupLogger } from './cleanupLogger';
import { DiagnosticTools } from './diagnosticTools';
import { ReportGenerator } from './reportGenerator';

/**
 * Centralized Resource Cleanup Manager
 * Manages the lifecycle of all resources used during test execution
 */
export class ResourceCleanupManager {
  private resources: Map<string, CleanupResource> = new Map();
  private config: CleanupConfig;
  private logger: CleanupLogger;
  private isCleaningUp = false;
  private handleDetector: OpenHandleDetector;
  private diagnosticTools: DiagnosticTools;
  private reportGenerator: ReportGenerator;

  constructor(config?: Partial<CleanupConfig>) {
    this.config = {
      ...DEFAULT_CLEANUP_CONFIG,
      ...config
    };
    
    this.logger = new CleanupLogger(this.config);
    this.handleDetector = new OpenHandleDetector({
      captureStacks: true,
      logLevel: this.config.logLevel === 'debug' ? 'info' : this.config.logLevel
    });
    this.diagnosticTools = new DiagnosticTools(this.logger, this.handleDetector);
    this.reportGenerator = new ReportGenerator(this.logger, this.diagnosticTools, this.handleDetector);
  }

  /**
   * Register a resource for cleanup
   */
  registerResource(resource: Omit<CleanupResource, 'createdAt'>): void {
    if (this.isCleaningUp) {
      this.logger.warn(`Attempted to register resource ${resource.id} during cleanup`);
      return;
    }

    const cleanupResource: CleanupResource = {
      ...resource,
      createdAt: Date.now()
    };

    this.resources.set(resource.id, cleanupResource);
    
    this.logger.log({
      timestamp: Date.now(),
      level: 'info',
      resourceId: resource.id,
      resourceType: resource.type,
      action: 'register',
      metadata: resource.metadata
    });
  }

  /**
   * Register a simple cleanup function
   */
  registerCleanupFunction(id: string, cleanup: CleanupFunction, priority = 5): void {
    this.registerResource({
      id,
      type: 'custom',
      resource: null,
      cleanup,
      priority
    });
  }

  /**
   * Get all active resources
   */
  getActiveResources(): CleanupResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Get resources by type
   */
  getResourcesByType(type: ResourceType): CleanupResource[] {
    return Array.from(this.resources.values()).filter(r => r.type === type);
  }

  /**
   * Remove a resource from tracking (useful when manually cleaned)
   */
  unregisterResource(id: string): boolean {
    return this.resources.delete(id);
  }

  /**
   * Perform cleanup of all registered resources
   */
  async cleanup(): Promise<CleanupReport> {
    if (this.isCleaningUp) {
      this.logger.warn('Cleanup already in progress');
      return this.createEmptyReport();
    }

    this.isCleaningUp = true;
    const startTime = Date.now();
    
    // Capture handles before cleanup if detection is enabled
    let handlesBefore = 0;
    if (this.config.detectHandles) {
      const handleReport = this.handleDetector.getHandleReport();
      handlesBefore = handleReport.total;
    }
    
    this.logger.log({
      timestamp: startTime,
      level: 'info',
      resourceId: 'system',
      resourceType: 'custom',
      action: 'cleanup'
    });

    try {
      const results = await this.performCleanup();
      const endTime = Date.now();
      
      const report = this.generateReport(results, startTime, endTime, handlesBefore);
      this.logger.logReport(report);
      
      return report;
    } finally {
      this.isCleaningUp = false;
      this.resources.clear();
    }
  }

  /**
   * Force cleanup with shorter timeouts
   */
  async forceCleanup(): Promise<CleanupReport> {
    const originalGracefulTimeout = this.config.gracefulTimeout;
    const originalForceTimeout = this.config.forceTimeout;
    
    // Reduce timeouts for force cleanup
    this.config.gracefulTimeout = Math.min(2000, originalGracefulTimeout);
    this.config.forceTimeout = Math.min(5000, originalForceTimeout);
    
    try {
      return await this.cleanup();
    } finally {
      // Restore original timeouts
      this.config.gracefulTimeout = originalGracefulTimeout;
      this.config.forceTimeout = originalForceTimeout;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CleanupConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.updateConfig(this.config);
  }

  /**
   * Set timeout for cleanup operations
   */
  setTimeout(timeout: number): void {
    this.config.gracefulTimeout = timeout;
  }

  /**
   * Set retry attempts
   */
  setRetryAttempts(attempts: number): void {
    this.config.maxRetries = attempts;
  }

  /**
   * Detect open handles that might prevent Jest from exiting
   */
  detectOpenHandles(): OpenHandleLeak[] {
    return this.handleDetector.detectLeaks();
  }

  /**
   * Capture baseline handles (should be called at test start)
   */
  captureHandleBaseline(): void {
    this.handleDetector.captureBaseline();
  }

  /**
   * Generate a detailed handle report
   */
  generateHandleReport(): string {
    return this.handleDetector.generateLeakReport();
  }

  /**
   * Check if Jest would detect open handles
   */
  wouldJestHang(): boolean {
    return this.handleDetector.wouldJestDetectHandles();
  }

  /**
   * Force close leaked handles (use with caution)
   */
  async forceCloseLeakedHandles(): Promise<{ closed: number; failed: number; errors: string[] }> {
    return this.handleDetector.forceCloseLeakedHandles();
  }

  /**
   * Start a diagnostic session for comprehensive analysis
   */
  startDiagnosticSession(sessionName: string): any {
    return this.diagnosticTools.startDiagnosticSession(sessionName);
  }

  /**
   * End a diagnostic session and get analysis
   */
  endDiagnosticSession(sessionId: string): any {
    return this.diagnosticTools.endDiagnosticSession(sessionId);
  }

  /**
   * Generate a comprehensive system health report
   */
  generateSystemHealthReport(): any {
    return this.diagnosticTools.generateSystemHealthReport();
  }

  /**
   * Analyze resource leaks in detail
   */
  analyzeResourceLeaks(): any {
    return this.diagnosticTools.analyzeResourceLeaks();
  }

  /**
   * Predict potential leaks based on patterns
   */
  predictPotentialLeaks(): any[] {
    return this.diagnosticTools.predictPotentialLeaks();
  }

  /**
   * Generate a comprehensive cleanup report
   */
  generateComprehensiveReport(options?: any): any {
    return this.reportGenerator.generateComprehensiveReport(options);
  }

  /**
   * Generate a CI/CD summary report
   */
  generateCISummaryReport(): any {
    return this.reportGenerator.generateCISummaryReport();
  }

  /**
   * Generate performance analysis report
   */
  generatePerformanceAnalysisReport(): any {
    return this.reportGenerator.generatePerformanceAnalysisReport();
  }

  /**
   * Generate leak analysis report
   */
  generateLeakAnalysisReport(): any {
    return this.reportGenerator.generateLeakAnalysisReport();
  }

  /**
   * Export report to file
   */
  async exportReport(report: any, format: 'json' | 'html' | 'markdown' | 'csv', outputPath: string): Promise<void> {
    return this.reportGenerator.exportReport(report, format, outputPath);
  }

  /**
   * Generate dashboard data for real-time monitoring
   */
  generateDashboardData(): any {
    return this.reportGenerator.generateDashboardData();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): any {
    return this.logger.getMetrics();
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): any {
    return this.logger.generatePerformanceReport();
  }

  /**
   * Export diagnostic data
   */
  exportDiagnosticData(outputPath: string): void {
    return this.diagnosticTools.exportDiagnosticData(outputPath);
  }

  /**
   * Generate interactive diagnostic report
   */
  generateInteractiveReport(outputPath: string): void {
    return this.diagnosticTools.generateInteractiveReport(outputPath);
  }

  private async performCleanup(): Promise<CleanupResult[]> {
    const resources = this.getSortedResources();
    const results: CleanupResult[] = [];

    // Process resources in priority order (higher priority first)
    for (const resource of resources) {
      const result = await this.cleanupResource(resource);
      results.push(result);
    }

    return results;
  }

  private getSortedResources(): CleanupResource[] {
    return Array.from(this.resources.values())
      .sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  private async cleanupResource(resource: CleanupResource): Promise<CleanupResult> {
    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | undefined;

    while (attempt < this.config.maxRetries) {
      try {
        await this.executeCleanupWithTimeout(resource);
        
        const duration = Date.now() - startTime;
        this.logger.log({
          timestamp: Date.now(),
          level: 'info',
          resourceId: resource.id,
          resourceType: resource.type,
          action: 'cleanup',
          duration
        });

        return {
          resourceId: resource.id,
          success: true,
          duration
        };
      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        this.logger.log({
          timestamp: Date.now(),
          level: 'warn',
          resourceId: resource.id,
          resourceType: resource.type,
          action: 'error',
          error: error instanceof Error ? error.message : String(error)
        });

        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay);
        }
      }
    }

    // All attempts failed
    const duration = Date.now() - startTime;
    const cleanupError = new CleanupError(
      CleanupErrorType.UNKNOWN,
      resource.id,
      resource.type,
      `Failed to cleanup resource after ${this.config.maxRetries} attempts`,
      lastError
    );

    return {
      resourceId: resource.id,
      success: false,
      duration,
      error: cleanupError
    };
  }

  private async executeCleanupWithTimeout(resource: CleanupResource): Promise<void> {
    const timeout = resource.timeout || this.config.gracefulTimeout;
    
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Cleanup timeout after ${timeout}ms`));
      }, timeout);

      Promise.resolve(resource.cleanup())
        .then(() => {
          clearTimeout(timeoutId);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateReport(results: CleanupResult[], startTime: number, endTime: number, handlesBefore?: number): CleanupReport {
    const duration = endTime - startTime;
    const byType: Record<ResourceType, any> = {} as any;
    const errors: CleanupError[] = [];
    const warnings: string[] = [];

    let totalCleaned = 0;
    let totalFailed = 0;
    let totalForced = 0;

    results.forEach(result => {
      const resource = this.resources.get(result.resourceId);
      if (!resource) return;

      if (!byType[resource.type]) {
        byType[resource.type] = {
          count: 0,
          success: 0,
          failed: 0,
          avgTime: 0,
          totalTime: 0
        };
      }

      byType[resource.type].count++;
      byType[resource.type].totalTime += result.duration;

      if (result.success) {
        totalCleaned++;
        byType[resource.type].success++;
      } else {
        totalFailed++;
        byType[resource.type].failed++;
        if (result.error instanceof CleanupError) {
          errors.push(result.error);
        }
      }

      if (result.forced) {
        totalForced++;
      }
    });

    // Calculate average times
    Object.values(byType).forEach((typeStats: any) => {
      if (typeStats.count > 0) {
        typeStats.avgTime = typeStats.totalTime / typeStats.count;
      }
      delete typeStats.totalTime;
    });

    // Include handle detection if enabled
    let openHandles;
    if (this.config.detectHandles && handlesBefore !== undefined) {
      const leaks = this.handleDetector.detectLeaks();
      const handlesAfter = this.handleDetector.getHandleReport().total;
      
      openHandles = {
        before: handlesBefore,
        after: handlesAfter,
        leaks
      };
      
      // Add warnings for detected leaks
      if (leaks.length > 0) {
        warnings.push(`Detected ${leaks.length} potential resource leak(s)`);
        leaks.forEach(leak => {
          warnings.push(`- ${leak.type}: ${leak.description}`);
        });
      }
    }

    return {
      startTime,
      endTime,
      duration,
      resources: {
        total: results.length,
        cleaned: totalCleaned,
        failed: totalFailed,
        forced: totalForced
      },
      byType,
      errors,
      warnings,
      openHandles
    };
  }

  private createEmptyReport(): CleanupReport {
    const now = Date.now();
    return {
      startTime: now,
      endTime: now,
      duration: 0,
      resources: {
        total: 0,
        cleaned: 0,
        failed: 0,
        forced: 0
      },
      byType: {} as any,
      errors: [],
      warnings: ['Cleanup already in progress']
    };
  }
}



// Global singleton instance
export const resourceCleanupManager = new ResourceCleanupManager();