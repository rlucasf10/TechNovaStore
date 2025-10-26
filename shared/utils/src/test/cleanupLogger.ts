import { CleanupLogEntry, CleanupConfig, CleanupReport, ResourceType } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Structured Logger for Resource Cleanup Operations
 * Provides comprehensive logging with multiple output formats and levels
 */
export class CleanupLogger {
  private logEntries: CleanupLogEntry[] = [];
  private logFile?: string;
  private metricsCollector: MetricsCollector;

  constructor(private config: CleanupConfig) {
    this.metricsCollector = new MetricsCollector();
    
    if (config.logToFile && config.logFilePath) {
      this.logFile = config.logFilePath;
      this.ensureLogDirectory();
    }
  }

  /**
   * Log a cleanup operation entry
   */
  log(entry: CleanupLogEntry): void {
    // Add to internal log
    this.logEntries.push(entry);
    
    // Collect metrics
    this.metricsCollector.recordEntry(entry);
    
    // Output to console if appropriate level
    if (this.shouldLog(entry.level)) {
      const message = this.formatLogEntry(entry);
      this.outputToConsole(entry.level, message, entry.metadata);
    }
    
    // Write to file if configured
    if (this.logFile) {
      this.writeToFile(entry);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log({
      timestamp: Date.now(),
      level: 'warn',
      resourceId: 'system',
      resourceType: 'custom',
      action: 'cleanup',
      metadata: { message, ...metadata }
    });
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log({
      timestamp: Date.now(),
      level: 'error',
      resourceId: 'system',
      resourceType: 'custom',
      action: 'error',
      error: error?.message || message,
      metadata: { 
        message, 
        stack: error?.stack,
        ...metadata 
      }
    });
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log({
      timestamp: Date.now(),
      level: 'info',
      resourceId: 'system',
      resourceType: 'custom',
      action: 'cleanup',
      metadata: { message, ...metadata }
    });
  }

  /**
   * Log a comprehensive cleanup report
   */
  logReport(report: CleanupReport): void {
    const reportSummary = this.formatReportSummary(report);
    
    if (this.shouldLog('info')) {
      console.log('\n=== Resource Cleanup Report ===');
      console.log(reportSummary);
      
      // Log detailed metrics if debug level
      if (this.config.logLevel === 'debug') {
        console.log('\n=== Detailed Metrics ===');
        console.log(JSON.stringify(this.metricsCollector.getMetrics(), null, 2));
      }
      
      // Log handle leaks with more detail if present
      if (report.openHandles && report.openHandles.leaks.length > 0) {
        console.warn('\n=== Handle Leaks Detected ===');
        report.openHandles.leaks.forEach((leak, index) => {
          console.warn(`${index + 1}. ${leak.type}: ${leak.description}`);
          if (leak.stack && this.config.logLevel === 'debug') {
            console.warn('   Stack trace:');
            leak.stack.split('\n').slice(0, 10).forEach(line => {
              if (line.trim()) {
                console.warn(`     ${line.trim()}`);
              }
            });
          }
        });
      }
      
      console.log('=== End Report ===\n');
    }
    
    // Write detailed report to file if configured
    if (this.logFile) {
      this.writeReportToFile(report);
    }
  }

  /**
   * Get all log entries
   */
  getLogEntries(): CleanupLogEntry[] {
    return [...this.logEntries];
  }

  /**
   * Get log entries filtered by criteria
   */
  getFilteredEntries(filter: {
    level?: CleanupLogEntry['level'];
    resourceType?: ResourceType;
    action?: CleanupLogEntry['action'];
    since?: number;
  }): CleanupLogEntry[] {
    return this.logEntries.filter(entry => {
      if (filter.level && entry.level !== filter.level) return false;
      if (filter.resourceType && entry.resourceType !== filter.resourceType) return false;
      if (filter.action && entry.action !== filter.action) return false;
      if (filter.since && entry.timestamp < filter.since) return false;
      return true;
    });
  }

  /**
   * Get collected metrics
   */
  getMetrics(): CleanupMetrics {
    return this.metricsCollector.getMetrics();
  }

  /**
   * Generate a performance report
   */
  generatePerformanceReport(): PerformanceReport {
    const metrics = this.metricsCollector.getMetrics();
    const entries = this.logEntries;
    
    return {
      totalOperations: entries.length,
      successRate: this.calculateSuccessRate(entries),
      averageCleanupTime: this.calculateAverageCleanupTime(entries),
      resourceTypeBreakdown: this.generateResourceTypeBreakdown(entries),
      errorAnalysis: this.generateErrorAnalysis(entries),
      timelineAnalysis: this.generateTimelineAnalysis(entries),
      recommendations: this.generateRecommendations(metrics, entries)
    };
  }

  /**
   * Clear all log entries and reset metrics
   */
  clear(): void {
    this.logEntries = [];
    this.metricsCollector.reset();
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: CleanupConfig): void {
    this.config = config;
    
    if (config.logToFile && config.logFilePath && config.logFilePath !== this.logFile) {
      this.logFile = config.logFilePath;
      this.ensureLogDirectory();
    }
  }

  /**
   * Export logs to JSON format
   */
  exportLogs(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      config: this.config,
      entries: this.logEntries,
      metrics: this.metricsCollector.getMetrics()
    }, null, 2);
  }

  private shouldLog(level: 'info' | 'warn' | 'error'): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    return messageLevel <= configLevel;
  }

  private formatLogEntry(entry: CleanupLogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const duration = entry.duration ? ` (${entry.duration}ms)` : '';
    const error = entry.error ? ` - ${entry.error}` : '';
    
    return `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.resourceType}:${entry.resourceId}] ${entry.action}${duration}${error}`;
  }

  private outputToConsole(level: CleanupLogEntry['level'], message: string, metadata?: Record<string, any>): void {
    const fullMessage = `[ResourceCleanup] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(fullMessage, metadata || '');
        break;
      case 'warn':
        console.warn(fullMessage, metadata || '');
        break;
      case 'info':
        console.log(fullMessage, metadata || '');
        break;
    }
  }

  private writeToFile(entry: CleanupLogEntry): void {
    if (!this.logFile) return;
    
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      // Avoid infinite recursion by not logging this error through the logger
      console.error('[ResourceCleanup] Failed to write to log file:', error);
    }
  }

  private writeReportToFile(report: CleanupReport): void {
    if (!this.logFile) return;
    
    try {
      const reportFile = this.logFile.replace('.log', '_report.json');
      const reportData = {
        timestamp: Date.now(),
        report,
        metrics: this.metricsCollector.getMetrics(),
        performanceReport: this.generatePerformanceReport()
      };
      
      fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    } catch (error) {
      console.error('[ResourceCleanup] Failed to write report to file:', error);
    }
  }

  private ensureLogDirectory(): void {
    if (!this.logFile) return;
    
    try {
      const dir = path.dirname(this.logFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (error) {
      console.error('[ResourceCleanup] Failed to create log directory:', error);
    }
  }

  private formatReportSummary(report: CleanupReport): string {
    const lines: string[] = [];
    
    lines.push(`Duration: ${report.duration}ms`);
    lines.push(`Resources: ${report.resources.total} total, ${report.resources.cleaned} cleaned, ${report.resources.failed} failed`);
    
    if (report.resources.forced > 0) {
      lines.push(`Forced closures: ${report.resources.forced}`);
    }
    
    if (report.errors.length > 0) {
      lines.push(`Errors: ${report.errors.length}`);
      report.errors.slice(0, 3).forEach(error => {
        lines.push(`  - ${error.type}: ${error.message}`);
      });
      if (report.errors.length > 3) {
        lines.push(`  ... and ${report.errors.length - 3} more`);
      }
    }
    
    if (report.warnings.length > 0) {
      lines.push(`Warnings: ${report.warnings.length}`);
      report.warnings.slice(0, 3).forEach(warning => {
        lines.push(`  - ${warning}`);
      });
      if (report.warnings.length > 3) {
        lines.push(`  ... and ${report.warnings.length - 3} more`);
      }
    }
    
    if (report.openHandles) {
      lines.push(`Open handles: ${report.openHandles.before} → ${report.openHandles.after} (${report.openHandles.leaks.length} leaks)`);
    }
    
    // Resource type breakdown
    const typeStats = Object.entries(report.byType);
    if (typeStats.length > 0) {
      lines.push('By type:');
      typeStats.forEach(([type, stats]) => {
        lines.push(`  ${type}: ${stats.success}/${stats.count} (avg: ${Math.round(stats.avgTime)}ms)`);
      });
    }
    
    return lines.join('\n');
  }

  private calculateSuccessRate(entries: CleanupLogEntry[]): number {
    const cleanupEntries = entries.filter(e => e.action === 'cleanup');
    if (cleanupEntries.length === 0) return 100;
    
    const successful = cleanupEntries.filter(e => !e.error).length;
    return (successful / cleanupEntries.length) * 100;
  }

  private calculateAverageCleanupTime(entries: CleanupLogEntry[]): number {
    const cleanupEntries = entries.filter(e => e.action === 'cleanup' && e.duration);
    if (cleanupEntries.length === 0) return 0;
    
    const totalTime = cleanupEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    return totalTime / cleanupEntries.length;
  }

  private generateResourceTypeBreakdown(entries: CleanupLogEntry[]): Record<ResourceType, { count: number; avgTime: number; successRate: number }> {
    const breakdown: Record<string, { count: number; totalTime: number; successful: number }> = {};
    
    entries.filter(e => e.action === 'cleanup').forEach(entry => {
      if (!breakdown[entry.resourceType]) {
        breakdown[entry.resourceType] = { count: 0, totalTime: 0, successful: 0 };
      }
      
      breakdown[entry.resourceType].count++;
      breakdown[entry.resourceType].totalTime += entry.duration || 0;
      if (!entry.error) {
        breakdown[entry.resourceType].successful++;
      }
    });
    
    const result: Record<string, any> = {};
    Object.entries(breakdown).forEach(([type, stats]) => {
      result[type] = {
        count: stats.count,
        avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
        successRate: stats.count > 0 ? (stats.successful / stats.count) * 100 : 100
      };
    });
    
    return result as Record<ResourceType, { count: number; avgTime: number; successRate: number }>;
  }

  private generateErrorAnalysis(entries: CleanupLogEntry[]): ErrorAnalysis {
    const errorEntries = entries.filter(e => e.error);
    const errorsByType: Record<string, number> = {};
    const errorsByResource: Partial<Record<ResourceType, number>> = {};
    
    errorEntries.forEach(entry => {
      // Count by error message patterns
      const errorType = this.categorizeError(entry.error || '');
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
      
      // Count by resource type
      errorsByResource[entry.resourceType] = (errorsByResource[entry.resourceType] || 0) + 1;
    });
    
    return {
      totalErrors: errorEntries.length,
      errorsByType,
      errorsByResource,
      mostCommonError: Object.entries(errorsByType).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
    };
  }

  private generateTimelineAnalysis(entries: CleanupLogEntry[]): TimelineAnalysis {
    if (entries.length === 0) {
      return { duration: 0, phases: [], peakConcurrency: 0 };
    }
    
    const startTime = Math.min(...entries.map(e => e.timestamp));
    const endTime = Math.max(...entries.map(e => e.timestamp));
    const duration = endTime - startTime;
    
    // Analyze phases of cleanup
    const phases = this.identifyCleanupPhases(entries);
    
    // Calculate peak concurrency
    const peakConcurrency = this.calculatePeakConcurrency(entries);
    
    return { duration, phases, peakConcurrency };
  }

  private generateRecommendations(metrics: CleanupMetrics, entries: CleanupLogEntry[]): string[] {
    const recommendations: string[] = [];
    
    // Performance recommendations
    if (metrics.averageCleanupTime > 5000) {
      recommendations.push('Consider reducing cleanup timeouts or optimizing resource cleanup logic');
    }
    
    if (metrics.errorRate > 10) {
      recommendations.push('High error rate detected - review resource cleanup implementations');
    }
    
    // Resource-specific recommendations
    const dbEntries = entries.filter(e => e.resourceType === 'database');
    if (dbEntries.length > 10) {
      recommendations.push('Consider using connection pooling to reduce database cleanup overhead');
    }
    
    const serverEntries = entries.filter(e => e.resourceType === 'server');
    if (serverEntries.some(e => e.duration && e.duration > 3000)) {
      recommendations.push('Server shutdown times are high - consider implementing graceful shutdown patterns');
    }
    
    // Handle leak recommendations
    const handleLeaks = entries.filter(e => e.metadata?.leaksDetected > 0);
    if (handleLeaks.length > 0) {
      recommendations.push('Handle leaks detected - review timer and connection cleanup in tests');
    }
    
    return recommendations;
  }

  private categorizeError(error: string): string {
    if (error.includes('timeout') || error.includes('TIMEOUT')) return 'Timeout';
    if (error.includes('ECONNREFUSED') || error.includes('connection refused')) return 'Connection Refused';
    if (error.includes('EADDRINUSE') || error.includes('address already in use')) return 'Address In Use';
    if (error.includes('EPERM') || error.includes('permission denied')) return 'Permission Denied';
    if (error.includes('ENOENT') || error.includes('no such file')) return 'File Not Found';
    return 'Unknown';
  }

  private identifyCleanupPhases(entries: CleanupLogEntry[]): Array<{ name: string; duration: number; resourceCount: number }> {
    // Group entries by resource type to identify cleanup phases
    const phases: Array<{ name: string; duration: number; resourceCount: number }> = [];
    
    const resourceTypes = [...new Set(entries.map(e => e.resourceType))];
    
    resourceTypes.forEach(type => {
      const typeEntries = entries.filter(e => e.resourceType === type && e.action === 'cleanup');
      if (typeEntries.length > 0) {
        const startTime = Math.min(...typeEntries.map(e => e.timestamp));
        const endTime = Math.max(...typeEntries.map(e => e.timestamp + (e.duration || 0)));
        
        phases.push({
          name: `${type} cleanup`,
          duration: endTime - startTime,
          resourceCount: typeEntries.length
        });
      }
    });
    
    return phases.sort((a, b) => a.duration - b.duration);
  }

  private calculatePeakConcurrency(entries: CleanupLogEntry[]): number {
    // This is a simplified calculation - in reality you'd track overlapping operations
    const cleanupEntries = entries.filter(e => e.action === 'cleanup');
    return Math.max(1, Math.ceil(cleanupEntries.length / 10)); // Rough estimate
  }
}

/**
 * Metrics Collector for Cleanup Operations
 */
class MetricsCollector {
  private metrics: CleanupMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageCleanupTime: 0,
    totalCleanupTime: 0,
    errorRate: 0,
    resourceTypeStats: {} as Record<ResourceType, { count: number; totalTime: number; errors: number; }>,
    timelineStats: {
      firstOperation: 0,
      lastOperation: 0,
      peakConcurrency: 0
    }
  };

  recordEntry(entry: CleanupLogEntry): void {
    if (entry.action === 'cleanup') {
      this.metrics.totalOperations++;
      
      if (entry.error) {
        this.metrics.failedOperations++;
      } else {
        this.metrics.successfulOperations++;
      }
      
      if (entry.duration) {
        this.metrics.totalCleanupTime += entry.duration;
        this.metrics.averageCleanupTime = this.metrics.totalCleanupTime / this.metrics.totalOperations;
      }
      
      // Update resource type stats
      if (!this.metrics.resourceTypeStats[entry.resourceType]) {
        this.metrics.resourceTypeStats[entry.resourceType] = {
          count: 0,
          totalTime: 0,
          errors: 0
        };
      }
      
      const typeStats = this.metrics.resourceTypeStats[entry.resourceType];
      typeStats.count++;
      if (entry.duration) {
        typeStats.totalTime += entry.duration;
      }
      if (entry.error) {
        typeStats.errors++;
      }
      
      // Update timeline stats
      if (this.metrics.timelineStats.firstOperation === 0) {
        this.metrics.timelineStats.firstOperation = entry.timestamp;
      }
      this.metrics.timelineStats.lastOperation = entry.timestamp;
    }
    
    // Calculate error rate
    if (this.metrics.totalOperations > 0) {
      this.metrics.errorRate = (this.metrics.failedOperations / this.metrics.totalOperations) * 100;
    }
  }

  getMetrics(): CleanupMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageCleanupTime: 0,
      totalCleanupTime: 0,
      errorRate: 0,
      resourceTypeStats: {} as Record<ResourceType, { count: number; totalTime: number; errors: number; }>,
      timelineStats: {
        firstOperation: 0,
        lastOperation: 0,
        peakConcurrency: 0
      }
    };
  }
}

// Types for metrics and reporting
export interface CleanupMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageCleanupTime: number;
  totalCleanupTime: number;
  errorRate: number;
  resourceTypeStats: Record<ResourceType, {
    count: number;
    totalTime: number;
    errors: number;
  }>;
  timelineStats: {
    firstOperation: number;
    lastOperation: number;
    peakConcurrency: number;
  };
}

export interface PerformanceReport {
  totalOperations: number;
  successRate: number;
  averageCleanupTime: number;
  resourceTypeBreakdown: Record<ResourceType, {
    count: number;
    avgTime: number;
    successRate: number;
  }>;
  errorAnalysis: ErrorAnalysis;
  timelineAnalysis: TimelineAnalysis;
  recommendations: string[];
}

export interface ErrorAnalysis {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByResource: Partial<Record<ResourceType, number>>;
  mostCommonError: string;
}

export interface TimelineAnalysis {
  duration: number;
  phases: Array<{
    name: string;
    duration: number;
    resourceCount: number;
  }>;
  peakConcurrency: number;
}