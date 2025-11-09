/**
 * Advanced Metrics and Monitoring System for Resource Cleanup
 * Provides comprehensive performance monitoring, alerting, and dashboard capabilities
 */

import { CleanupLogEntry, CleanupConfig, ResourceType, CleanupReport } from './types';
import { CleanupLogger, CleanupMetrics, PerformanceReport } from './cleanupLogger';
import { DiagnosticTools } from './diagnosticTools';
import { OpenHandleDetector } from './handleDetector';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Advanced Metrics System for Resource Cleanup Operations
 */
export class AdvancedMetricsSystem {
  private performanceMonitor: PerformanceMonitor;
  private alertManager: AlertManager;
  private dashboardGenerator: DashboardGenerator;
  private metricsCollector: MetricsCollector;
  private config: CleanupConfig;

  constructor(
    config: CleanupConfig,
    private logger: CleanupLogger,
    private diagnosticTools: DiagnosticTools,
    private handleDetector: OpenHandleDetector
  ) {
    this.config = config;
    this.performanceMonitor = new PerformanceMonitor(config);
    this.alertManager = new AlertManager(config);
    this.dashboardGenerator = new DashboardGenerator(config);
    this.metricsCollector = new MetricsCollector();
  }

  /**
   * Record a cleanup operation for metrics collection
   */
  recordCleanupOperation(entry: CleanupLogEntry): void {
    this.metricsCollector.recordOperation(entry);
    this.performanceMonitor.recordOperation(entry);
    
    // Check for alerts
    const alerts = this.alertManager.checkForAlerts(entry, this.metricsCollector.getMetrics());
    alerts.forEach(alert => this.handleAlert(alert));
  }

  /**
   * Generate comprehensive performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Generate real-time dashboard data
   */
  generateDashboardData(): DashboardData {
    return this.dashboardGenerator.generateDashboard(
      this.metricsCollector.getMetrics(),
      this.performanceMonitor.getMetrics(),
      this.logger.getMetrics(),
      this.handleDetector.getHandleReport()
    );
  }

  /**
   * Generate CI/CD summary report
   */
  generateCISummary(): CISummaryReport {
    const metrics = this.metricsCollector.getMetrics();
    const performance = this.performanceMonitor.getMetrics();
    const alerts = this.alertManager.getActiveAlerts();
    const handleReport = this.handleDetector.getHandleReport();

    return {
      timestamp: Date.now(),
      status: this.determineCIStatus(metrics, performance, alerts, handleReport),
      summary: {
        totalResources: metrics.totalOperations,
        successRate: metrics.successRate,
        errorRate: metrics.errorRate,
        leaksDetected: handleReport.leaks.length,
        averageCleanupTime: performance.averageResponseTime,
        alertsActive: alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length
      },
      alerts: alerts.filter(a => a.severity === 'critical' || a.severity === 'high'),
      recommendations: this.generateCIRecommendations(metrics, performance, alerts),
      wouldJestHang: this.handleDetector.wouldJestDetectHandles(),
      exitCode: this.calculateExitCode(metrics, performance, alerts, handleReport)
    };
  }

  /**
   * Export metrics to various formats
   */
  async exportMetrics(format: 'json' | 'csv' | 'prometheus', outputPath: string): Promise<void> {
    const metrics = this.metricsCollector.getMetrics();
    const performance = this.performanceMonitor.getMetrics();
    
    let content: string;
    
    switch (format) {
      case 'json':
        content = JSON.stringify({ metrics, performance }, null, 2);
        break;
      case 'csv':
        content = this.generateCSVMetrics(metrics, performance);
        break;
      case 'prometheus':
        content = this.generatePrometheusMetrics(metrics, performance);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content);
    this.logger.info(`Metrics exported to: ${outputPath}`, { format, size: content.length });
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alertManager.getActiveAlerts();
  }

  /**
   * Reset all metrics and alerts
   */
  reset(): void {
    this.metricsCollector.reset();
    this.performanceMonitor.reset();
    this.alertManager.reset();
  }

  private handleAlert(alert: Alert): void {
    this.logger.warn(`Alert triggered: ${alert.message}`, {
      severity: alert.severity,
      type: alert.type,
      resourceType: alert.resourceType
    });

    // In a real implementation, this could send notifications, webhooks, etc.
    if (alert.severity === 'critical') {
      console.error(`🚨 CRITICAL ALERT: ${alert.message}`);
    }
  }

