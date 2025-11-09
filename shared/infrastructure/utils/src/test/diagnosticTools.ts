import { CleanupReport, OpenHandleLeak, ResourceType, CleanupLogEntry } from './types';
import { CleanupLogger, CleanupMetrics, PerformanceReport } from './cleanupLogger';
import { OpenHandleDetector } from './handleDetector';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive Diagnostic Tools for Resource Leak Identification
 * Provides advanced analysis and reporting capabilities for cleanup operations
 */
export class DiagnosticTools {
  private logger: CleanupLogger;
  private handleDetector: OpenHandleDetector;
  private diagnosticHistory: DiagnosticSession[] = [];

  constructor(logger: CleanupLogger, handleDetector: OpenHandleDetector) {
    this.logger = logger;
    this.handleDetector = handleDetector;
  }

  /**
   * Start a new diagnostic session
   */
  startDiagnosticSession(sessionName: string): DiagnosticSession {
    const session: DiagnosticSession = {
      id: this.generateSessionId(),
      name: sessionName,
      startTime: Date.now(),
      endTime: 0,
      initialHandles: this.handleDetector.getHandleReport(),
      finalHandles: null,
      cleanupReports: [],
      leakAnalysis: null,
      performanceAnalysis: null,
      recommendations: []
    };

    this.diagnosticHistory.push(session);
    this.logger.info(`Started diagnostic session: ${sessionName}`, { sessionId: session.id });
    
    return session;
  }

