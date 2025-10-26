/**
 * Advanced Alerting System for Resource Cleanup
 * Detects recurring resource leaks, performance degradation, and system anomalies
 */

import { CleanupLogEntry, ResourceType, CleanupConfig } from './types';
import { Alert, CollectedMetrics, PerformanceMetrics } from './metricsSystem';
import { CleanupLogger } from './cleanupLogger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Advanced Alerting System with pattern detection and predictive capabilities
 */
export class AlertingSystem {
  private alertHistory: AlertHistory[] = [];
  private patternDetector: PatternDetector;
  private thresholdManager: ThresholdManager;
  private notificationManager: NotificationManager;
  private config: CleanupConfig;

  constructor(config: CleanupConfig, private logger: CleanupLogger) {
    this.config = config;
    this.patternDetector = new PatternDetector(config);
    this.thresholdManager = new ThresholdManager(config);
    this.notificationManager = new NotificationManager(config);
  }

  /**
   * Analyze metrics and detect alerts
   */
  analyzeAndAlert(
    entry: CleanupLogEntry,
    metrics: CollectedMetrics,
    performance: PerformanceMetrics
  ): Alert[] {
    const alerts: Alert[] = [];

    // Check immediate threshold violations
    alerts.push(...this.checkThresholdViolations(entry, metrics, performance));

    // Check for recurring patterns
    alerts.push(...this.patternDetector.detectRecurringIssues(entry, this.alertHistory));

    // Check for performance degradation trends
    alerts.push(...this.detectPerformanceTrends(performance));

    // Check for resource leak patterns
    alerts.push(...this.detectLeakPatterns(entry, metrics));

    // Store alerts in history for pattern analysis
    alerts.forEach(alert => {
      this.alertHistory.push({
        alert,
        context: { entry, metrics, performance },
        timestamp: Date.now()
      });
    });

    // Send notifications for critical alerts
    alerts.filter(a => a.severity === 'critical').forEach(alert => {
      this.notificationManager.sendAlert(alert);
    });

    return alerts;
  }

  /**
   * Get alert statistics and trends
   */
  getAlertStatistics(): AlertStatistics {
    const now = Date.now();
    const last24h = this.alertHistory.filter(h => now - h.timestamp < 86400000);
    const lastWeek = this.alertHistory.filter(h => now - h.timestamp < 604800000);

    return {
      total: this.alertHistory.length,
      last24Hours: last24h.length,
      lastWeek: lastWeek.length,
      bySeverity: this.groupAlertsBySeverity(last24h),
      byType: this.groupAlertsByType(last24h),
      recurringIssues: this.identifyRecurringIssues(),
      trends: this.calculateAlertTrends()
    };
  }

  /**
   * Generate alert report for CI/CD
   */
  generateAlertReport(): AlertReport {
    const statistics = this.getAlertStatistics();
    const criticalAlerts = this.alertHistory
      .filter(h => h.alert.severity === 'critical' && !h.alert.resolved)
      .slice(-10);

    return {
      timestamp: Date.now(),
      summary: {
        totalAlerts: statistics.total,
        criticalActive: criticalAlerts.length,
        recurringIssues: statistics.recurringIssues.length,
        overallRisk: this.calculateOverallRisk(statistics)
      },
      criticalAlerts: criticalAlerts.map(h => h.alert),
      recurringPatterns: statistics.recurringIssues,
      recommendations: this.generateAlertRecommendations(statistics),
      actionItems: this.generateActionItems(criticalAlerts)
    };
  }

  /**
   * Configure alert thresholds
   */
  configureThresholds(thresholds: AlertThresholds): void {
    this.thresholdManager.updateThresholds(thresholds);
  }

  /**
   * Export alert data for analysis
   */
  exportAlertData(outputPath: string): void {
    const data = {
      timestamp: Date.now(),
      config: this.config,
      alertHistory: this.alertHistory,
      statistics: this.getAlertStatistics(),
      thresholds: this.thresholdManager.getThresholds()
    };

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    this.logger.info(`Alert data exported to: ${outputPath}`);
  }