  private determineCIStatus(
    metrics: CollectedMetrics,
    performance: PerformanceMetrics,
    alerts: Alert[],
    handleReport: any
  ): 'pass' | 'warning' | 'fail' {
    // Fail conditions
    if (alerts.some(a => a.severity === 'critical')) return 'fail';
    if (this.handleDetector.wouldJestDetectHandles()) return 'fail';
    if (metrics.errorRate > 50) return 'fail';
    if (performance.averageResponseTime > 30000) return 'fail';

    // Warning conditions
    if (alerts.some(a => a.severity === 'high')) return 'warning';
    if (metrics.errorRate > 10) return 'warning';
    if (handleReport.leaks.length > 5) return 'warning';
    if (performance.averageResponseTime > 10000) return 'warning';

    return 'pass';
  }

  private calculateExitCode(
    metrics: CollectedMetrics,
    performance: PerformanceMetrics,
    alerts: Alert[],
    handleReport: any
  ): number {
    if (alerts.some(a => a.severity === 'critical')) return 1;
    if (this.handleDetector.wouldJestDetectHandles()) return 1;
    if (handleReport.leaks.length > 10) return 1;
    if (metrics.errorRate > 50) return 1;
    return 0;
  }

  private generateCIRecommendations(
    metrics: CollectedMetrics,
    performance: PerformanceMetrics,
    alerts: Alert[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.errorRate > 20) {
      recommendations.push('High error rate detected - review cleanup implementations');
    }

    if (performance.averageResponseTime > 5000) {
      recommendations.push('Slow cleanup performance - consider optimizing timeouts');
    }

    if (alerts.length > 5) {
      recommendations.push('Multiple alerts active - review system health');
    }

    return recommendations.slice(0, 3); // Top 3 recommendations
  }

  private generateCSVMetrics(metrics: CollectedMetrics, performance: PerformanceMetrics): string {
    const headers = [
      'timestamp', 'total_operations', 'success_rate', 'error_rate',
      'avg_response_time', 'p95_response_time', 'throughput'
    ];

    const row = [
      Date.now(),
      metrics.totalOperations,
      metrics.successRate,
      metrics.errorRate,
      performance.averageResponseTime,
      performance.p95ResponseTime,
      performance.throughput
    ];

    return [headers.join(','), row.join(',')].join('\n');
  }

  private generatePrometheusMetrics(metrics: CollectedMetrics, performance: PerformanceMetrics): string {
    const timestamp = Date.now();
    return [
      `# HELP cleanup_operations_total Total number of cleanup operations`,
      `# TYPE cleanup_operations_total counter`,
      `cleanup_operations_total ${metrics.totalOperations} ${timestamp}`,
      ``,
      `# HELP cleanup_success_rate Success rate of cleanup operations`,
      `# TYPE cleanup_success_rate gauge`,
      `cleanup_success_rate ${metrics.successRate / 100} ${timestamp}`,
      ``,
      `# HELP cleanup_response_time_seconds Average cleanup response time in seconds`,
      `# TYPE cleanup_response_time_seconds gauge`,
      `cleanup_response_time_seconds ${performance.averageResponseTime / 1000} ${timestamp}`,
      ``,
      `# HELP cleanup_error_rate Error rate of cleanup operations`,
      `# TYPE cleanup_error_rate gauge`,
      `cleanup_error_rate ${metrics.errorRate / 100} ${timestamp}`
    ].join('\n');
  }
}

/**
 * Performance Monitor for tracking cleanup operation performance
 */
class PerformanceMonitor {
  private operations: OperationRecord[] = [];
  private windowSize: number = 1000; // Keep last 1000 operations
  private config: CleanupConfig;

  constructor(config: CleanupConfig) {
    this.config = config;
  }

  recordOperation(entry: CleanupLogEntry): void {
    if (entry.action === 'cleanup') {
      const record: OperationRecord = {
        timestamp: entry.timestamp,
        resourceType: entry.resourceType,
        duration: entry.duration || 0,
        success: !entry.error,
        error: entry.error
      };

      this.operations.push(record);

      // Keep only recent operations
      if (this.operations.length > this.windowSize) {
        this.operations = this.operations.slice(-this.windowSize);
      }
    }
  }