  /**
   * End a diagnostic session and generate comprehensive analysis
   */
  endDiagnosticSession(sessionId: string): DiagnosticAnalysis {
    const session = this.diagnosticHistory.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Diagnostic session ${sessionId} not found`);
    }

    session.endTime = Date.now();
    session.finalHandles = this.handleDetector.getHandleReport();
    
    // Generate comprehensive analysis
    const analysis = this.generateDiagnosticAnalysis(session);
    session.leakAnalysis = analysis.leakAnalysis;
    session.performanceAnalysis = analysis.performanceAnalysis;
    session.recommendations = analysis.recommendations;

    this.logger.info(`Ended diagnostic session: ${session.name}`, { 
      sessionId: session.id,
      duration: session.endTime - session.startTime,
      leaksDetected: analysis.leakAnalysis.totalLeaks
    });

    return analysis;
  }

  /**
   * Analyze resource leaks in detail
   */
  analyzeResourceLeaks(report?: CleanupReport): LeakAnalysis {
    const currentLeaks = this.handleDetector.detectLeaks();
    const handleReport = this.handleDetector.getHandleReport();
    
    const analysis: LeakAnalysis = {
      totalLeaks: currentLeaks.length,
      leaksByType: this.categorizeLeaksByType(currentLeaks),
      severityAssessment: this.assessLeakSeverity(currentLeaks),
      rootCauseAnalysis: this.performRootCauseAnalysis(currentLeaks),
      impactAssessment: this.assessLeakImpact(currentLeaks, handleReport),
      mitigationStrategies: this.generateMitigationStrategies(currentLeaks)
    };

    return analysis;
  }

  /**
   * Generate a comprehensive system health report
   */
  generateSystemHealthReport(): SystemHealthReport {
    const metrics = this.logger.getMetrics();
    const performanceReport = this.logger.generatePerformanceReport();
    const handleReport = this.handleDetector.getHandleReport();
    const leakAnalysis = this.analyzeResourceLeaks();

    return {
      timestamp: Date.now(),
      overallHealth: this.calculateOverallHealth(metrics, leakAnalysis),
      resourceUtilization: this.analyzeResourceUtilization(metrics),
      performanceMetrics: performanceReport,
      leakStatus: leakAnalysis,
      handleStatus: {
        total: handleReport.total,
        baseline: handleReport.baseline,
        growth: handleReport.total - handleReport.baseline,
        growthRate: handleReport.baseline > 0 ? ((handleReport.total - handleReport.baseline) / handleReport.baseline) * 100 : 0
      },
      recommendations: this.generateSystemRecommendations(metrics, leakAnalysis, performanceReport),
      alerts: this.generateSystemAlerts(metrics, leakAnalysis)
    };
  }

  /**
   * Perform deep analysis of cleanup patterns
   */
  analyzeCleanupPatterns(): CleanupPatternAnalysis {
    const logEntries = this.logger.getLogEntries();
    
    return {
      commonFailurePatterns: this.identifyFailurePatterns(logEntries),
      resourceLifecycleAnalysis: this.analyzeResourceLifecycles(logEntries),
      timingAnalysis: this.analyzeCleanupTiming(logEntries),
      concurrencyAnalysis: this.analyzeConcurrencyPatterns(logEntries),
      optimizationOpportunities: this.identifyOptimizationOpportunities(logEntries)
    };
  }

  /**
   * Generate leak prediction based on historical data
   */
  predictPotentialLeaks(): LeakPrediction[] {
    const logEntries = this.logger.getLogEntries();
    const patterns = this.analyzeCleanupPatterns();
    
    const predictions: LeakPrediction[] = [];
    
    // Analyze patterns that often lead to leaks
    patterns.commonFailurePatterns.forEach(pattern => {
      if (pattern.frequency > 0.1) { // More than 10% failure rate
        predictions.push({
          resourceType: pattern.resourceType,
          probability: pattern.frequency,
          riskLevel: this.calculateRiskLevel(pattern.frequency),
          description: `High failure rate (${(pattern.frequency * 100).toFixed(1)}%) for ${pattern.resourceType} cleanup`,
          preventionStrategy: this.generatePreventionStrategy(pattern)
        });
      }
    });

    // Analyze resource lifecycle patterns
    patterns.resourceLifecycleAnalysis.forEach(lifecycle => {
      if (lifecycle.averageLifetime > 30000) { // Resources living longer than 30 seconds
        predictions.push({
          resourceType: lifecycle.resourceType,
          probability: 0.3,
          riskLevel: 'medium',
          description: `Long-lived ${lifecycle.resourceType} resources may indicate cleanup issues`,
          preventionStrategy: `Implement more aggressive cleanup timeouts for ${lifecycle.resourceType}`
        });
      }
    });

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Export comprehensive diagnostic data
   */
  exportDiagnosticData(outputPath: string): void {
    const diagnosticData = {
      timestamp: Date.now(),
      sessions: this.diagnosticHistory,
      systemHealth: this.generateSystemHealthReport(),
      cleanupPatterns: this.analyzeCleanupPatterns(),
      leakPredictions: this.predictPotentialLeaks(),
      logEntries: this.logger.getLogEntries(),
      metrics: this.logger.getMetrics()
    };

    try {
      fs.writeFileSync(outputPath, JSON.stringify(diagnosticData, null, 2));
      this.logger.info(`Diagnostic data exported to: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Failed to export diagnostic data`, error as Error, { outputPath });
    }
  }

  /**
   * Generate interactive diagnostic report (HTML format)
   */
  generateInteractiveReport(outputPath: string): void {
    const systemHealth = this.generateSystemHealthReport();
    const patterns = this.analyzeCleanupPatterns();
    const predictions = this.predictPotentialLeaks();

    const htmlContent = this.generateHTMLReport(systemHealth, patterns, predictions);

    try {
      fs.writeFileSync(outputPath, htmlContent);
      this.logger.info(`Interactive diagnostic report generated: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Failed to generate interactive report`, error as Error, { outputPath });
    }
  }

  /**
   * Get diagnostic history
   */
  getDiagnosticHistory(): DiagnosticSession[] {
    return [...this.diagnosticHistory];
  }

  /**
   * Clear diagnostic history
   */
  clearDiagnosticHistory(): void {
    this.diagnosticHistory = [];
    this.logger.info('Diagnostic history cleared');
  }

  private generateSessionId(): string {
    return `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDiagnosticAnalysis(session: DiagnosticSession): DiagnosticAnalysis {
    const leakAnalysis = this.analyzeResourceLeaks();
    const performanceAnalysis = this.logger.generatePerformanceReport();
    
    const recommendations = [
      ...leakAnalysis.mitigationStrategies,
      ...performanceAnalysis.recommendations
    ];

    return {
      sessionId: session.id,
      duration: session.endTime - session.startTime,
      leakAnalysis,
      performanceAnalysis,
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }

  private categorizeLeaksByType(leaks: OpenHandleLeak[]): Record<string, LeakTypeInfo> {
    const categories: Record<string, LeakTypeInfo> = {};

    leaks.forEach(leak => {
      if (!categories[leak.type]) {
        categories[leak.type] = {
          count: 0,
          descriptions: [],
          severity: 'low',
          commonPatterns: []
        };
      }

      categories[leak.type].count++;
      categories[leak.type].descriptions.push(leak.description);
      
      // Determine severity based on type and count
      if (leak.type.includes('Server') || leak.type.includes('Socket')) {
        categories[leak.type].severity = 'high';
      } else if (leak.type.includes('Timer') || leak.type.includes('Timeout')) {
        categories[leak.type].severity = 'medium';
      }
    });

    // Identify common patterns
    Object.values(categories).forEach(category => {
      category.commonPatterns = this.identifyCommonPatterns(category.descriptions);
    });

    return categories;
  }

  private assessLeakSeverity(leaks: OpenHandleLeak[]): 'low' | 'medium' | 'high' | 'critical' {
    if (leaks.length === 0) return 'low';
    if (leaks.length > 20) return 'critical';
    if (leaks.length > 10) return 'high';
    if (leaks.length > 5) return 'medium';
    
    // Check for high-severity leak types
    const highSeverityTypes = ['Server', 'Socket', 'Database', 'Process'];
    const hasHighSeverityLeaks = leaks.some(leak => 
      highSeverityTypes.some(type => leak.type.includes(type))
    );
    
    return hasHighSeverityLeaks ? 'high' : 'medium';
  }

  private performRootCauseAnalysis(leaks: OpenHandleLeak[]): RootCauseAnalysis[] {
    const analyses: RootCauseAnalysis[] = [];
    
    // Group leaks by common patterns
    const leakGroups = this.groupLeaksByPattern(leaks);
    
    leakGroups.forEach(group => {
      const analysis: RootCauseAnalysis = {
        pattern: group.pattern,
        affectedResources: group.leaks.length,
        likelyCause: this.determineLikelyCause(group),
        confidence: this.calculateConfidence(group),
        suggestedFix: this.suggestFix(group)
      };
      
      analyses.push(analysis);
    });

    return analyses.sort((a, b) => b.confidence - a.confidence);
  }

  private assessLeakImpact(leaks: OpenHandleLeak[], handleReport: any): LeakImpact {
    const memoryImpact = this.estimateMemoryImpact(leaks);
    const performanceImpact = this.estimatePerformanceImpact(leaks);
    const stabilityRisk = this.assessStabilityRisk(leaks, handleReport);

    return {
      memoryUsage: memoryImpact,
      performanceDegradation: performanceImpact,
      stabilityRisk,
      jestExitRisk: this.handleDetector.wouldJestDetectHandles() ? 'high' : 'low',
      cicdImpact: stabilityRisk === 'high' ? 'pipeline_failures' : 'none'
    };
  }

  private generateMitigationStrategies(leaks: OpenHandleLeak[]): string[] {
    const strategies: string[] = [];
    const leaksByType = this.categorizeLeaksByType(leaks);

    Object.entries(leaksByType).forEach(([type, info]) => {
      switch (type) {
        case 'Server':
          strategies.push('Implement proper server.close() calls in afterAll hooks');
          strategies.push('Add timeout-based forced server shutdown');
          break;
        case 'Socket':
          strategies.push('Ensure all socket connections are properly closed');
          strategies.push('Implement connection pooling with automatic cleanup');
          break;
        case 'Timer':
        case 'Timeout':
          strategies.push('Use jest.useFakeTimers() to avoid real timer leaks');
          strategies.push('Implement comprehensive timer tracking and cleanup');
          break;
        case 'Database':
          strategies.push('Ensure database connections are closed in cleanup hooks');
          strategies.push('Use connection pooling with proper lifecycle management');
          break;
        default:
          strategies.push(`Review ${type} resource cleanup implementation`);
      }
    });

    return [...new Set(strategies)];
  }

  private calculateOverallHealth(metrics: CleanupMetrics, leakAnalysis: LeakAnalysis): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    let score = 100;

    // Deduct points for errors
    score -= metrics.errorRate * 2;

    // Deduct points for leaks
    score -= leakAnalysis.totalLeaks * 5;

    // Deduct points for poor performance
    if (metrics.averageCleanupTime > 5000) score -= 20;
    if (metrics.averageCleanupTime > 10000) score -= 30;

    // Deduct points for severity
    switch (leakAnalysis.severityAssessment) {
      case 'critical': score -= 50; break;
      case 'high': score -= 30; break;
      case 'medium': score -= 15; break;
      case 'low': score -= 5; break;
    }

    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  private analyzeResourceUtilization(metrics: CleanupMetrics): ResourceUtilization {
    const utilization: ResourceUtilization = {
      totalResources: metrics.totalOperations,
      resourcesByType: {} as Record<ResourceType, { count: number; efficiency: number; averageCleanupTime: number; errorRate: number; }>,
      utilizationEfficiency: 0,
      bottlenecks: []
    };

    Object.entries(metrics.resourceTypeStats).forEach(([type, stats]) => {
      const efficiency = stats.count > 0 ? ((stats.count - stats.errors) / stats.count) * 100 : 100;
      const avgTime = stats.count > 0 ? stats.totalTime / stats.count : 0;

      utilization.resourcesByType[type as ResourceType] = {
        count: stats.count,
        efficiency,
        averageCleanupTime: avgTime,
        errorRate: stats.count > 0 ? (stats.errors / stats.count) * 100 : 0
      };

      // Identify bottlenecks
      if (avgTime > 3000) {
        utilization.bottlenecks.push(`${type} cleanup is slow (${avgTime.toFixed(0)}ms average)`);
      }
      if (efficiency < 80) {
        utilization.bottlenecks.push(`${type} has high error rate (${(100 - efficiency).toFixed(1)}%)`);
      }
    });

    utilization.utilizationEfficiency = metrics.totalOperations > 0 
      ? (metrics.successfulOperations / metrics.totalOperations) * 100 
      : 100;

    return utilization;
  }

  private generateSystemRecommendations(
    metrics: CleanupMetrics, 
    leakAnalysis: LeakAnalysis, 
    performanceReport: PerformanceReport
  ): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (metrics.averageCleanupTime > 5000) {
      recommendations.push('Optimize cleanup timeouts - current average is too high');
    }

    // Error rate recommendations
    if (metrics.errorRate > 10) {
      recommendations.push('Investigate and fix high cleanup error rate');
    }

    // Leak recommendations
    if (leakAnalysis.totalLeaks > 0) {
      recommendations.push(...leakAnalysis.mitigationStrategies);
    }

    // Resource-specific recommendations
    Object.entries(metrics.resourceTypeStats).forEach(([type, stats]) => {
      const errorRate = stats.count > 0 ? (stats.errors / stats.count) * 100 : 0;
      if (errorRate > 20) {
        recommendations.push(`Review ${type} cleanup implementation - high error rate detected`);
      }
    });

    return [...new Set(recommendations)];
  }

  private generateSystemAlerts(metrics: CleanupMetrics, leakAnalysis: LeakAnalysis): SystemAlert[] {
    const alerts: SystemAlert[] = [];

    // Critical alerts
    if (leakAnalysis.severityAssessment === 'critical') {
      alerts.push({
        level: 'critical',
        message: `Critical resource leaks detected (${leakAnalysis.totalLeaks} leaks)`,
        action: 'Immediate investigation required'
      });
    }

    // High error rate alert
    if (metrics.errorRate > 25) {
      alerts.push({
        level: 'error',
        message: `High cleanup error rate: ${metrics.errorRate.toFixed(1)}%`,
        action: 'Review cleanup implementations'
      });
    }

    // Performance alerts
    if (metrics.averageCleanupTime > 10000) {
      alerts.push({
        level: 'warning',
        message: `Slow cleanup performance: ${metrics.averageCleanupTime.toFixed(0)}ms average`,
        action: 'Optimize cleanup timeouts and logic'
      });
    }

    // Jest hanging risk
    if (this.handleDetector.wouldJestDetectHandles()) {
      alerts.push({
        level: 'error',
        message: 'Jest may hang due to open handles',
        action: 'Review and fix resource leaks'
      });
    }

    return alerts;
  }

  // Helper methods for pattern analysis
  private identifyFailurePatterns(logEntries: CleanupLogEntry[]): FailurePattern[] {
    const patterns: Record<string, { count: number; total: number }> = {};

    logEntries.forEach(entry => {
      if (entry.action === 'cleanup') {
        const key = entry.resourceType;
        if (!patterns[key]) {
          patterns[key] = { count: 0, total: 0 };
        }
        patterns[key].total++;
        if (entry.error) {
          patterns[key].count++;
        }
      }
    });

    return Object.entries(patterns).map(([resourceType, stats]) => ({
      resourceType: resourceType as ResourceType,
      frequency: stats.total > 0 ? stats.count / stats.total : 0,
      occurrences: stats.count,
      description: `${resourceType} cleanup failures`
    }));
  }

  private analyzeResourceLifecycles(logEntries: CleanupLogEntry[]): ResourceLifecycle[] {
    const lifecycles: Record<string, { created: number; cleaned: number; totalLifetime: number; count: number }> = {};

    logEntries.forEach(entry => {
      const key = entry.resourceType;
      if (!lifecycles[key]) {
        lifecycles[key] = { created: 0, cleaned: 0, totalLifetime: 0, count: 0 };
      }

      if (entry.action === 'register') {
        lifecycles[key].created = entry.timestamp;
      } else if (entry.action === 'cleanup' && lifecycles[key].created > 0) {
        const lifetime = entry.timestamp - lifecycles[key].created;
        lifecycles[key].totalLifetime += lifetime;
        lifecycles[key].count++;
      }
    });

    return Object.entries(lifecycles).map(([resourceType, stats]) => ({
      resourceType: resourceType as ResourceType,
      averageLifetime: stats.count > 0 ? stats.totalLifetime / stats.count : 0,
      totalResources: stats.count,
      pattern: stats.count > 0 ? (stats.totalLifetime / stats.count > 10000 ? 'long-lived' : 'short-lived') : 'unknown'
    }));
  }

  private analyzeCleanupTiming(logEntries: CleanupLogEntry[]): TimingAnalysis {
    const cleanupEntries = logEntries.filter(e => e.action === 'cleanup' && e.duration);
    
    if (cleanupEntries.length === 0) {
      return {
        averageTime: 0,
        medianTime: 0,
        p95Time: 0,
        slowestOperations: [],
        timingDistribution: {}
      };
    }

    const durations = cleanupEntries.map(e => e.duration!).sort((a, b) => a - b);
    const average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const median = durations[Math.floor(durations.length / 2)];
    const p95 = durations[Math.floor(durations.length * 0.95)];

    const slowest = cleanupEntries
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5)
      .map(e => ({
        resourceId: e.resourceId,
        resourceType: e.resourceType,
        duration: e.duration || 0
      }));

    return {
      averageTime: average,
      medianTime: median,
      p95Time: p95,
      slowestOperations: slowest,
      timingDistribution: this.createTimingDistribution(durations)
    };
  }

