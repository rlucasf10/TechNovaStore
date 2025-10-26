/**
 * Dashboard System for CI/CD Monitoring
 * Provides real-time monitoring dashboards and CI/CD integration
 */

import { CleanupConfig, ResourceType } from './types';
import { AdvancedMetricsSystem, PerformanceMetrics, CollectedMetrics, DashboardData, CISummaryReport } from './metricsSystem';
import { AlertingSystem, AlertReport } from './alertingSystem';
import { CleanupLogger } from './cleanupLogger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Dashboard System for monitoring resource cleanup operations
 */
export class DashboardSystem {
  private webServer?: any;
  private dashboardData: DashboardData | null = null;
  private updateInterval?: NodeJS.Timeout;
  private config: CleanupConfig;

  constructor(
    config: CleanupConfig,
    private metricsSystem: AdvancedMetricsSystem,
    private alertingSystem: AlertingSystem,
    private logger: CleanupLogger
  ) {
    this.config = config;
  }

  /**
   * Start the dashboard system
   */
  async start(): Promise<void> {
    // Generate initial dashboard data
    this.updateDashboard();

    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      this.updateDashboard();
    }, 30000); // Update every 30 seconds

    // Start web server if in development mode
    if (this.config.environment === 'development') {
      await this.startWebServer();
    }

    // Generate static dashboard files for CI
    if (this.config.environment === 'ci') {
      await this.generateStaticDashboard();
    }

    this.logger.info('Dashboard system started', {
      environment: this.config.environment,
      updateInterval: 30000
    });
  }

  /**
   * Stop the dashboard system
   */
  async stop(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }

    if (this.webServer) {
      await this.stopWebServer();
    }

    this.logger.info('Dashboard system stopped');
  }

  /**
   * Generate CI/CD dashboard report
   */
  async generateCIDashboard(): Promise<CIDashboardReport> {
    const ciSummary = this.metricsSystem.generateCISummary();
    const alertReport = this.alertingSystem.generateAlertReport();
    const dashboardData = this.metricsSystem.generateDashboardData();

    const report: CIDashboardReport = {
      timestamp: Date.now(),
      environment: this.config.environment || 'unknown',
      status: ciSummary.status,
      summary: {
        ...ciSummary.summary,
        overallHealth: dashboardData.status,
        alertsActive: alertReport.summary.criticalActive
      },
      metrics: {
        performance: this.metricsSystem.getPerformanceMetrics(),
        alerts: alertReport,
        dashboard: dashboardData
      },
      recommendations: [
        ...ciSummary.recommendations,
        ...alertReport.recommendations
      ].slice(0, 5), // Top 5 recommendations
      artifacts: await this.generateCIArtifacts()
    };

    // Write CI dashboard to file
    await this.writeCIDashboard(report);

    return report;
  }

  /**
   * Generate real-time monitoring data
   */
  getRealtimeData(): RealtimeMonitoringData {
    const dashboardData = this.metricsSystem.generateDashboardData();
    const alertStats = this.alertingSystem.getAlertStatistics();

    return {
      timestamp: Date.now(),
      status: dashboardData.status,
      metrics: {
        totalOperations: dashboardData.summary.totalOperations,
        successRate: dashboardData.summary.successRate,
        errorRate: dashboardData.summary.errorRate,
        averageResponseTime: dashboardData.summary.averageResponseTime,
        activeHandles: dashboardData.summary.activeHandles,
        leaksDetected: dashboardData.summary.leaksDetected
      },
      alerts: {
        active: alertStats.last24Hours,
        critical: alertStats.bySeverity.critical || 0,
        high: alertStats.bySeverity.high || 0,
        trends: alertStats.trends
      },
      charts: dashboardData.charts,
      lastUpdate: Date.now()
    };
  }

  /**
   * Export dashboard data for external tools
   */
  async exportDashboardData(format: 'json' | 'html' | 'markdown', outputPath: string): Promise<void> {
    const data = this.getRealtimeData();
    let content: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'html':
        content = this.generateHTMLDashboard(data);
        break;
      case 'markdown':
        content = this.generateMarkdownDashboard(data);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content);
    this.logger.info(`Dashboard exported to: ${outputPath}`, { format });
  }

  private updateDashboard(): void {
    try {
      this.dashboardData = this.metricsSystem.generateDashboardData();
    } catch (error) {
      this.logger.error('Failed to update dashboard data', error as Error);
    }
  }

  private async startWebServer(): Promise<void> {
    // In a real implementation, this would start an Express server
    // For now, we'll just log that it would start
    this.logger.info('Web dashboard would start on http://localhost:3001/dashboard');
  }

  private async stopWebServer(): Promise<void> {
    if (this.webServer) {
      // Close web server
      this.webServer = undefined;
      this.logger.info('Web dashboard stopped');
    }
  }

  private async generateStaticDashboard(): Promise<void> {
    const outputDir = path.join(process.cwd(), 'dashboard-output');
    
    // Generate HTML dashboard
    await this.exportDashboardData('html', path.join(outputDir, 'dashboard.html'));
    
    // Generate JSON data for external tools
    await this.exportDashboardData('json', path.join(outputDir, 'dashboard-data.json'));
    
    // Generate markdown report
    await this.exportDashboardData('markdown', path.join(outputDir, 'dashboard-report.md'));

    this.logger.info('Static dashboard files generated', { outputDir });
  }

  private async generateCIArtifacts(): Promise<CIArtifact[]> {
    const artifacts: CIArtifact[] = [];
    const outputDir = path.join(process.cwd(), 'ci-artifacts');

    try {
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate metrics export
      const metricsPath = path.join(outputDir, 'metrics.json');
      await this.metricsSystem.exportMetrics('json', metricsPath);
      artifacts.push({
        name: 'Metrics Data',
        path: metricsPath,
        type: 'json',
        description: 'Complete metrics data for analysis'
      });

      // Generate alert data
      const alertsPath = path.join(outputDir, 'alerts.json');
      this.alertingSystem.exportAlertData(alertsPath);
      artifacts.push({
        name: 'Alert Data',
        path: alertsPath,
        type: 'json',
        description: 'Alert history and patterns'
      });

      // Generate Prometheus metrics
      const prometheusPath = path.join(outputDir, 'metrics.prom');
      await this.metricsSystem.exportMetrics('prometheus', prometheusPath);
      artifacts.push({
        name: 'Prometheus Metrics',
        path: prometheusPath,
        type: 'prometheus',
        description: 'Metrics in Prometheus format'
      });

      // Generate CSV report
      const csvPath = path.join(outputDir, 'metrics.csv');
      await this.metricsSystem.exportMetrics('csv', csvPath);
      artifacts.push({
        name: 'CSV Report',
        path: csvPath,
        type: 'csv',
        description: 'Metrics data in CSV format'
      });

    } catch (error) {
      this.logger.error('Failed to generate CI artifacts', error as Error);
    }

    return artifacts;
  }

  private async writeCIDashboard(report: CIDashboardReport): Promise<void> {
    const outputPath = path.join(process.cwd(), 'ci-dashboard.json');
    
    try {
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      
      // Also write a simple status file for CI tools
      const statusPath = path.join(process.cwd(), 'cleanup-status.txt');
      const statusContent = [
        `Status: ${report.status.toUpperCase()}`,
        `Success Rate: ${report.summary.successRate.toFixed(1)}%`,
        `Error Rate: ${report.summary.errorRate.toFixed(1)}%`,
        `Leaks Detected: ${report.summary.leaksDetected}`,
        `Active Alerts: ${report.summary.alertsActive}`,
        `Exit Code: ${report.metrics.performance.errorRate > 50 ? 1 : 0}`
      ].join('\n');
      
      fs.writeFileSync(statusPath, statusContent);
      
      this.logger.info('CI dashboard written', { outputPath, statusPath });
    } catch (error) {
      this.logger.error('Failed to write CI dashboard', error as Error);
    }
  }

  private generateHTMLDashboard(data: RealtimeMonitoringData): string {
    const statusColor = this.getStatusColor(data.status);
    const chartScripts = this.generateChartScripts(data.charts);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resource Cleanup Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 20px; background: #f5f5f5;
        }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status { font-size: 24px; font-weight: bold; color: ${statusColor}; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 32px; font-weight: bold; color: #333; }
        .metric-label { color: #666; font-size: 14px; margin-top: 5px; }
        .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .chart-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .alert-section { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .alert-critical { border-left: 4px solid #f44336; }
        .alert-high { border-left: 4px solid #ff9800; }
        .timestamp { color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>Resource Cleanup Dashboard</h1>
            <div class="status">Status: ${data.status.toUpperCase()}</div>
            <div class="timestamp">Last Updated: ${new Date(data.timestamp).toLocaleString()}</div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${data.metrics.totalOperations}</div>
                <div class="metric-label">Total Operations</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.metrics.successRate.toFixed(1)}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.metrics.errorRate.toFixed(1)}%</div>
                <div class="metric-label">Error Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.metrics.averageResponseTime.toFixed(0)}ms</div>
                <div class="metric-label">Avg Response Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.metrics.leaksDetected}</div>
                <div class="metric-label">Leaks Detected</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.alerts.active}</div>
                <div class="metric-label">Active Alerts</div>
            </div>
        </div>

        <div class="charts-grid">
            <div class="chart-container">
                <h3>Performance Trend</h3>
                <canvas id="performanceChart"></canvas>
            </div>
            <div class="chart-container">
                <h3>Resource Distribution</h3>
                <canvas id="resourceChart"></canvas>
            </div>
            <div class="chart-container">
                <h3>Error Rate</h3>
                <canvas id="errorChart"></canvas>
            </div>
            <div class="chart-container">
                <h3>Handle Growth</h3>
                <canvas id="handleChart"></canvas>
            </div>
        </div>

        <div class="alert-section">
            <h3>Alert Summary</h3>
            <p>Critical: ${data.alerts.critical} | High: ${data.alerts.high} | Trend: ${data.alerts.trends.direction}</p>
        </div>
    </div>

    <script>
        ${chartScripts}
        
        // Auto-refresh every 30 seconds
        setTimeout(() => {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>
    `;
  }

  private generateMarkdownDashboard(data: RealtimeMonitoringData): string {
    return `
# Resource Cleanup Dashboard

**Status:** ${data.status.toUpperCase()}  
**Last Updated:** ${new Date(data.timestamp).toLocaleString()}

## Summary Metrics

| Metric | Value |
|--------|-------|
| Total Operations | ${data.metrics.totalOperations} |
| Success Rate | ${data.metrics.successRate.toFixed(1)}% |
| Error Rate | ${data.metrics.errorRate.toFixed(1)}% |
| Average Response Time | ${data.metrics.averageResponseTime.toFixed(0)}ms |
| Active Handles | ${data.metrics.activeHandles} |
| Leaks Detected | ${data.metrics.leaksDetected} |

## Alert Status

- **Active Alerts:** ${data.alerts.active}
- **Critical:** ${data.alerts.critical}
- **High:** ${data.alerts.high}
- **Trend:** ${data.alerts.trends.direction}

## Performance Analysis

### Current Status
${this.getStatusDescription(data.status)}

### Key Findings
${data.metrics.errorRate > 10 ? '⚠️ High error rate detected' : '✅ Error rate within acceptable limits'}
${data.metrics.leaksDetected > 0 ? '🔍 Resource leaks detected - investigation needed' : '✅ No resource leaks detected'}
${data.alerts.critical > 0 ? '🚨 Critical alerts active - immediate attention required' : '✅ No critical alerts'}

## Recommendations

${this.generateMarkdownRecommendations(data)}

---
*Generated by Resource Cleanup Dashboard System*
    `;
  }

  private generateChartScripts(charts: any): string {
    // This would generate Chart.js scripts for the charts
    // For brevity, returning a simplified version
    return `
        // Performance Chart
        const performanceCtx = document.getElementById('performanceChart').getContext('2d');
        new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(charts.performanceTrend.data.map((d: any) => d.label))},
                datasets: [{
                    label: 'Response Time (ms)',
                    data: ${JSON.stringify(charts.performanceTrend.data.map((d: any) => d.y || d.value))},
                    borderColor: '#2196F3',
                    tension: 0.1
                }]
            },
            options: { responsive: true }
        });

        // Resource Distribution Chart
        const resourceCtx = document.getElementById('resourceChart').getContext('2d');
        new Chart(resourceCtx, {
            type: 'pie',
            data: {
                labels: ${JSON.stringify(charts.resourceDistribution.data.map((d: any) => d.label))},
                datasets: [{
                    data: ${JSON.stringify(charts.resourceDistribution.data.map((d: any) => d.value))},
                    backgroundColor: ${JSON.stringify(charts.resourceDistribution.data.map((d: any) => d.color))}
                }]
            },
            options: { responsive: true }
        });
    `;
  }

  private getStatusColor(status: string): string {
    const colors = {
      healthy: '#4CAF50',
      warning: '#FF9800',
      critical: '#F44336'
    };
    return colors[status as keyof typeof colors] || '#666';
  }

  private getStatusDescription(status: string): string {
    const descriptions = {
      healthy: 'System is operating normally with no significant issues.',
      warning: 'Some issues detected that require monitoring but are not critical.',
      critical: 'Critical issues detected that require immediate attention.'
    };
    return descriptions[status as keyof typeof descriptions] || 'Status unknown';
  }

  private generateMarkdownRecommendations(data: RealtimeMonitoringData): string {
    const recommendations: string[] = [];

    if (data.metrics.errorRate > 20) {
      recommendations.push('- **High Priority:** Investigate and fix high error rate');
    }

    if (data.metrics.averageResponseTime > 5000) {
      recommendations.push('- **Medium Priority:** Optimize cleanup performance');
    }

    if (data.metrics.leaksDetected > 0) {
      recommendations.push('- **High Priority:** Address resource leaks to prevent Jest hanging');
    }

    if (data.alerts.critical > 0) {
      recommendations.push('- **Critical:** Resolve critical alerts immediately');
    }

    if (recommendations.length === 0) {
      recommendations.push('- ✅ System is performing well, continue monitoring');
    }

    return recommendations.join('\n');
  }
}

// Type definitions for dashboard system
export interface CIDashboardReport {
  timestamp: number;
  environment: string;
  status: 'pass' | 'warning' | 'fail';
  summary: {
    totalResources: number;
    successRate: number;
    errorRate: number;
    leaksDetected: number;
    averageCleanupTime: number;
    alertsActive: number;
    overallHealth: string;
  };
  metrics: {
    performance: PerformanceMetrics;
    alerts: AlertReport;
    dashboard: DashboardData;
  };
  recommendations: string[];
  artifacts: CIArtifact[];
}

export interface CIArtifact {
  name: string;
  path: string;
  type: 'json' | 'csv' | 'prometheus' | 'html' | 'markdown';
  description: string;
}

export interface RealtimeMonitoringData {
  timestamp: number;
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    totalOperations: number;
    successRate: number;
    errorRate: number;
    averageResponseTime: number;
    activeHandles: number;
    leaksDetected: number;
  };
  alerts: {
    active: number;
    critical: number;
    high: number;
    trends: {
      hourly: number;
      sixHourly: number;
      daily: number;
      direction: 'increasing' | 'decreasing' | 'stable';
    };
  };
  charts: any;
  lastUpdate: number;
}