  getMetrics(): PerformanceMetrics {
    if (this.operations.length === 0) {
      return {
        totalOperations: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        resourceTypeBreakdown: {} as Record<ResourceType, ResourceTypeMetrics>,
        timeSeriesData: []
      };
    }

    const durations = this.operations.map(op => op.duration).sort((a, b) => a - b);
    const successfulOps = this.operations.filter(op => op.success);
    const timeWindow = 60000; // 1 minute
    const recentOps = this.operations.filter(op => 
      Date.now() - op.timestamp < timeWindow
    );

    return {
      totalOperations: this.operations.length,
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p95ResponseTime: durations[Math.floor(durations.length * 0.95)] || 0,
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)] || 0,
      throughput: recentOps.length / (timeWindow / 1000), // ops per second
      errorRate: ((this.operations.length - successfulOps.length) / this.operations.length) * 100,
      resourceTypeBreakdown: this.generateResourceTypeBreakdown(),
      timeSeriesData: this.generateTimeSeriesData()
    };
  }

  reset(): void {
    this.operations = [];
  }

  private generateResourceTypeBreakdown(): Record<ResourceType, ResourceTypeMetrics> {
    const breakdown: Record<string, ResourceTypeMetrics> = {};

    this.operations.forEach(op => {
      if (!breakdown[op.resourceType]) {
        breakdown[op.resourceType] = {
          count: 0,
          averageTime: 0,
          successRate: 0,
          errorCount: 0
        };
      }

      const metrics = breakdown[op.resourceType];
      metrics.count++;
      if (!op.success) {
        metrics.errorCount++;
      }
    });

    // Calculate averages
    Object.entries(breakdown).forEach(([type, metrics]) => {
      const typeOps = this.operations.filter(op => op.resourceType === type);
      const totalTime = typeOps.reduce((sum, op) => sum + op.duration, 0);
      const successCount = typeOps.filter(op => op.success).length;

      metrics.averageTime = totalTime / typeOps.length;
      metrics.successRate = (successCount / typeOps.length) * 100;
    });

    return breakdown as Record<ResourceType, ResourceTypeMetrics>;
  }

  private generateTimeSeriesData(): TimeSeriesPoint[] {
    const points: TimeSeriesPoint[] = [];
    const interval = 30000; // 30 second intervals
    const now = Date.now();
    const startTime = now - (10 * interval); // Last 5 minutes

    for (let time = startTime; time <= now; time += interval) {
      const windowOps = this.operations.filter(op => 
        op.timestamp >= time && op.timestamp < time + interval
      );

      if (windowOps.length > 0) {
        const avgDuration = windowOps.reduce((sum, op) => sum + op.duration, 0) / windowOps.length;
        const successRate = (windowOps.filter(op => op.success).length / windowOps.length) * 100;

        points.push({
          timestamp: time,
          value: avgDuration,
          count: windowOps.length,
          successRate
        });
      }
    }

    return points;
  }
}

/**
 * Alert Manager for detecting and managing alerts
 */
class AlertManager {
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private config: CleanupConfig;

  constructor(config: CleanupConfig) {
    this.config = config;
    this.initializeDefaultRules();
  }

  checkForAlerts(entry: CleanupLogEntry, metrics: CollectedMetrics): Alert[] {
    const newAlerts: Alert[] = [];

    this.alertRules.forEach(rule => {
      if (rule.condition(entry, metrics)) {
        const alert: Alert = {
          id: `${rule.type}_${Date.now()}`,
          type: rule.type,
          severity: rule.severity,
          message: rule.message(entry, metrics),
          timestamp: Date.now(),
          resourceType: entry.resourceType,
          resolved: false
        };

        // Check if similar alert already exists
        const existingAlert = this.alerts.find(a => 
          a.type === alert.type && 
          a.resourceType === alert.resourceType && 
          !a.resolved
        );

        if (!existingAlert) {
          this.alerts.push(alert);
          newAlerts.push(alert);
        }
      }
    });

    return newAlerts;
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }

  reset(): void {
    this.alerts = [];
  }

