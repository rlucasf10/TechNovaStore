#!/usr/bin/env node

/**
 * CLI Tool for Resource Cleanup Metrics Monitoring
 * Provides command-line interface for monitoring, alerting, and dashboard management
 */

import { program } from 'commander';
import { AdvancedMetricsSystem } from '../metricsSystem';
import { AlertingSystem } from '../alertingSystem';
import { DashboardSystem } from '../dashboardSystem';
import { CleanupLogger } from '../cleanupLogger';
import { DiagnosticTools } from '../diagnosticTools';
import { OpenHandleDetector } from '../handleDetector';
import { CleanupConfig } from '../types';
import { ConfigManager } from '../configManager';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CLI Monitor for Resource Cleanup Metrics
 */
class MetricsMonitorCLI {
  private metricsSystem?: AdvancedMetricsSystem;
  private alertingSystem?: AlertingSystem;
  private dashboardSystem?: DashboardSystem;
  private logger?: CleanupLogger;
  private config?: CleanupConfig;

  async initialize(): Promise<void> {
    const configManager = new ConfigManager();
    this.config = configManager.getConfig();
    
    this.logger = new CleanupLogger(this.config);
    const diagnosticTools = new DiagnosticTools(this.config);
    const handleDetector = new OpenHandleDetector(this.config);
    
    this.metricsSystem = new AdvancedMetricsSystem(
      this.config,
      this.logger,
      diagnosticTools,
      handleDetector
    );
    
    this.alertingSystem = new AlertingSystem(this.config, this.logger);
    
    this.dashboardSystem = new DashboardSystem(
      this.config,
      this.metricsSystem,
      this.alertingSystem,
      this.logger
    );
  }

  async showStatus(): Promise<void> {
    if (!this.metricsSystem) {
      console.error('Metrics system not initialized');
      return;
    }

    const realtimeData = this.dashboardSystem!.getRealtimeData();
    const ciSummary = this.metricsSystem.generateCISummary();

    console.log('\n📊 Resource Cleanup Status');
    console.log('═'.repeat(50));
    console.log(`Status: ${this.getStatusIcon(realtimeData.status)} ${realtimeData.status.toUpperCase()}`);
    console.log(`Last Update: ${new Date(realtimeData.timestamp).toLocaleString()}`);
    
    console.log('\n📈 Key Metrics');
    console.log('─'.repeat(30));
    console.log(`Total Operations: ${realtimeData.metrics.totalOperations}`);
    console.log(`Success Rate: ${realtimeData.metrics.successRate.toFixed(1)}%`);
    console.log(`Error Rate: ${realtimeData.metrics.errorRate.toFixed(1)}%`);
    console.log(`Avg Response Time: ${realtimeData.metrics.averageResponseTime.toFixed(0)}ms`);
    console.log(`Active Handles: ${realtimeData.metrics.activeHandles}`);
    console.log(`Leaks Detected: ${realtimeData.metrics.leaksDetected}`);

    console.log('\n🚨 Alerts');
    console.log('─'.repeat(20));
    console.log(`Active: ${realtimeData.alerts.active}`);
    console.log(`Critical: ${realtimeData.alerts.critical}`);
    console.log(`High: ${realtimeData.alerts.high}`);
    console.log(`Trend: ${this.getTrendIcon(realtimeData.alerts.trends.direction)} ${realtimeData.alerts.trends.direction}`);

    if (ciSummary.recommendations.length > 0) {
      console.log('\n💡 Recommendations');
      console.log('─'.repeat(25));
      ciSummary.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }

    console.log('\n');
  }