  private checkThresholdViolations(
    entry: CleanupLogEntry,
    metrics: CollectedMetrics,
    performance: PerformanceMetrics
  ): Alert[] {
    const alerts: Alert[] = [];
    const thresholds = this.thresholdManager.getThresholds();

    // Error rate threshold
    if (metrics.errorRate > thresholds.errorRate.critical) {
      alerts.push(this.createAlert(
        'error_rate_critical',
        'critical',
        `Critical error rate: ${metrics.errorRate.toFixed(1)}% (threshold: ${thresholds.errorRate.critical}%)`,
        entry.resourceType
      ));
    } else if (metrics.errorRate > thresholds.errorRate.warning) {
      alerts.push(this.createAlert(
        'error_rate_warning',
        'high',
        `High error rate: ${metrics.errorRate.toFixed(1)}% (threshold: ${thresholds.errorRate.warning}%)`,
        entry.resourceType
      ));
    }

    // Response time threshold
    if (performance.averageResponseTime > thresholds.responseTime.critical) {
      alerts.push(this.createAlert(
        'response_time_critical',
        'critical',
        `Critical response time: ${performance.averageResponseTime.toFixed(0)}ms (threshold: ${thresholds.responseTime.critical}ms)`,
        entry.resourceType
      ));
    } else if (performance.averageResponseTime > thresholds.responseTime.warning) {
      alerts.push(this.createAlert(
        'response_time_warning',
        'high',
        `Slow response time: ${performance.averageResponseTime.toFixed(0)}ms (threshold: ${thresholds.responseTime.warning}ms)`,
        entry.resourceType
      ));
    }

    // Throughput threshold
    if (performance.throughput < thresholds.throughput.critical) {
      alerts.push(this.createAlert(
        'throughput_critical',
        'critical',
        `Critical throughput: ${performance.throughput.toFixed(2)} ops/sec (threshold: ${thresholds.throughput.critical})`,
        entry.resourceType
      ));
    }

    return alerts;
  }

  private detectPerformanceTrends(performance: PerformanceMetrics): Alert[] {
    const alerts: Alert[] = [];
    
    // Analyze time series data for trends
    if (performance.timeSeriesData.length >= 5) {
      const recentPoints = performance.timeSeriesData.slice(-5);
      const trend = this.calculateTrend(recentPoints.map(p => p.value));

      if (trend > 0.2) { // 20% increase trend
        alerts.push(this.createAlert(
          'performance_degradation',
          'medium',
          `Performance degradation trend detected: ${(trend * 100).toFixed(1)}% increase in response time`
        ));
      }

      // Check for success rate decline
      const successRateTrend = this.calculateTrend(recentPoints.map(p => p.successRate));
      if (successRateTrend < -0.1) { // 10% decrease trend
        alerts.push(this.createAlert(
          'success_rate_decline',
          'high',
          `Success rate declining: ${(Math.abs(successRateTrend) * 100).toFixed(1)}% decrease trend`
        ));
      }
    }

    return alerts;
  }

  private detectLeakPatterns(entry: CleanupLogEntry, metrics: CollectedMetrics): Alert[] {
    const alerts: Alert[] = [];

    // Check for resource-specific leak patterns
    Object.entries(metrics.resourceTypeStats).forEach(([resourceType, stats]) => {
      const errorRate = stats.count > 0 ? (stats.errors / stats.count) * 100 : 0;
      
      if (errorRate > 30 && stats.count >= 5) {
        alerts.push(this.createAlert(
          'resource_leak_pattern',
          'high',
          `Potential leak pattern in ${resourceType}: ${errorRate.toFixed(1)}% error rate over ${stats.count} operations`,
          resourceType as ResourceType
        ));
      }
    });

    // Check for handle leak indicators
    if (entry.metadata?.leaksDetected && entry.metadata.leaksDetected > 0) {
      const leakCount = entry.metadata.leaksDetected;
      const severity = leakCount > 10 ? 'critical' : leakCount > 5 ? 'high' : 'medium';
      
      alerts.push(this.createAlert(
        'handle_leak_detected',
        severity,
        `Handle leaks detected: ${leakCount} open handles for ${entry.resourceType}`,
        entry.resourceType
      ));
    }

    return alerts;
  }

  private createAlert(
    type: string,
    severity: Alert['severity'],
    message: string,
    resourceType?: ResourceType
  ): Alert {
    return {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: Date.now(),
      resourceType,
      resolved: false
    };
  }

  private groupAlertsBySeverity(alerts: AlertHistory[]): Record<string, number> {
    const groups: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    alerts.forEach(h => {
      groups[h.alert.severity]++;
    });
    return groups;
  }

  private groupAlertsByType(alerts: AlertHistory[]): Record<string, number> {
    const groups: Record<string, number> = {};
    alerts.forEach(h => {
      groups[h.alert.type] = (groups[h.alert.type] || 0) + 1;
    });
    return groups;
  }