  private analyzeConcurrencyPatterns(logEntries: CleanupLogEntry[]): ConcurrencyAnalysis {
    // Simplified concurrency analysis
    const cleanupEntries = logEntries.filter(e => e.action === 'cleanup');
    const maxConcurrent = Math.max(1, Math.ceil(cleanupEntries.length / 10));
    
    return {
      maxConcurrentOperations: maxConcurrent,
      averageConcurrency: Math.ceil(cleanupEntries.length / 20),
      concurrencyBottlenecks: [],
      resourceContention: []
    };
  }

  private identifyOptimizationOpportunities(logEntries: CleanupLogEntry[]): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];
    
    // Analyze for common optimization patterns
    const slowResources = logEntries
      .filter(e => e.action === 'cleanup' && e.duration && e.duration > 3000)
      .reduce((acc, entry) => {
        acc[entry.resourceType] = (acc[entry.resourceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    Object.entries(slowResources).forEach(([type, count]) => {
      if (count > 2) {
        opportunities.push({
          type: 'performance',
          description: `${type} resources consistently slow to cleanup`,
          impact: 'medium',
          effort: 'low',
          recommendation: `Optimize ${type} cleanup timeouts or implement parallel cleanup`
        });
      }
    });

    return opportunities;
  }

  // Additional helper methods
  private identifyCommonPatterns(descriptions: string[]): string[] {
    // Simple pattern identification - could be enhanced with more sophisticated analysis
    const patterns: Record<string, number> = {};
    
    descriptions.forEach(desc => {
      const words = desc.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          patterns[word] = (patterns[word] || 0) + 1;
        }
      });
    });

    return Object.entries(patterns)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pattern]) => pattern);
  }

  private groupLeaksByPattern(leaks: OpenHandleLeak[]): Array<{ pattern: string; leaks: OpenHandleLeak[] }> {
    const groups: Record<string, OpenHandleLeak[]> = {};
    
    leaks.forEach(leak => {
      const pattern = `${leak.type}:${leak.description.split(' ')[0]}`;
      if (!groups[pattern]) {
        groups[pattern] = [];
      }
      groups[pattern].push(leak);
    });

    return Object.entries(groups).map(([pattern, leaks]) => ({ pattern, leaks }));
  }

  private determineLikelyCause(group: { pattern: string; leaks: OpenHandleLeak[] }): string {
    const type = group.pattern.split(':')[0];
    
    switch (type) {
      case 'Server':
        return 'Server not properly closed in test cleanup';
      case 'Socket':
        return 'Network connection not terminated';
      case 'Timer':
        return 'Timer not cleared after test completion';
      case 'Database':
        return 'Database connection not closed';
      default:
        return 'Resource cleanup not implemented or failing';
    }
  }

  private calculateConfidence(group: { pattern: string; leaks: OpenHandleLeak[] }): number {
    // Higher confidence for more instances of the same pattern
    return Math.min(0.9, 0.3 + (group.leaks.length * 0.1));
  }

  private suggestFix(group: { pattern: string; leaks: OpenHandleLeak[] }): string {
    const type = group.pattern.split(':')[0];
    
    switch (type) {
      case 'Server':
        return 'Add server.close() call in afterAll hook with proper error handling';
      case 'Socket':
        return 'Implement socket.destroy() or socket.end() in cleanup';
      case 'Timer':
        return 'Use clearTimeout/clearInterval or jest.useFakeTimers()';
      case 'Database':
        return 'Ensure connection.close() is called in cleanup hooks';
      default:
        return 'Implement proper cleanup method for this resource type';
    }
  }

  private estimateMemoryImpact(leaks: OpenHandleLeak[]): 'low' | 'medium' | 'high' {
    if (leaks.length === 0) return 'low';
    if (leaks.length > 15) return 'high';
    if (leaks.length > 5) return 'medium';
    return 'low';
  }

  private estimatePerformanceImpact(leaks: OpenHandleLeak[]): 'low' | 'medium' | 'high' {
    const highImpactTypes = ['Server', 'Database', 'Socket'];
    const hasHighImpactLeaks = leaks.some(leak => 
      highImpactTypes.some(type => leak.type.includes(type))
    );
    
    if (hasHighImpactLeaks && leaks.length > 5) return 'high';
    if (hasHighImpactLeaks || leaks.length > 10) return 'medium';
    return 'low';
  }

  private assessStabilityRisk(leaks: OpenHandleLeak[], handleReport: any): 'low' | 'medium' | 'high' {
    const growthRate = handleReport.baseline > 0 
      ? ((handleReport.total - handleReport.baseline) / handleReport.baseline) * 100 
      : 0;
    
    if (growthRate > 200 || leaks.length > 20) return 'high';
    if (growthRate > 100 || leaks.length > 10) return 'medium';
    return 'low';
  }

  private calculateRiskLevel(probability: number): 'low' | 'medium' | 'high' {
    if (probability > 0.3) return 'high';
    if (probability > 0.1) return 'medium';
    return 'low';
  }

  private generatePreventionStrategy(pattern: FailurePattern): string {
    return `Implement robust error handling and retry logic for ${pattern.resourceType} cleanup operations`;
  }

  private createTimingDistribution(durations: number[]): Record<string, number> {
    const buckets = {
      '0-100ms': 0,
      '100-500ms': 0,
      '500ms-1s': 0,
      '1s-5s': 0,
      '5s+': 0
    };

    durations.forEach(duration => {
      if (duration <= 100) buckets['0-100ms']++;
      else if (duration <= 500) buckets['100-500ms']++;
      else if (duration <= 1000) buckets['500ms-1s']++;
      else if (duration <= 5000) buckets['1s-5s']++;
      else buckets['5s+']++;
    });

    return buckets;
  }

  private generateHTMLReport(
    systemHealth: SystemHealthReport,
    patterns: CleanupPatternAnalysis,
    predictions: LeakPrediction[]
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Resource Cleanup Diagnostic Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .health-${systemHealth.overallHealth} { color: ${this.getHealthColor(systemHealth.overallHealth)}; }
        .alert-critical { background: #ffebee; border-left: 4px solid #f44336; padding: 10px; }
        .alert-error { background: #fff3e0; border-left: 4px solid #ff9800; padding: 10px; }
        .alert-warning { background: #f3e5f5; border-left: 4px solid #9c27b0; padding: 10px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Resource Cleanup Diagnostic Report</h1>
    <p>Generated: ${new Date().toISOString()}</p>
    
    <h2>System Health: <span class="health-${systemHealth.overallHealth}">${systemHealth.overallHealth.toUpperCase()}</span></h2>
    
    <h3>Alerts</h3>
    ${systemHealth.alerts.map(alert => `
        <div class="alert-${alert.level}">
            <strong>${alert.level.toUpperCase()}:</strong> ${alert.message}<br>
            <em>Action: ${alert.action}</em>
        </div>
    `).join('')}
    
    <h3>Resource Utilization</h3>
    <table>
        <tr><th>Resource Type</th><th>Count</th><th>Efficiency</th><th>Avg Cleanup Time</th><th>Error Rate</th></tr>
        ${Object.entries(systemHealth.resourceUtilization.resourcesByType).map(([type, stats]) => `
            <tr>
                <td>${type}</td>
                <td>${stats.count}</td>
                <td>${stats.efficiency.toFixed(1)}%</td>
                <td>${stats.averageCleanupTime.toFixed(0)}ms</td>
                <td>${stats.errorRate.toFixed(1)}%</td>
            </tr>
        `).join('')}
    </table>
    
    <h3>Leak Predictions</h3>
    ${predictions.length > 0 ? `
        <table>
            <tr><th>Resource Type</th><th>Probability</th><th>Risk Level</th><th>Description</th></tr>
            ${predictions.map(pred => `
                <tr>
                    <td>${pred.resourceType}</td>
                    <td>${(pred.probability * 100).toFixed(1)}%</td>
                    <td>${pred.riskLevel}</td>
                    <td>${pred.description}</td>
                </tr>
            `).join('')}
        </table>
    ` : '<p>No leak predictions at this time.</p>'}
    
    <h3>Recommendations</h3>
    <ul>
        ${systemHealth.recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>
</body>
</html>
    `;
  }

  private getHealthColor(health: string): string {
    switch (health) {
      case 'excellent': return '#4caf50';
      case 'good': return '#8bc34a';
      case 'fair': return '#ff9800';
      case 'poor': return '#f44336';
      case 'critical': return '#d32f2f';
      default: return '#666';
    }
  }
}

// Type definitions for diagnostic tools
export interface DiagnosticSession {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  initialHandles: any;
  finalHandles: any;
  cleanupReports: CleanupReport[];
  leakAnalysis: LeakAnalysis | null;
  performanceAnalysis: PerformanceReport | null;
  recommendations: string[];
}

export interface DiagnosticAnalysis {
  sessionId: string;
  duration: number;
  leakAnalysis: LeakAnalysis;
  performanceAnalysis: PerformanceReport;
  recommendations: string[];
}

export interface LeakAnalysis {
  totalLeaks: number;
  leaksByType: Record<string, LeakTypeInfo>;
  severityAssessment: 'low' | 'medium' | 'high' | 'critical';
  rootCauseAnalysis: RootCauseAnalysis[];
  impactAssessment: LeakImpact;
  mitigationStrategies: string[];
}

export interface LeakTypeInfo {
  count: number;
  descriptions: string[];
  severity: 'low' | 'medium' | 'high';
  commonPatterns: string[];
}

export interface RootCauseAnalysis {
  pattern: string;
  affectedResources: number;
  likelyCause: string;
  confidence: number;
  suggestedFix: string;
}

export interface LeakImpact {
  memoryUsage: 'low' | 'medium' | 'high';
  performanceDegradation: 'low' | 'medium' | 'high';
  stabilityRisk: 'low' | 'medium' | 'high';
  jestExitRisk: 'low' | 'high';
  cicdImpact: 'none' | 'pipeline_failures';
}

export interface SystemHealthReport {
  timestamp: number;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  resourceUtilization: ResourceUtilization;
  performanceMetrics: PerformanceReport;
  leakStatus: LeakAnalysis;
  handleStatus: {
    total: number;
    baseline: number;
    growth: number;
    growthRate: number;
  };
  recommendations: string[];
  alerts: SystemAlert[];
}

export interface ResourceUtilization {
  totalResources: number;
  resourcesByType: Record<ResourceType, {
    count: number;
    efficiency: number;
    averageCleanupTime: number;
    errorRate: number;
  }>;
  utilizationEfficiency: number;
  bottlenecks: string[];
}

export interface SystemAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  action: string;
}

export interface CleanupPatternAnalysis {
  commonFailurePatterns: FailurePattern[];
  resourceLifecycleAnalysis: ResourceLifecycle[];
  timingAnalysis: TimingAnalysis;
  concurrencyAnalysis: ConcurrencyAnalysis;
  optimizationOpportunities: OptimizationOpportunity[];
}

export interface FailurePattern {
  resourceType: ResourceType;
  frequency: number;
  occurrences: number;
  description: string;
}

export interface ResourceLifecycle {
  resourceType: ResourceType;
  averageLifetime: number;
  totalResources: number;
  pattern: 'short-lived' | 'long-lived' | 'unknown';
}

export interface TimingAnalysis {
  averageTime: number;
  medianTime: number;
  p95Time: number;
  slowestOperations: Array<{
    resourceId: string;
    resourceType: ResourceType;
    duration: number;
  }>;
  timingDistribution: Record<string, number>;
}

export interface ConcurrencyAnalysis {
  maxConcurrentOperations: number;
  averageConcurrency: number;
  concurrencyBottlenecks: string[];
  resourceContention: string[];
}

export interface OptimizationOpportunity {
  type: 'performance' | 'reliability' | 'maintainability';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface LeakPrediction {
  resourceType: ResourceType;
  probability: number;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  preventionStrategy: string;
}