  async showAlerts(): Promise<void> {
    if (!this.alertingSystem) {
      console.error('Alerting system not initialized');
      return;
    }

    const activeAlerts = this.alertingSystem.getActiveAlerts();
    const alertStats = this.alertingSystem.getAlertStatistics();

    console.log('\n🚨 Alert Summary');
    console.log('═'.repeat(40));
    console.log(`Total Alerts (24h): ${alertStats.last24Hours}`);
    console.log(`Active Alerts: ${activeAlerts.length}`);
    console.log(`Recurring Issues: ${alertStats.recurringIssues.length}`);

    if (activeAlerts.length > 0) {
      console.log('\n🔥 Active Alerts');
      console.log('─'.repeat(30));
      activeAlerts.slice(0, 10).forEach((alert, i) => {
        const icon = this.getSeverityIcon(alert.severity);
        const time = new Date(alert.timestamp).toLocaleTimeString();
        console.log(`${i + 1}. ${icon} [${alert.severity.toUpperCase()}] ${alert.message} (${time})`);
      });
    }

    if (alertStats.recurringIssues.length > 0) {
      console.log('\n🔄 Recurring Issues');
      console.log('─'.repeat(35));
      alertStats.recurringIssues.slice(0, 5).forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.type} (${issue.occurrences} times, avg interval: ${Math.round(issue.averageInterval / 60000)}min)`);
      });
    }

    console.log('\n');
  }

  async generateReport(format: string, outputPath?: string): Promise<void> {
    if (!this.dashboardSystem || !this.metricsSystem) {
      console.error('Systems not initialized');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultPath = `cleanup-report-${timestamp}.${format}`;
    const finalPath = outputPath || defaultPath;

    try {
      switch (format) {
        case 'json':
          const ciReport = await this.dashboardSystem.generateCIDashboard();
          fs.writeFileSync(finalPath, JSON.stringify(ciReport, null, 2));
          break;
        
        case 'html':
        case 'markdown':
          await this.dashboardSystem.exportDashboardData(format as any, finalPath);
          break;
        
        case 'csv':
        case 'prometheus':
          await this.metricsSystem.exportMetrics(format as any, finalPath);
          break;
        
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      console.log(`✅ Report generated: ${finalPath}`);
    } catch (error) {
      console.error(`❌ Failed to generate report: ${error}`);
    }
  }

  async startMonitoring(interval: number = 30): Promise<void> {
    if (!this.dashboardSystem) {
      console.error('Dashboard system not initialized');
      return;
    }

    console.log(`🔍 Starting monitoring (update interval: ${interval}s)`);
    console.log('Press Ctrl+C to stop\n');

    const monitor = setInterval(async () => {
      console.clear();
      await this.showStatus();
    }, interval * 1000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      clearInterval(monitor);
      console.log('\n👋 Monitoring stopped');
      process.exit(0);
    });

    // Show initial status
    await this.showStatus();
  }

  async startDashboard(port: number = 3001): Promise<void> {
    if (!this.dashboardSystem) {
      console.error('Dashboard system not initialized');
      return;
    }

    try {
      await this.dashboardSystem.start();
      console.log(`🌐 Dashboard started on http://localhost:${port}`);
      console.log('Press Ctrl+C to stop');

      // Keep process alive
      process.on('SIGINT', async () => {
        await this.dashboardSystem!.stop();
        console.log('\n👋 Dashboard stopped');
        process.exit(0);
      });

      // Prevent process from exiting
      setInterval(() => {}, 1000);
    } catch (error) {
      console.error(`❌ Failed to start dashboard: ${error}`);
    }
  }

  async configureAlerts(thresholds: any): Promise<void> {
    if (!this.alertingSystem) {
      console.error('Alerting system not initialized');
      return;
    }

    try {
      this.alertingSystem.configureThresholds(thresholds);
      console.log('✅ Alert thresholds updated');
    } catch (error) {
      console.error(`❌ Failed to configure alerts: ${error}`);
    }
  }

  async exportMetrics(format: string, outputPath?: string): Promise<void> {
    if (!this.metricsSystem) {
      console.error('Metrics system not initialized');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultPath = `metrics-${timestamp}.${format}`;
    const finalPath = outputPath || defaultPath;

    try {
      await this.metricsSystem.exportMetrics(format as any, finalPath);
      console.log(`✅ Metrics exported: ${finalPath}`);
    } catch (error) {
      console.error(`❌ Failed to export metrics: ${error}`);
    }
  }

  private getStatusIcon(status: string): string {
    const icons = {
      healthy: '🟢',
      warning: '🟡',
      critical: '🔴'
    };
    return icons[status as keyof typeof icons] || '⚪';
  }

  private getTrendIcon(direction: string): string {
    const icons = {
      increasing: '📈',
      decreasing: '📉',
      stable: '➡️'
    };
    return icons[direction as keyof typeof icons] || '➡️';
  }

  private getSeverityIcon(severity: string): string {
    const icons = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };
    return icons[severity as keyof typeof icons] || '⚪';
  }
}

// CLI Command Setup
async function setupCLI(): Promise<void> {
  const cli = new MetricsMonitorCLI();

  program
    .name('cleanup-monitor')
    .description('Resource Cleanup Metrics Monitor')
    .version('1.0.0');

  program
    .command('status')
    .description('Show current system status')
    .action(async () => {
      await cli.initialize();
      await cli.showStatus();
    });

  program
    .command('alerts')
    .description('Show active alerts and alert statistics')
    .action(async () => {
      await cli.initialize();
      await cli.showAlerts();
    });

  program
    .command('monitor')
    .description('Start real-time monitoring')
    .option('-i, --interval <seconds>', 'Update interval in seconds', '30')
    .action(async (options) => {
      await cli.initialize();
      await cli.startMonitoring(parseInt(options.interval));
    });

  program
    .command('dashboard')
    .description('Start web dashboard')
    .option('-p, --port <port>', 'Port number', '3001')
    .action(async (options) => {
      await cli.initialize();
      await cli.startDashboard(parseInt(options.port));
    });

  program
    .command('report')
    .description('Generate a report')
    .argument('<format>', 'Report format (json, html, markdown, csv, prometheus)')
    .option('-o, --output <path>', 'Output file path')
    .action(async (format, options) => {
      await cli.initialize();
      await cli.generateReport(format, options.output);
    });

  program
    .command('export')
    .description('Export metrics data')
    .argument('<format>', 'Export format (json, csv, prometheus)')
    .option('-o, --output <path>', 'Output file path')
    .action(async (format, options) => {
      await cli.initialize();
      await cli.exportMetrics(format, options.output);
    });

  program
    .command('configure')
    .description('Configure alert thresholds')
    .option('--error-rate-warning <number>', 'Error rate warning threshold', '10')
    .option('--error-rate-critical <number>', 'Error rate critical threshold', '25')
    .option('--response-time-warning <number>', 'Response time warning threshold (ms)', '5000')
    .option('--response-time-critical <number>', 'Response time critical threshold (ms)', '10000')
    .action(async (options) => {
      await cli.initialize();
      const thresholds = {
        errorRate: {
          warning: parseFloat(options.errorRateWarning),
          critical: parseFloat(options.errorRateCritical)
        },
        responseTime: {
          warning: parseFloat(options.responseTimeWarning),
          critical: parseFloat(options.responseTimeCritical)
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
      await cli.configureAlerts(thresholds);
    });

  program.parse();
}

// Run CLI if this file is executed directly
if (require.main === module) {
  setupCLI().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

export { MetricsMonitorCLI, setupCLI };