  private identifyRecurringIssues(): RecurringIssue[] {
    const issues: RecurringIssue[] = [];
    const typeGroups = this.groupAlertsByType(this.alertHistory);

    Object.entries(typeGroups).forEach(([type, count]) => {
      if (count >= 3) { // 3 or more occurrences
        const typeAlerts = this.alertHistory.filter(h => h.alert.type === type);
        const avgInterval = this.calculateAverageInterval(typeAlerts.map(h => h.timestamp));
        
        issues.push({
          type,
          occurrences: count,
          averageInterval: avgInterval,
          lastOccurrence: Math.max(...typeAlerts.map(h => h.timestamp)),
          severity: this.calculateRecurringSeverity(typeAlerts)
        });
      }
    });

    return issues.sort((a, b) => b.occurrences - a.occurrences);
  }

  private calculateAlertTrends(): AlertTrends {
    const now = Date.now();
    const periods = [
      { name: 'last1h', duration: 3600000 },
      { name: 'last6h', duration: 21600000 },
      { name: 'last24h', duration: 86400000 }
    ];

    const trends: Record<string, number> = {};
    
    periods.forEach(period => {
      const alerts = this.alertHistory.filter(h => now - h.timestamp < period.duration);
      trends[period.name] = alerts.length;
    });

    return {
      hourly: trends.last1h,
      sixHourly: trends.last6h,
      daily: trends.last24h,
      direction: this.calculateTrendDirection(trends)
    };
  }

  private calculateOverallRisk(statistics: AlertStatistics): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCount = statistics.bySeverity.critical || 0;
    const highCount = statistics.bySeverity.high || 0;
    const recurringCount = statistics.recurringIssues.length;