  private initializeDefaultRules(): void {
    // High error rate alert
    this.alertRules.push({
      type: 'high_error_rate',
      severity: 'high',
      condition: (entry, metrics) => metrics.errorRate > 25,
      message: (entry, metrics) => `High error rate detected: ${metrics.errorRate.toFixed(1)}%`
    });

    // Critical error rate alert
    this.alertRules.push({
      type: 'critical_error_rate',
      severity: 'critical',
      condition: (entry, metrics) => metrics.errorRate > 50,
      message: (entry, metrics) => `Critical error rate: ${metrics.errorRate.toFixed(1)}%`
    });

    // Slow cleanup alert
    this.alertRules.push({
      type: 'slow_cleanup',
      severity: 'medium',
      condition: (entry, metrics) => entry.duration !== undefined && entry.duration > 10000,
      message: (entry, metrics) => `Slow cleanup detected: ${entry.duration}ms for ${entry.resourceType}`
    });

    // Resource leak alert
    this.alertRules.push({
      type: 'resource_leak',
      severity: 'high',
      condition: (entry, metrics) => entry.metadata?.leaksDetected > 0,
      message: (entry, metrics) => `Resource leaks detected: ${entry.metadata?.leaksDetected} handles`
    });

    // Timeout alert
    this.alertRules.push({
      type: 'cleanup_timeout',
      severity: 'high',
      condition: (entry, metrics) => Boolean(entry.error?.includes('timeout') || entry.error?.includes('TIMEOUT')),
      message: (entry, metrics) => `Cleanup timeout for ${entry.resourceType}: ${entry.resourceId}`
    });
  }
}

/**
 * Dashboard Generator for creating monitoring dashboards
 */
class DashboardGenerator {
  private config: CleanupConfig;

  constructor(config: CleanupConfig) {
    this.config = config;
  }

  generateDashboard(
    metrics: CollectedMetrics,
    performance: PerformanceMetrics,
    loggerMetrics: CleanupMetrics,
    handleReport: any
  ): DashboardData {
    return {
      timestamp: Date.now(),
      status: this.calculateOverallStatus(metrics, performance, handleReport),
      summary: {
        totalOperations: metrics.totalOperations,
        successRate: metrics.successRate,
        errorRate: metrics.errorRate,
        averageResponseTime: performance.averageResponseTime,
        activeHandles: handleReport.total,
        leaksDetected: handleReport.leaks.length
      },
      charts: {
        performanceTrend: {
          type: 'line',
          title: 'Performance Trend',
          data: performance.timeSeriesData.map(point => ({
            x: point.timestamp,
            y: point.value,
            value: point.value,
            label: new Date(point.timestamp).toLocaleTimeString()
          }))
        },
        resourceDistribution: {
          type: 'pie',
          title: 'Resources by Type',
          data: Object.entries(performance.resourceTypeBreakdown).map(([type, data]) => ({
            label: type,
            value: data.count,
            color: this.getResourceTypeColor(type as ResourceType)
          }))
        },
        errorRate: {
          type: 'gauge',
          title: 'Error Rate',
          data: [{
            label: 'Error Rate',
            value: metrics.errorRate,
            max: 100,
            color: metrics.errorRate > 25 ? '#f44336' : metrics.errorRate > 10 ? '#ff9800' : '#4caf50'
          }]
        },
        handleGrowth: {
          type: 'bar',
          title: 'Handle Growth',
          data: [
            { label: 'Baseline', value: handleReport.baseline },
            { label: 'Current', value: handleReport.total },
            { label: 'Leaks', value: handleReport.leaks.length }
          ]
        }
      },
      alerts: [], // Would be populated by AlertManager
      recommendations: this.generateRecommendations(metrics, performance, handleReport)
    };
  }

  private calculateOverallStatus(
    metrics: CollectedMetrics,
    performance: PerformanceMetrics,
    handleReport: any
  ): 'healthy' | 'warning' | 'critical' {
    if (metrics.errorRate > 50 || handleReport.leaks.length > 10) {
      return 'critical';
    }
    if (metrics.errorRate > 10 || performance.averageResponseTime > 5000 || handleReport.leaks.length > 0) {
      return 'warning';
    }
    return 'healthy';
  }

  private generateRecommendations(
    metrics: CollectedMetrics,
    performance: PerformanceMetrics,
    handleReport: any
  ): string[] {
    const recommendations: string[] = [];

    if (performance.averageResponseTime > 5000) {
      recommendations.push('Consider optimizing cleanup timeouts to improve performance');
    }

    if (metrics.errorRate > 15) {
      recommendations.push('Review error patterns and implement better error handling');
    }

    if (handleReport.leaks.length > 0) {
      recommendations.push('Address resource leaks to prevent Jest hanging issues');
    }

    return recommendations;
  }

