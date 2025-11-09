import { CleanupReport, CleanupLogEntry, ResourceType } from './types';
import { CleanupLogger, CleanupMetrics, PerformanceReport } from './cleanupLogger';
import { DiagnosticTools, SystemHealthReport, LeakAnalysis } from './diagnosticTools';
import { OpenHandleDetector } from './handleDetector';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive Report Generator for Cleanup Operations
 * Generates detailed reports with metrics, visualizations, and actionable insights
 */
export class ReportGenerator {
  private logger: CleanupLogger;
  private diagnosticTools: DiagnosticTools;
  private handleDetector: OpenHandleDetector;

  constructor(logger: CleanupLogger, diagnosticTools: DiagnosticTools, handleDetector: OpenHandleDetector) {
    this.logger = logger;
    this.diagnosticTools = diagnosticTools;
    this.handleDetector = handleDetector;
  }

  /**
   * Generate a comprehensive cleanup report with all metrics and analysis
   */
  generateComprehensiveReport(options: ReportOptions = {}): ComprehensiveReport {
    const timestamp = Date.now();
    const metrics = this.logger.getMetrics();
    const performanceReport = this.logger.generatePerformanceReport();
    const systemHealth = this.diagnosticTools.generateSystemHealthReport();
    const cleanupPatterns = this.diagnosticTools.analyzeCleanupPatterns();
    const leakPredictions = this.diagnosticTools.predictPotentialLeaks();
    const handleReport = this.handleDetector.getHandleReport();

    const report: ComprehensiveReport = {
      metadata: {
        timestamp,
        generatedBy: 'ResourceCleanupManager',
        version: '1.0.0',
        testSuite: options.testSuite || 'Unknown',
        environment: options.environment || process.env.NODE_ENV || 'test'
      },
      executive: this.generateExecutiveSummary(systemHealth, metrics, performanceReport),
      metrics: {
        cleanup: metrics,
        performance: performanceReport,
        handles: {
          total: handleReport.total,
          baseline: handleReport.baseline,
          leaks: handleReport.leaks.length,
          growth: handleReport.total - handleReport.baseline
        }
      },
      analysis: {
        systemHealth,
        patterns: cleanupPatterns,
        predictions: leakPredictions,
        recommendations: this.generatePrioritizedRecommendations(systemHealth, cleanupPatterns)
      },
      details: {
        logEntries: options.includeLogEntries ? this.logger.getLogEntries() : [],
        handleDetails: handleReport,
        diagnosticSessions: this.diagnosticTools.getDiagnosticHistory()
      },
      visualizations: this.generateVisualizationData(metrics, performanceReport, handleReport)
    };

    return report;
  }

  /**
   * Generate a summary report for CI/CD pipelines
   */
  generateCISummaryReport(): CISummaryReport {
    const systemHealth = this.diagnosticTools.generateSystemHealthReport();
    const metrics = this.logger.getMetrics();
    const handleReport = this.handleDetector.getHandleReport();

    return {
      timestamp: Date.now(),
      status: this.determineCIStatus(systemHealth, metrics, handleReport),
      summary: {
        totalResources: metrics.totalOperations,
        successRate: metrics.totalOperations > 0 ? (metrics.successfulOperations / metrics.totalOperations) * 100 : 100,
        errorRate: metrics.errorRate,
        leaksDetected: handleReport.leaks.length,
        averageCleanupTime: metrics.averageCleanupTime
      },
      alerts: systemHealth.alerts.filter(alert => alert.level === 'critical' || alert.level === 'error'),
      recommendations: systemHealth.recommendations.slice(0, 3), // Top 3 recommendations
      wouldJestHang: this.handleDetector.wouldJestDetectHandles(),
      exitCode: this.calculateExitCode(systemHealth, handleReport)
    };
  }

  /**
   * Generate a detailed performance analysis report
   */
  generatePerformanceAnalysisReport(): PerformanceAnalysisReport {
    const performanceReport = this.logger.generatePerformanceReport();
    const patterns = this.diagnosticTools.analyzeCleanupPatterns();
    const metrics = this.logger.getMetrics();

    return {
      timestamp: Date.now(),
      overview: {
        totalOperations: performanceReport.totalOperations,
        successRate: performanceReport.successRate,
        averageTime: performanceReport.averageCleanupTime,
        performanceGrade: this.calculatePerformanceGrade(performanceReport)
      },
      timing: patterns.timingAnalysis,
      bottlenecks: this.identifyPerformanceBottlenecks(patterns, metrics),
      optimization: patterns.optimizationOpportunities,
      trends: this.analyzeTrends(this.logger.getLogEntries()),
      benchmarks: this.generateBenchmarks(performanceReport, patterns)
    };
  }