    if (criticalCount > 0 || recurringCount > 3) return 'critical';
    if (highCount > 2 || recurringCount > 1) return 'high';
    if (statistics.last24Hours > 5) return 'medium';
    return 'low';
  }

  private generateAlertRecommendations(statistics: AlertStatistics): string[] {
    const recommendations: string[] = [];

    if (statistics.bySeverity.critical > 0) {
      recommendations.push('Address critical alerts immediately to prevent system instability');
    }

    if (statistics.recurringIssues.length > 0) {
      recommendations.push('Investigate recurring issues to identify root causes');
    }

    if (statistics.last24Hours > 10) {
      recommendations.push('High alert volume detected - consider reviewing alert thresholds');
    }

    const errorRateAlerts = statistics.byType['error_rate_critical'] || 0;
    if (errorRateAlerts > 0) {
      recommendations.push('Review cleanup implementations to reduce error rates');
    }

    return recommendations;
  }

  private generateActionItems(criticalAlerts: AlertHistory[]): ActionItem[] {
    const actionItems: ActionItem[] = [];

    criticalAlerts.forEach(alertHistory => {
      const alert = alertHistory.alert;
      
      if (alert.type.includes('error_rate')) {
        actionItems.push({
          priority: 'P0',
          description: `Fix high error rate for ${alert.resourceType}`,
          estimatedEffort: 'Medium',
          impact: 'High',
          steps: [
            'Review error logs for patterns',
            'Identify failing cleanup operations',
            'Implement better error handling',
            'Add retry mechanisms where appropriate'
          ]
        });
      }

      if (alert.type.includes('leak')) {
        actionItems.push({
          priority: 'P0',
          description: `Address resource leaks in ${alert.resourceType}`,
          estimatedEffort: 'High',
          impact: 'Critical',
          steps: [
            'Use handle detection tools to identify leak sources',
            'Review resource lifecycle management',
            'Implement proper cleanup in finally blocks',
            'Add automated leak detection tests'
          ]
        });
      }
    });

    return actionItems;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;
    
    return avgY > 0 ? slope / avgY : 0; // Normalized slope
  }

  private calculateAverageInterval(timestamps: number[]): number {
    if (timestamps.length < 2) return 0;
    
    const sortedTimestamps = timestamps.sort((a, b) => a - b);
    const intervals: number[] = [];
    
    for (let i = 1; i < sortedTimestamps.length; i++) {
      intervals.push(sortedTimestamps[i] - sortedTimestamps[i - 1]);
    }
    
    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  private calculateRecurringSeverity(alerts: AlertHistory[]): Alert['severity'] {
    const severities = alerts.map(h => h.alert.severity);
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  private calculateTrendDirection(trends: Record<string, number>): 'increasing' | 'decreasing' | 'stable' {
    const values = Object.values(trends);
    if (values.length < 2) return 'stable';
    
    const trend = this.calculateTrend(values);
    if (trend > 0.1) return 'increasing';
    if (trend < -0.1) return 'decreasing';
    return 'stable';
  }
}

/**
 * Pattern Detector for identifying recurring issues
 */
class PatternDetector {
  private config: CleanupConfig;

  constructor(config: CleanupConfig) {
    this.config = config;
  }

  detectRecurringIssues(entry: CleanupLogEntry, history: AlertHistory[]): Alert[] {
    const alerts: Alert[] = [];
    
    // Look for similar errors in recent history
    const recentSimilar = this.findSimilarRecentAlerts(entry, history);
    
    if (recentSimilar.length >= 3) {
      alerts.push({
        id: `recurring_${entry.resourceType}_${Date.now()}`,
        type: 'recurring_issue',
        severity: 'high',
        message: `Recurring issue detected for ${entry.resourceType}: ${recentSimilar.length} similar alerts in recent history`,
        timestamp: Date.now(),
        resourceType: entry.resourceType,
        resolved: false
      });
    }

    return alerts;
  }

  private findSimilarRecentAlerts(entry: CleanupLogEntry, history: AlertHistory[]): AlertHistory[] {
    const recentWindow = Date.now() - 3600000; // Last hour
    
    return history.filter(h => 
      h.timestamp > recentWindow &&
      h.context.entry.resourceType === entry.resourceType &&
      h.context.entry.action === entry.action &&
      (entry.error && h.context.entry.error?.includes(entry.error.substring(0, 20)))
    );
  }
}

/**
 * Threshold Manager for configurable alert thresholds
 */
class ThresholdManager {
  private thresholds: AlertThresholds;

  constructor(config: CleanupConfig) {
    this.thresholds = this.getDefaultThresholds(config);
  }

  updateThresholds(thresholds: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  getThresholds(): AlertThresholds {
    return { ...this.thresholds };
  }

  private getDefaultThresholds(config: CleanupConfig): AlertThresholds {
    return {
      errorRate: {
        warning: 10,
        critical: 25
      },
      responseTime: {
        warning: config.gracefulTimeout * 0.8,
        critical: config.forceTimeout
      },
      throughput: {
        warning: 1,
        critical: 0.1
      },
      handleLeaks: {
        warning: 5,
        critical: 15
      }
    };
  }
}

/**
 * Notification Manager for sending alerts
 */
class NotificationManager {
  private config: CleanupConfig;

  constructor(config: CleanupConfig) {
    this.config = config;
  }

  sendAlert(alert: Alert): void {
    // In a real implementation, this would send notifications via:
    // - Email
    // - Slack/Teams webhooks
    // - PagerDuty
    // - Custom webhooks
    
    console.error(`🚨 CRITICAL ALERT: ${alert.message}`);
    
    // For CI environments, could write to specific files or set exit codes
    if (this.config.environment === 'ci') {
      this.writeCIAlert(alert);
    }
  }

  private writeCIAlert(alert: Alert): void {
    const alertFile = path.join(process.cwd(), 'cleanup-alerts.json');
    let alerts: Alert[] = [];
    
    try {
      if (fs.existsSync(alertFile)) {
        alerts = JSON.parse(fs.readFileSync(alertFile, 'utf8'));
      }
    } catch (error) {
      // Ignore read errors
    }
    
    alerts.push(alert);
    
    try {
      fs.writeFileSync(alertFile, JSON.stringify(alerts, null, 2));
    } catch (error) {
      console.error('Failed to write CI alert file:', error);
    }
  }
}

// Type definitions for alerting system
export interface AlertHistory {
  alert: Alert;
  context: {
    entry: CleanupLogEntry;
    metrics: CollectedMetrics;
    performance: PerformanceMetrics;
  };
  timestamp: number;
}

export interface AlertStatistics {
  total: number;
  last24Hours: number;
  lastWeek: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  recurringIssues: RecurringIssue[];
  trends: AlertTrends;
}

export interface RecurringIssue {
  type: string;
  occurrences: number;
  averageInterval: number;
  lastOccurrence: number;
  severity: Alert['severity'];
}

export interface AlertTrends {
  hourly: number;
  sixHourly: number;
  daily: number;
  direction: 'increasing' | 'decreasing' | 'stable';
}

export interface AlertReport {
  timestamp: number;
  summary: {
    totalAlerts: number;
    criticalActive: number;
    recurringIssues: number;
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
  };
  criticalAlerts: Alert[];
  recurringPatterns: RecurringIssue[];
  recommendations: string[];
  actionItems: ActionItem[];
}

export interface ActionItem {
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  description: string;
  estimatedEffort: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  steps: string[];
}

export interface AlertThresholds {
  errorRate: {
    warning: number;
    critical: number;
  };
  responseTime: {
    warning: number;
    critical: number;
  };
  throughput: {
    warning: number;
    critical: number;
  };
  handleLeaks: {
    warning: number;
    critical: number;
  };
}