  private getResourceTypeColor(type: ResourceType): string {
    const colors = {
      database: '#4CAF50',
      server: '#2196F3',
      timer: '#FF9800',
      socket: '#9C27B0',
      process: '#F44336',
      custom: '#607D8B'
    };
    return colors[type] || '#9E9E9E';
  }
}

/**
 * Metrics Collector for aggregating cleanup metrics
 */
class MetricsCollector {
  private metrics: CollectedMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    successRate: 100,
    errorRate: 0,
    resourceTypeStats: {} as Record<ResourceType, { count: number; errors: number; totalTime: number; }>,
    startTime: Date.now()
  };

  recordOperation(entry: CleanupLogEntry): void {
    if (entry.action === 'cleanup') {
      this.metrics.totalOperations++;

      if (entry.error) {
        this.metrics.failedOperations++;
      } else {
        this.metrics.successfulOperations++;
      }

      // Update rates
      if (this.metrics.totalOperations > 0) {
        this.metrics.successRate = (this.metrics.successfulOperations / this.metrics.totalOperations) * 100;
        this.metrics.errorRate = (this.metrics.failedOperations / this.metrics.totalOperations) * 100;
      }

      // Update resource type stats
      if (!this.metrics.resourceTypeStats[entry.resourceType]) {
        this.metrics.resourceTypeStats[entry.resourceType] = {
          count: 0,
          errors: 0,
          totalTime: 0
        };
      }

      const typeStats = this.metrics.resourceTypeStats[entry.resourceType];
      typeStats.count++;
      if (entry.error) {
        typeStats.errors++;
      }
      if (entry.duration) {
        typeStats.totalTime += entry.duration;
      }
    }
  }

  getMetrics(): CollectedMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      successRate: 100,
      errorRate: 0,
      resourceTypeStats: {} as Record<ResourceType, { count: number; errors: number; totalTime: number; }>,
      startTime: Date.now()
    };
  }
}

// Type definitions for the metrics system
export interface PerformanceMetrics {
  totalOperations: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  resourceTypeBreakdown: Record<ResourceType, ResourceTypeMetrics>;
  timeSeriesData: TimeSeriesPoint[];
}

export interface ResourceTypeMetrics {
  count: number;
  averageTime: number;
  successRate: number;
  errorCount: number;
}

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
  count: number;
  successRate: number;
}

export interface CollectedMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  successRate: number;
  errorRate: number;
  resourceTypeStats: Record<ResourceType, {
    count: number;
    errors: number;
    totalTime: number;
  }>;
  startTime: number;
}

export interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resourceType?: ResourceType;
  resolved: boolean;
  resolvedAt?: number;
}

export interface AlertRule {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: (entry: CleanupLogEntry, metrics: CollectedMetrics) => boolean;
  message: (entry: CleanupLogEntry, metrics: CollectedMetrics) => string;
}

export interface DashboardData {
  timestamp: number;
  status: 'healthy' | 'warning' | 'critical';
  summary: {
    totalOperations: number;
    successRate: number;
    errorRate: number;
    averageResponseTime: number;
    activeHandles: number;
    leaksDetected: number;
  };
  charts: {
    performanceTrend: ChartConfig;
    resourceDistribution: ChartConfig;
    errorRate: ChartConfig;
    handleGrowth: ChartConfig;
  };
  alerts: Alert[];
  recommendations: string[];
}

export interface ChartConfig {
  type: 'line' | 'pie' | 'bar' | 'gauge';
  title: string;
  data: Array<{
    label?: string;
    value: number;
    x?: number;
    y?: number;
    color?: string;
    max?: number;
  }>;
}

export interface CISummaryReport {
  timestamp: number;
  status: 'pass' | 'warning' | 'fail';
  summary: {
    totalResources: number;
    successRate: number;
    errorRate: number;
    leaksDetected: number;
    averageCleanupTime: number;
    alertsActive: number;
  };
  alerts: Alert[];
  recommendations: string[];
  wouldJestHang: boolean;
  exitCode: number;
}

export interface OperationRecord {
  timestamp: number;
  resourceType: ResourceType;
  duration: number;
  success: boolean;
  error?: string;
}