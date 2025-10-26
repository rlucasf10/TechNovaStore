#!/usr/bin/env node

import { resourceCleanupManager } from '../resourceCleanupManager';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CLI tool for generating diagnostic reports and analyzing resource cleanup
 */
class DiagnosticCLI {
  private outputDir: string;

  constructor() {
    this.outputDir = process.env.CLEANUP_REPORT_DIR || './cleanup-reports';
    this.ensureOutputDir();
  }

  async run(): Promise<void> {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
      switch (command) {
        case 'health':
          await this.generateHealthReport();
          break;
        case 'performance':
          await this.generatePerformanceReport();
          break;
        case 'leaks':
          await this.generateLeakReport();
          break;
        case 'comprehensive':
          await this.generateComprehensiveReport();
          break;
        case 'dashboard':
          await this.generateDashboardData();
          break;
        case 'export':
          await this.exportDiagnosticData();
          break;
        case 'interactive':
          await this.generateInteractiveReport();
          break;
        case 'ci':
          await this.generateCIReport();
          break;
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async generateHealthReport(): Promise<void> {
    console.log('Generating system health report...');
    
    const healthReport = resourceCleanupManager.generateSystemHealthReport();
    const outputPath = path.join(this.outputDir, `health-report-${Date.now()}.json`);
    
    fs.writeFileSync(outputPath, JSON.stringify(healthReport, null, 2));
    
    console.log(`Health report generated: ${outputPath}`);
    console.log(`Overall Health: ${healthReport.overallHealth.toUpperCase()}`);
    
    if (healthReport.alerts.length > 0) {
      console.log('\nAlerts:');
      healthReport.alerts.forEach(alert => {
        console.log(`  ${alert.level.toUpperCase()}: ${alert.message}`);
      });
    }
    
    if (healthReport.recommendations.length > 0) {
      console.log('\nTop Recommendations:');
      healthReport.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  }

  private async generatePerformanceReport(): Promise<void> {
    console.log('Generating performance analysis report...');
    
    const performanceReport = resourceCleanupManager.generatePerformanceAnalysisReport();
    const outputPath = path.join(this.outputDir, `performance-report-${Date.now()}.json`);
    
    fs.writeFileSync(outputPath, JSON.stringify(performanceReport, null, 2));
    
    console.log(`Performance report generated: ${outputPath}`);
    console.log(`Performance Grade: ${performanceReport.overview.performanceGrade}`);
    console.log(`Average Cleanup Time: ${performanceReport.overview.averageTime.toFixed(0)}ms`);
    console.log(`Success Rate: ${performanceReport.overview.successRate.toFixed(1)}%`);
    
    if (performanceReport.bottlenecks.length > 0) {
      console.log('\nPerformance Bottlenecks:');
      performanceReport.bottlenecks.slice(0, 3).forEach(bottleneck => {
        console.log(`  - ${bottleneck.description}`);
      });
    }
  }

  private async generateLeakReport(): Promise<void> {
    console.log('Generating leak analysis report...');
    
    const leakReport = resourceCleanupManager.generateLeakAnalysisReport();
    const outputPath = path.join(this.outputDir, `leak-report-${Date.now()}.json`);
    
    fs.writeFileSync(outputPath, JSON.stringify(leakReport, null, 2));
    
    console.log(`Leak report generated: ${outputPath}`);
    console.log(`Total Leaks: ${leakReport.summary.totalLeaks}`);
    console.log(`Severity: ${leakReport.summary.severity.toUpperCase()}`);
    console.log(`Jest Hang Risk: ${leakReport.summary.jestHangRisk ? 'HIGH' : 'LOW'}`);
    
    if (leakReport.predictions.length > 0) {
      console.log('\nLeak Predictions:');
      leakReport.predictions.slice(0, 3).forEach(prediction => {
        console.log(`  - ${prediction.resourceType}: ${(prediction.probability * 100).toFixed(1)}% risk`);
      });
    }
  }

  private async generateComprehensiveReport(): Promise<void> {
    console.log('Generating comprehensive report...');
    
    const report = resourceCleanupManager.generateComprehensiveReport({
      testSuite: process.env.TEST_SUITE || 'CLI Generated',
      environment: process.env.NODE_ENV || 'test',
      includeLogEntries: true
    });
    
    const timestamp = Date.now();
    
    // Generate multiple formats
    await resourceCleanupManager.exportReport(report, 'json', 
      path.join(this.outputDir, `comprehensive-report-${timestamp}.json`));
    await resourceCleanupManager.exportReport(report, 'html', 
      path.join(this.outputDir, `comprehensive-report-${timestamp}.html`));
    await resourceCleanupManager.exportReport(report, 'markdown', 
      path.join(this.outputDir, `comprehensive-report-${timestamp}.md`));
    
    console.log(`Comprehensive reports generated in: ${this.outputDir}`);
    console.log(`Overall Status: ${report.executive.overallStatus.toUpperCase()}`);
    console.log(`Total Resources: ${report.executive.keyMetrics.totalResources}`);
    console.log(`Success Rate: ${report.executive.keyMetrics.successRate.toFixed(1)}%`);
    
    if (report.executive.actionRequired) {
      console.log('\n⚠️  ACTION REQUIRED - Critical issues detected');
    }
  }

  private async generateDashboardData(): Promise<void> {
    console.log('Generating dashboard data...');
    
    const dashboardData = resourceCleanupManager.generateDashboardData();
    const outputPath = path.join(this.outputDir, `dashboard-data-${Date.now()}.json`);
    
    fs.writeFileSync(outputPath, JSON.stringify(dashboardData, null, 2));
    
    console.log(`Dashboard data generated: ${outputPath}`);
    console.log(`System Health: ${dashboardData.status.health.toUpperCase()}`);
    console.log(`Active Resources: ${dashboardData.status.activeResources}`);
    console.log(`Open Handles: ${dashboardData.status.openHandles}`);
    console.log(`Recent Errors: ${dashboardData.status.recentErrors}`);
  }

  private async exportDiagnosticData(): Promise<void> {
    console.log('Exporting diagnostic data...');
    
    const outputPath = path.join(this.outputDir, `diagnostic-export-${Date.now()}.json`);
    resourceCleanupManager.exportDiagnosticData(outputPath);
    
    console.log(`Diagnostic data exported: ${outputPath}`);
  }

  private async generateInteractiveReport(): Promise<void> {
    console.log('Generating interactive HTML report...');
    
    const outputPath = path.join(this.outputDir, `interactive-report-${Date.now()}.html`);
    resourceCleanupManager.generateInteractiveReport(outputPath);
    
    console.log(`Interactive report generated: ${outputPath}`);
    console.log('Open the HTML file in a web browser to view the interactive report.');
  }

  private async generateCIReport(): Promise<void> {
    console.log('Generating CI/CD summary report...');
    
    const ciReport = resourceCleanupManager.generateCISummaryReport();
    const outputPath = path.join(this.outputDir, `ci-report-${Date.now()}.json`);
    
    fs.writeFileSync(outputPath, JSON.stringify(ciReport, null, 2));
    
    console.log(`CI report generated: ${outputPath}`);
    console.log(`Status: ${ciReport.status.toUpperCase()}`);
    console.log(`Success Rate: ${ciReport.summary.successRate.toFixed(1)}%`);
    console.log(`Leaks Detected: ${ciReport.summary.leaksDetected}`);
    console.log(`Would Jest Hang: ${ciReport.wouldJestHang ? 'YES' : 'NO'}`);
    
    if (ciReport.alerts.length > 0) {
      console.log('\nCritical Alerts:');
      ciReport.alerts.forEach(alert => {
        console.log(`  ${alert.level.toUpperCase()}: ${alert.message}`);
      });
    }
    
    // Set exit code for CI/CD
    process.exit(ciReport.exitCode);
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private showHelp(): void {
    console.log(`
Resource Cleanup Diagnostic CLI

Usage: node diagnosticCli.js <command>

Commands:
  health         Generate system health report
  performance    Generate performance analysis report
  leaks          Generate leak analysis report
  comprehensive  Generate comprehensive report (all formats)
  dashboard      Generate dashboard data
  export         Export all diagnostic data
  interactive    Generate interactive HTML report
  ci             Generate CI/CD summary report (sets exit code)

Environment Variables:
  CLEANUP_REPORT_DIR    Output directory for reports (default: ./cleanup-reports)
  TEST_SUITE           Test suite name for reports
  NODE_ENV             Environment name for reports

Examples:
  node diagnosticCli.js health
  node diagnosticCli.js comprehensive
  CLEANUP_REPORT_DIR=/tmp/reports node diagnosticCli.js ci
    `);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new DiagnosticCLI();
  cli.run().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

export { DiagnosticCLI };