  /**
   * Generate a leak detection and analysis report
   */
  generateLeakAnalysisReport(): LeakAnalysisReport {
    const leakAnalysis = this.diagnosticTools.analyzeResourceLeaks();
    const handleReport = this.handleDetector.getHandleReport();
    const predictions = this.diagnosticTools.predictPotentialLeaks();

    return {
      timestamp: Date.now(),
      summary: {
        totalLeaks: leakAnalysis.totalLeaks,
        severity: leakAnalysis.severityAssessment,
        riskLevel: this.calculateLeakRiskLevel(leakAnalysis, handleReport),
        jestHangRisk: this.handleDetector.wouldJestDetectHandles()
      },
      leakDetails: leakAnalysis,
      handleAnalysis: {
        current: handleReport.total,
        baseline: handleReport.baseline,
        growth: handleReport.total - handleReport.baseline,
        leaksByType: this.categorizeHandlesByType(handleReport.leaks)
      },
      predictions,
      actionPlan: this.generateLeakActionPlan(leakAnalysis, predictions),
      preventionStrategies: this.generatePreventionStrategies(leakAnalysis, predictions)
    };
  }

  /**
   * Export report to various formats
   */
  async exportReport(report: ComprehensiveReport, format: 'json' | 'html' | 'markdown' | 'csv', outputPath: string): Promise<void> {
    try {
      let content: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(report, null, 2);
          break;
        case 'html':
          content = this.generateHTMLReport(report);
          break;
        case 'markdown':
          content = this.generateMarkdownReport(report);
          break;
        case 'csv':
          content = this.generateCSVReport(report);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, content);
      this.logger.info(`Report exported to: ${outputPath}`, { format, size: content.length });
    } catch (error) {
      this.logger.error(`Failed to export report`, error as Error, { format, outputPath });
      throw error;
    }
  }

  /**
   * Generate a real-time dashboard data structure
   */
  generateDashboardData(): DashboardData {
    const systemHealth = this.diagnosticTools.generateSystemHealthReport();
    const metrics = this.logger.getMetrics();
    const handleReport = this.handleDetector.getHandleReport();
    const recentEntries = this.logger.getFilteredEntries({ since: Date.now() - 300000 }); // Last 5 minutes

    return {
      timestamp: Date.now(),
      status: {
        health: systemHealth.overallHealth,
        activeResources: metrics.totalOperations,
        openHandles: handleReport.total,
        recentErrors: recentEntries.filter(e => e.error).length
      },
      metrics: {
        successRate: metrics.totalOperations > 0 ? (metrics.successfulOperations / metrics.totalOperations) * 100 : 100,
        averageCleanupTime: metrics.averageCleanupTime,
        errorRate: metrics.errorRate,
        handleGrowth: handleReport.total - handleReport.baseline
      },
      alerts: systemHealth.alerts,
      recentActivity: recentEntries.slice(-10).map(entry => ({
        timestamp: entry.timestamp,
        type: entry.resourceType,
        action: entry.action,
        success: !entry.error,
        duration: entry.duration
      })),
      charts: {
        resourcesByType: this.generateResourceTypeChart(metrics),
        performanceOverTime: this.generatePerformanceChart(recentEntries),
        errorDistribution: this.generateErrorChart(recentEntries)
      }
    };
  }

  private generateExecutiveSummary(
    systemHealth: SystemHealthReport,
    metrics: CleanupMetrics,
    performanceReport: PerformanceReport
  ): ExecutiveSummary {
    const criticalIssues = systemHealth.alerts.filter(a => a.level === 'critical').length;
    const majorIssues = systemHealth.alerts.filter(a => a.level === 'error').length;

    return {
      overallStatus: systemHealth.overallHealth,
      keyMetrics: {
        totalResources: metrics.totalOperations,
        successRate: metrics.totalOperations > 0 ? (metrics.successfulOperations / metrics.totalOperations) * 100 : 100,
        averageCleanupTime: metrics.averageCleanupTime,
        leaksDetected: systemHealth.leakStatus.totalLeaks
      },
      criticalFindings: [
        ...systemHealth.alerts.filter(a => a.level === 'critical').map(a => a.message),
        ...systemHealth.alerts.filter(a => a.level === 'error').map(a => a.message)
      ].slice(0, 5),
      riskAssessment: {
        jestHangRisk: this.handleDetector.wouldJestDetectHandles() ? 'high' : 'low',
        performanceRisk: metrics.averageCleanupTime > 5000 ? 'high' : metrics.averageCleanupTime > 2000 ? 'medium' : 'low',
        stabilityRisk: systemHealth.leakStatus.severityAssessment
      },
      actionRequired: criticalIssues > 0 || majorIssues > 2,
      nextSteps: systemHealth.recommendations.slice(0, 3)
    };
  }

  private generatePrioritizedRecommendations(
    systemHealth: SystemHealthReport,
    patterns: any
  ): PrioritizedRecommendation[] {
    const recommendations: PrioritizedRecommendation[] = [];

    // Critical recommendations (P0)
    if (systemHealth.leakStatus.severityAssessment === 'critical') {
      recommendations.push({
        priority: 'P0',
        category: 'Resource Leaks',
        description: 'Critical resource leaks detected - immediate action required',
        impact: 'high',
        effort: 'medium',
        actions: systemHealth.leakStatus.mitigationStrategies.slice(0, 3)
      });
    }

    // High priority recommendations (P1)
    if (systemHealth.performanceMetrics.averageCleanupTime > 10000) {
      recommendations.push({
        priority: 'P1',
        category: 'Performance',
        description: 'Cleanup operations are extremely slow',
        impact: 'high',
        effort: 'medium',
        actions: ['Review timeout configurations', 'Optimize cleanup logic', 'Implement parallel cleanup']
      });
    }

    // Medium priority recommendations (P2)
    if (systemHealth.performanceMetrics.errorAnalysis.totalErrors > 0) {
      recommendations.push({
        priority: 'P2',
        category: 'Reliability',
        description: 'Cleanup errors detected',
        impact: 'medium',
        effort: 'low',
        actions: ['Review error patterns', 'Implement better error handling', 'Add retry logic']
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private generateVisualizationData(
    metrics: CleanupMetrics,
    performanceReport: PerformanceReport,
    handleReport: any
  ): VisualizationData {
    return {
      resourceDistribution: {
        type: 'pie',
        data: Object.entries(metrics.resourceTypeStats).map(([type, stats]) => ({
          label: type,
          value: stats.count,
          color: this.getResourceTypeColor(type as ResourceType)
        }))
      },
      performanceTrend: {
        type: 'line',
        data: this.generatePerformanceTrendData(this.logger.getLogEntries()).map(point => ({
          label: new Date(point.timestamp).toLocaleTimeString(),
          value: point.value
        }))
      },
      errorDistribution: {
        type: 'bar',
        data: Object.entries(performanceReport.errorAnalysis.errorsByType).map(([type, count]) => ({
          label: type,
          value: count
        }))
      },
      handleGrowth: {
        type: 'area',
        data: [
          { label: 'Baseline', value: handleReport.baseline },
          { label: 'Current', value: handleReport.total },
          { label: 'Leaks', value: handleReport.leaks.length }
        ]
      }
    };
  }

  private determineCIStatus(systemHealth: SystemHealthReport, metrics: CleanupMetrics, handleReport: any): 'pass' | 'warning' | 'fail' {
    // Fail conditions
    if (systemHealth.alerts.some(a => a.level === 'critical')) return 'fail';
    if (this.handleDetector.wouldJestDetectHandles()) return 'fail';
    if (metrics.errorRate > 50) return 'fail';

    // Warning conditions
    if (systemHealth.alerts.some(a => a.level === 'error')) return 'warning';
    if (metrics.errorRate > 10) return 'warning';
    if (handleReport.leaks.length > 5) return 'warning';

    return 'pass';
  }

  private calculateExitCode(systemHealth: SystemHealthReport, handleReport: any): number {
    if (systemHealth.alerts.some(a => a.level === 'critical')) return 1;
    if (this.handleDetector.wouldJestDetectHandles()) return 1;
    if (handleReport.leaks.length > 10) return 1;
    return 0;
  }

  private calculatePerformanceGrade(performanceReport: PerformanceReport): 'A' | 'B' | 'C' | 'D' | 'F' {
    const avgTime = performanceReport.averageCleanupTime;
    const successRate = performanceReport.successRate;

    if (avgTime < 1000 && successRate > 95) return 'A';
    if (avgTime < 2000 && successRate > 90) return 'B';
    if (avgTime < 5000 && successRate > 80) return 'C';
    if (avgTime < 10000 && successRate > 70) return 'D';
    return 'F';
  }

  private identifyPerformanceBottlenecks(patterns: any, metrics: CleanupMetrics): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];

    // Identify slow resource types
    Object.entries(metrics.resourceTypeStats).forEach(([type, stats]) => {
      const avgTime = stats.count > 0 ? stats.totalTime / stats.count : 0;
      if (avgTime > 3000) {
        bottlenecks.push({
          type: 'slow_cleanup',
          resource: type as ResourceType,
          severity: avgTime > 10000 ? 'high' : 'medium',
          description: `${type} cleanup is slow (${avgTime.toFixed(0)}ms average)`,
          impact: `Affects ${stats.count} resources`,
          suggestion: `Optimize ${type} cleanup timeouts or implement parallel processing`
        });
      }
    });

    // Identify high error rates
    Object.entries(metrics.resourceTypeStats).forEach(([type, stats]) => {
      const errorRate = stats.count > 0 ? (stats.errors / stats.count) * 100 : 0;
      if (errorRate > 20) {
        bottlenecks.push({
          type: 'high_error_rate',
          resource: type as ResourceType,
          severity: errorRate > 50 ? 'high' : 'medium',
          description: `${type} has high error rate (${errorRate.toFixed(1)}%)`,
          impact: `${stats.errors} failed cleanups out of ${stats.count}`,
          suggestion: `Review ${type} cleanup implementation and add better error handling`
        });
      }
    });

    return bottlenecks.sort((a, b) => {
      const severityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private analyzeTrends(logEntries: CleanupLogEntry[]): TrendAnalysis {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const recentEntries = logEntries.filter(e => e.timestamp > oneHourAgo);

    if (recentEntries.length === 0) {
      return {
        direction: 'stable',
        changeRate: 0,
        description: 'No recent activity to analyze'
      };
    }

    const cleanupEntries = recentEntries.filter(e => e.action === 'cleanup');
    const errorEntries = cleanupEntries.filter(e => e.error);
    const errorRate = cleanupEntries.length > 0 ? (errorEntries.length / cleanupEntries.length) * 100 : 0;

    // Simple trend analysis based on error rate
    if (errorRate > 20) {
      return {
        direction: 'degrading',
        changeRate: errorRate,
        description: `Error rate is high (${errorRate.toFixed(1)}%) in recent activity`
      };
    } else if (errorRate < 5) {
      return {
        direction: 'improving',
        changeRate: -errorRate,
        description: `Low error rate (${errorRate.toFixed(1)}%) indicates stable performance`
      };
    } else {
      return {
        direction: 'stable',
        changeRate: 0,
        description: `Moderate error rate (${errorRate.toFixed(1)}%) - monitoring recommended`
      };
    }
  }

  private generateBenchmarks(performanceReport: PerformanceReport, patterns: any): PerformanceBenchmark[] {
    return [
      {
        metric: 'Average Cleanup Time',
        current: performanceReport.averageCleanupTime,
        target: 2000,
        benchmark: 1000,
        status: performanceReport.averageCleanupTime <= 1000 ? 'excellent' : 
                performanceReport.averageCleanupTime <= 2000 ? 'good' : 
                performanceReport.averageCleanupTime <= 5000 ? 'fair' : 'poor'
      },
      {
        metric: 'Success Rate',
        current: performanceReport.successRate,
        target: 95,
        benchmark: 99,
        status: performanceReport.successRate >= 99 ? 'excellent' :
                performanceReport.successRate >= 95 ? 'good' :
                performanceReport.successRate >= 90 ? 'fair' : 'poor'
      },
      {
        metric: 'P95 Cleanup Time',
        current: patterns.timingAnalysis.p95Time,
        target: 5000,
        benchmark: 3000,
        status: patterns.timingAnalysis.p95Time <= 3000 ? 'excellent' :
                patterns.timingAnalysis.p95Time <= 5000 ? 'good' :
                patterns.timingAnalysis.p95Time <= 10000 ? 'fair' : 'poor'
      }
    ];
  }

  private calculateLeakRiskLevel(leakAnalysis: LeakAnalysis, handleReport: any): 'low' | 'medium' | 'high' | 'critical' {
    if (leakAnalysis.severityAssessment === 'critical') return 'critical';
    if (this.handleDetector.wouldJestDetectHandles()) return 'high';
    if (leakAnalysis.totalLeaks > 10) return 'high';
    if (leakAnalysis.totalLeaks > 5) return 'medium';
    return 'low';
  }

  private categorizeHandlesByType(leaks: any[]): Record<string, number> {
    const categories: Record<string, number> = {};
    leaks.forEach(leak => {
      categories[leak.type] = (categories[leak.type] || 0) + 1;
    });
    return categories;
  }

  private generateLeakActionPlan(leakAnalysis: LeakAnalysis, predictions: any[]): ActionPlanItem[] {
    const actionPlan: ActionPlanItem[] = [];

    // Immediate actions for current leaks
    if (leakAnalysis.totalLeaks > 0) {
      actionPlan.push({
        priority: 'immediate',
        action: 'Fix Current Leaks',
        description: `Address ${leakAnalysis.totalLeaks} detected resource leaks`,
        steps: leakAnalysis.mitigationStrategies.slice(0, 3),
        estimatedTime: '2-4 hours'
      });
    }

    // Preventive actions based on predictions
    const highRiskPredictions = predictions.filter(p => p.riskLevel === 'high');
    if (highRiskPredictions.length > 0) {
      actionPlan.push({
        priority: 'high',
        action: 'Prevent Predicted Leaks',
        description: `Address ${highRiskPredictions.length} high-risk leak predictions`,
        steps: highRiskPredictions.map(p => p.preventionStrategy),
        estimatedTime: '4-8 hours'
      });
    }

    return actionPlan;
  }

  private generatePreventionStrategies(leakAnalysis: LeakAnalysis, predictions: any[]): PreventionStrategy[] {
    const strategies: PreventionStrategy[] = [
      {
        category: 'Testing',
        strategy: 'Implement comprehensive resource cleanup tests',
        implementation: [
          'Add tests that verify all resources are cleaned up',
          'Use handle detection in CI/CD pipelines',
          'Implement automated leak detection alerts'
        ],
        benefit: 'Early detection of resource leaks'
      },
      {
        category: 'Code Quality',
        strategy: 'Establish cleanup patterns and guidelines',
        implementation: [
          'Create standardized cleanup utilities',
          'Implement resource lifecycle management',
          'Add code review checklist for resource cleanup'
        ],
        benefit: 'Consistent and reliable resource management'
      },
      {
        category: 'Monitoring',
        strategy: 'Continuous resource monitoring',
        implementation: [
          'Set up real-time leak detection',
          'Implement performance monitoring dashboards',
          'Create alerting for resource anomalies'
        ],
        benefit: 'Proactive identification and resolution of issues'
      }
    ];

    return strategies;
  }

  // Utility methods for report generation
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

  private generatePerformanceTrendData(logEntries: CleanupLogEntry[]): Array<{ timestamp: number; value: number }> {
    const cleanupEntries = logEntries
      .filter(e => e.action === 'cleanup' && e.duration)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Group by 5-minute intervals
    const intervals: Record<number, number[]> = {};
    cleanupEntries.forEach(entry => {
      const interval = Math.floor(entry.timestamp / 300000) * 300000; // 5-minute intervals
      if (!intervals[interval]) intervals[interval] = [];
      intervals[interval].push(entry.duration!);
    });

    return Object.entries(intervals).map(([timestamp, durations]) => ({
      timestamp: parseInt(timestamp),
      value: durations.reduce((sum, d) => sum + d, 0) / durations.length
    }));
  }

  private generateResourceTypeChart(metrics: CleanupMetrics): ChartData {
    return {
      type: 'pie',
      data: Object.entries(metrics.resourceTypeStats).map(([type, stats]) => ({
        label: type,
        value: stats.count,
        color: this.getResourceTypeColor(type as ResourceType)
      }))
    };
  }

  private generatePerformanceChart(entries: CleanupLogEntry[]): ChartData {
    const data = this.generatePerformanceTrendData(entries);
    return {
      type: 'line',
      data: data.map(point => ({
        label: new Date(point.timestamp).toLocaleTimeString(),
        value: point.value
      }))
    };
  }

  private generateErrorChart(entries: CleanupLogEntry[]): ChartData {
    const errorsByType: Record<string, number> = {};
    entries.filter(e => e.error).forEach(entry => {
      errorsByType[entry.resourceType] = (errorsByType[entry.resourceType] || 0) + 1;
    });

    return {
      type: 'bar',
      data: Object.entries(errorsByType).map(([type, count]) => ({
        label: type,
        value: count
      }))
    };
  }

  private generateHTMLReport(report: ComprehensiveReport): string {
    // This would generate a comprehensive HTML report
    // For brevity, returning a simplified version
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Resource Cleanup Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .status-${report.executive.overallStatus} { 
          color: ${this.getStatusColor(report.executive.overallStatus)}; 
          font-weight: bold; 
        }
        .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; }
        .alert { padding: 10px; margin: 5px 0; border-left: 4px solid #f44336; background: #ffebee; }
    </style>
</head>
<body>
    <h1>Resource Cleanup Report</h1>
    <p>Generated: ${new Date(report.metadata.timestamp).toISOString()}</p>
    
    <h2>Executive Summary</h2>
    <p>Overall Status: <span class="status-${report.executive.overallStatus}">${report.executive.overallStatus.toUpperCase()}</span></p>
    
    <div class="metric">
        <h4>Total Resources</h4>
        <p>${report.executive.keyMetrics.totalResources}</p>
    </div>
    <div class="metric">
        <h4>Success Rate</h4>
        <p>${report.executive.keyMetrics.successRate.toFixed(1)}%</p>
    </div>
    <div class="metric">
        <h4>Avg Cleanup Time</h4>
        <p>${report.executive.keyMetrics.averageCleanupTime.toFixed(0)}ms</p>
    </div>
    <div class="metric">
        <h4>Leaks Detected</h4>
        <p>${report.executive.keyMetrics.leaksDetected}</p>
    </div>
    
    ${report.analysis.systemHealth.alerts.map(alert => `
        <div class="alert">
            <strong>${alert.level.toUpperCase()}:</strong> ${alert.message}
        </div>
    `).join('')}
    
    <h3>Recommendations</h3>
    <ul>
        ${report.executive.nextSteps.map(step => `<li>${step}</li>`).join('')}
    </ul>
</body>
</html>
    `;
  }

  private generateMarkdownReport(report: ComprehensiveReport): string {
    return `
# Resource Cleanup Report

Generated: ${new Date(report.metadata.timestamp).toISOString()}

## Executive Summary

**Overall Status:** ${report.executive.overallStatus.toUpperCase()}

### Key Metrics
- **Total Resources:** ${report.executive.keyMetrics.totalResources}
- **Success Rate:** ${report.executive.keyMetrics.successRate.toFixed(1)}%
- **Average Cleanup Time:** ${report.executive.keyMetrics.averageCleanupTime.toFixed(0)}ms
- **Leaks Detected:** ${report.executive.keyMetrics.leaksDetected}

### Alerts
${report.analysis.systemHealth.alerts.map(alert => `- **${alert.level.toUpperCase()}:** ${alert.message}`).join('\n')}

### Recommendations
${report.executive.nextSteps.map(step => `- ${step}`).join('\n')}

## Detailed Analysis

### Resource Utilization
${Object.entries(report.metrics.cleanup.resourceTypeStats).map(([type, stats]) => 
  `- **${type}:** ${stats.count} resources, ${stats.errors} errors`
).join('\n')}

### Performance Metrics
- **Average Time:** ${report.metrics.performance.averageCleanupTime.toFixed(0)}ms
- **Success Rate:** ${report.metrics.performance.successRate.toFixed(1)}%
- **Total Operations:** ${report.metrics.performance.totalOperations}
    `;
  }

  private generateCSVReport(report: ComprehensiveReport): string {
    const headers = ['Timestamp', 'Resource Type', 'Action', 'Duration', 'Success', 'Error'];
    const rows = report.details.logEntries.map(entry => [
      new Date(entry.timestamp).toISOString(),
      entry.resourceType,
      entry.action,
      entry.duration || '',
      entry.error ? 'false' : 'true',
      entry.error || ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private getStatusColor(status: string): string {
    const colors = {
      excellent: '#4CAF50',
      good: '#8BC34A',
      fair: '#FF9800',
      poor: '#F44336',
      critical: '#D32F2F'
    };
    return colors[status as keyof typeof colors] || '#666';
  }
}

// Type definitions for report generation
export interface ReportOptions {
  testSuite?: string;
  environment?: string;
  includeLogEntries?: boolean;
  includeVisualization?: boolean;
}

export interface ComprehensiveReport {
  metadata: ReportMetadata;
  executive: ExecutiveSummary;
  metrics: MetricsSection;
  analysis: AnalysisSection;
  details: DetailsSection;
  visualizations: VisualizationData;
}

export interface ReportMetadata {
  timestamp: number;
  generatedBy: string;
  version: string;
  testSuite: string;
  environment: string;
}

export interface ExecutiveSummary {
  overallStatus: string;
  keyMetrics: {
    totalResources: number;
    successRate: number;
    averageCleanupTime: number;
    leaksDetected: number;
  };
  criticalFindings: string[];
  riskAssessment: {
    jestHangRisk: 'low' | 'high';
    performanceRisk: 'low' | 'medium' | 'high';
    stabilityRisk: 'low' | 'medium' | 'high' | 'critical';
  };
  actionRequired: boolean;
  nextSteps: string[];
}

export interface MetricsSection {
  cleanup: CleanupMetrics;
  performance: PerformanceReport;
  handles: {
    total: number;
    baseline: number;
    leaks: number;
    growth: number;
  };
}

export interface AnalysisSection {
  systemHealth: SystemHealthReport;
  patterns: any;
  predictions: any[];
  recommendations: PrioritizedRecommendation[];
}

export interface DetailsSection {
  logEntries: CleanupLogEntry[];
  handleDetails: any;
  diagnosticSessions: any[];
}

export interface VisualizationData {
  resourceDistribution: ChartData;
  performanceTrend: ChartData;
  errorDistribution: ChartData;
  handleGrowth: ChartData;
}

export interface ChartData {
  type: 'pie' | 'line' | 'bar' | 'area';
  data: Array<{
    label: string;
    value: number;
    color?: string;
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
  };
  alerts: any[];
  recommendations: string[];
  wouldJestHang: boolean;
  exitCode: number;
}

export interface PerformanceAnalysisReport {
  timestamp: number;
  overview: {
    totalOperations: number;
    successRate: number;
    averageTime: number;
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  timing: any;
  bottlenecks: PerformanceBottleneck[];
  optimization: any[];
  trends: TrendAnalysis;
  benchmarks: PerformanceBenchmark[];
}

export interface LeakAnalysisReport {
  timestamp: number;
  summary: {
    totalLeaks: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    jestHangRisk: boolean;
  };
  leakDetails: LeakAnalysis;
  handleAnalysis: {
    current: number;
    baseline: number;
    growth: number;
    leaksByType: Record<string, number>;
  };
  predictions: any[];
  actionPlan: ActionPlanItem[];
  preventionStrategies: PreventionStrategy[];
}

export interface PrioritizedRecommendation {
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  category: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  actions: string[];
}

export interface PerformanceBottleneck {
  type: 'slow_cleanup' | 'high_error_rate' | 'resource_contention';
  resource: ResourceType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
  suggestion: string;
}

export interface TrendAnalysis {
  direction: 'improving' | 'stable' | 'degrading';
  changeRate: number;
  description: string;
}

export interface PerformanceBenchmark {
  metric: string;
  current: number;
  target: number;
  benchmark: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ActionPlanItem {
  priority: 'immediate' | 'high' | 'medium' | 'low';
  action: string;
  description: string;
  steps: string[];
  estimatedTime: string;
}

export interface PreventionStrategy {
  category: string;
  strategy: string;
  implementation: string[];
  benefit: string;
}

export interface DashboardData {
  timestamp: number;
  status: {
    health: string;
    activeResources: number;
    openHandles: number;
    recentErrors: number;
  };
  metrics: {
    successRate: number;
    averageCleanupTime: number;
    errorRate: number;
    handleGrowth: number;
  };
  alerts: any[];
  recentActivity: Array<{
    timestamp: number;
    type: ResourceType;
    action: string;
    success: boolean;
    duration?: number;
  }>;
  charts: {
    resourcesByType: ChartData;
    performanceOverTime: ChartData;
    errorDistribution: ChartData;
  };
}