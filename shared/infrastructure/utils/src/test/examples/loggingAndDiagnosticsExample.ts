/**
 * Example: Using the Enhanced Logging and Diagnostic System
 * 
 * This example demonstrates how to use the new logging and diagnostic features
 * for comprehensive resource cleanup monitoring and analysis.
 */

import { 
  resourceCleanupManager,
  CleanupLogger,
  DiagnosticTools,
  ReportGenerator
} from '../index';

/**
 * Example 1: Basic Logging and Monitoring
 */
export async function basicLoggingExample(): Promise<void> {
  console.log('=== Basic Logging Example ===');
  
  // Configure enhanced logging
  resourceCleanupManager.updateConfig({
    logLevel: 'info',
    logToFile: true,
    logFilePath: './logs/cleanup.log',
    detectHandles: true
  });
  
  // Capture baseline handles
  resourceCleanupManager.captureHandleBaseline();
  
  // Register some test resources
  resourceCleanupManager.registerResource({
    id: 'test-database',
    type: 'database',
    resource: { connection: 'mock-db' },
    cleanup: async () => {
      console.log('Cleaning up database connection');
      // Simulate cleanup time
      await new Promise(resolve => setTimeout(resolve, 100));
    },
    priority: 1
  });
  
  resourceCleanupManager.registerResource({
    id: 'test-server',
    type: 'server',
    resource: { server: 'mock-server' },
    cleanup: async () => {
      console.log('Cleaning up test server');
      await new Promise(resolve => setTimeout(resolve, 200));
    },
    priority: 2
  });
  
  // Perform cleanup and get detailed report
  const cleanupReport = await resourceCleanupManager.cleanup();
  
  console.log('Cleanup completed. Report summary:');
  console.log(`- Duration: ${cleanupReport.duration}ms`);
  console.log(`- Resources cleaned: ${cleanupReport.resources.cleaned}/${cleanupReport.resources.total}`);
  console.log(`- Errors: ${cleanupReport.errors.length}`);
  console.log(`- Warnings: ${cleanupReport.warnings.length}`);
  
  // Get performance metrics
  const metrics = resourceCleanupManager.getPerformanceMetrics();
  console.log('\nPerformance Metrics:');
  console.log(`- Total operations: ${metrics.totalOperations}`);
  console.log(`- Success rate: ${((metrics.successfulOperations / metrics.totalOperations) * 100).toFixed(1)}%`);
  console.log(`- Average cleanup time: ${metrics.averageCleanupTime.toFixed(0)}ms`);
}

/**
 * Example 2: Diagnostic Session with Comprehensive Analysis
 */
export async function diagnosticSessionExample(): Promise<void> {
  console.log('\n=== Diagnostic Session Example ===');
  
  // Start a diagnostic session
  const session = resourceCleanupManager.startDiagnosticSession('Integration Test Suite');
  console.log(`Started diagnostic session: ${session.id}`);
  
  // Simulate test execution with resource usage
  await simulateTestExecution();
  
  // End session and get analysis
  const analysis = resourceCleanupManager.endDiagnosticSession(session.id);
  
  console.log('\nDiagnostic Analysis:');
  console.log(`- Session duration: ${analysis.duration}ms`);
  console.log(`- Leaks detected: ${analysis.leakAnalysis.totalLeaks}`);
  console.log(`- Severity: ${analysis.leakAnalysis.severityAssessment}`);
  console.log(`- Performance grade: ${analysis.performanceAnalysis.overview?.performanceGrade || 'N/A'}`);
  
  if (analysis.recommendations.length > 0) {
    console.log('\nRecommendations:');
    analysis.recommendations.slice(0, 3).forEach((rec: string, index: number) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
}

/**
 * Example 3: System Health Monitoring
 */
export async function systemHealthExample(): Promise<void> {
  console.log('\n=== System Health Monitoring Example ===');
  
  // Generate system health report
  const healthReport = resourceCleanupManager.generateSystemHealthReport();
  
  console.log(`Overall Health: ${healthReport.overallHealth.toUpperCase()}`);
  console.log(`Resource Utilization Efficiency: ${healthReport.resourceUtilization.utilizationEfficiency.toFixed(1)}%`);
  
  // Check for alerts
  if (healthReport.alerts.length > 0) {
    console.log('\nSystem Alerts:');
    healthReport.alerts.forEach(alert => {
      console.log(`  ${alert.level.toUpperCase()}: ${alert.message}`);
      console.log(`    Action: ${alert.action}`);
    });
  } else {
    console.log('\nNo system alerts - all systems operating normally');
  }
  
  // Show resource utilization breakdown
  console.log('\nResource Utilization by Type:');
  Object.entries(healthReport.resourceUtilization.resourcesByType).forEach(([type, stats]) => {
    console.log(`  ${type}: ${stats.count} resources, ${stats.efficiency.toFixed(1)}% efficiency, ${stats.averageCleanupTime.toFixed(0)}ms avg`);
  });
  
  // Check for bottlenecks
  if (healthReport.resourceUtilization.bottlenecks.length > 0) {
    console.log('\nIdentified Bottlenecks:');
    healthReport.resourceUtilization.bottlenecks.forEach(bottleneck => {
      console.log(`  - ${bottleneck}`);
    });
  }
}

/**
 * Example 4: Leak Prediction and Prevention
 */
export async function leakPredictionExample(): Promise<void> {
  console.log('\n=== Leak Prediction Example ===');
  
  // Analyze current leaks
  const leakAnalysis = resourceCleanupManager.analyzeResourceLeaks();
  
  console.log(`Current Leaks: ${leakAnalysis.totalLeaks}`);
  console.log(`Severity Assessment: ${leakAnalysis.severityAssessment}`);
  
  if (leakAnalysis.totalLeaks > 0) {
    console.log('\nLeak Details by Type:');
    Object.entries(leakAnalysis.leaksByType).forEach(([type, info]) => {
      console.log(`  ${type}: ${info.count} leaks (${info.severity} severity)`);
    });
    
    console.log('\nMitigation Strategies:');
    leakAnalysis.mitigationStrategies.forEach((strategy, index) => {
      console.log(`  ${index + 1}. ${strategy}`);
    });
  }
  
  // Get leak predictions
  const predictions = resourceCleanupManager.predictPotentialLeaks();
  
  if (predictions.length > 0) {
    console.log('\nLeak Predictions:');
    predictions.slice(0, 3).forEach(prediction => {
      console.log(`  ${prediction.resourceType}: ${(prediction.probability * 100).toFixed(1)}% probability (${prediction.riskLevel} risk)`);
      console.log(`    Description: ${prediction.description}`);
      console.log(`    Prevention: ${prediction.preventionStrategy}`);
    });
  } else {
    console.log('\nNo leak predictions - system appears stable');
  }
}

/**
 * Example 5: Comprehensive Report Generation
 */
export async function reportGenerationExample(): Promise<void> {
  console.log('\n=== Report Generation Example ===');
  
  // Generate comprehensive report
  const report = resourceCleanupManager.generateComprehensiveReport({
    testSuite: 'Example Test Suite',
    environment: 'development',
    includeLogEntries: true
  });
  
  console.log('Comprehensive Report Generated:');
  console.log(`- Overall Status: ${report.executive.overallStatus}`);
  console.log(`- Total Resources: ${report.executive.keyMetrics.totalResources}`);
  console.log(`- Success Rate: ${report.executive.keyMetrics.successRate.toFixed(1)}%`);
  console.log(`- Average Cleanup Time: ${report.executive.keyMetrics.averageCleanupTime.toFixed(0)}ms`);
  console.log(`- Leaks Detected: ${report.executive.keyMetrics.leaksDetected}`);
  
  // Risk assessment
  console.log('\nRisk Assessment:');
  console.log(`- Jest Hang Risk: ${report.executive.riskAssessment.jestHangRisk.toUpperCase()}`);
  console.log(`- Performance Risk: ${report.executive.riskAssessment.performanceRisk.toUpperCase()}`);
  console.log(`- Stability Risk: ${report.executive.riskAssessment.stabilityRisk.toUpperCase()}`);
  
  if (report.executive.actionRequired) {
    console.log('\n⚠️  ACTION REQUIRED');
    console.log('Next Steps:');
    report.executive.nextSteps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });
  }
  
  // Export reports in different formats
  try {
    await resourceCleanupManager.exportReport(report, 'json', './reports/comprehensive-report.json');
    await resourceCleanupManager.exportReport(report, 'html', './reports/comprehensive-report.html');
    await resourceCleanupManager.exportReport(report, 'markdown', './reports/comprehensive-report.md');
    console.log('\nReports exported to ./reports/ directory');
  } catch (error) {
    console.log('Note: Report export requires write permissions to ./reports/ directory');
  }
}

/**
 * Example 6: CI/CD Integration
 */
export async function cicdIntegrationExample(): Promise<void> {
  console.log('\n=== CI/CD Integration Example ===');
  
  // Generate CI summary report
  const ciReport = resourceCleanupManager.generateCISummaryReport();
  
  console.log(`CI Status: ${ciReport.status.toUpperCase()}`);
  console.log(`Exit Code: ${ciReport.exitCode}`);
  console.log(`Would Jest Hang: ${ciReport.wouldJestHang ? 'YES' : 'NO'}`);
  
  console.log('\nSummary Metrics:');
  console.log(`- Total Resources: ${ciReport.summary.totalResources}`);
  console.log(`- Success Rate: ${ciReport.summary.successRate.toFixed(1)}%`);
  console.log(`- Error Rate: ${ciReport.summary.errorRate.toFixed(1)}%`);
  console.log(`- Leaks Detected: ${ciReport.summary.leaksDetected}`);
  console.log(`- Average Cleanup Time: ${ciReport.summary.averageCleanupTime.toFixed(0)}ms`);
  
  if (ciReport.alerts.length > 0) {
    console.log('\nCritical Alerts for CI:');
    ciReport.alerts.forEach(alert => {
      console.log(`  ${alert.level.toUpperCase()}: ${alert.message}`);
    });
  }
  
  if (ciReport.recommendations.length > 0) {
    console.log('\nTop Recommendations:');
    ciReport.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  // In a real CI environment, you would exit with the provided exit code
  console.log(`\nIn CI/CD, this would exit with code: ${ciReport.exitCode}`);
}

/**
 * Example 7: Real-time Dashboard Data
 */
export async function dashboardExample(): Promise<void> {
  console.log('\n=== Dashboard Data Example ===');
  
  // Generate dashboard data for real-time monitoring
  const dashboardData = resourceCleanupManager.generateDashboardData();
  
  console.log('Current System Status:');
  console.log(`- Health: ${dashboardData.status.health.toUpperCase()}`);
  console.log(`- Active Resources: ${dashboardData.status.activeResources}`);
  console.log(`- Open Handles: ${dashboardData.status.openHandles}`);
  console.log(`- Recent Errors: ${dashboardData.status.recentErrors}`);
  
  console.log('\nKey Metrics:');
  console.log(`- Success Rate: ${dashboardData.metrics.successRate.toFixed(1)}%`);
  console.log(`- Average Cleanup Time: ${dashboardData.metrics.averageCleanupTime.toFixed(0)}ms`);
  console.log(`- Error Rate: ${dashboardData.metrics.errorRate.toFixed(1)}%`);
  console.log(`- Handle Growth: ${dashboardData.metrics.handleGrowth}`);
  
  if (dashboardData.recentActivity.length > 0) {
    console.log('\nRecent Activity:');
    dashboardData.recentActivity.slice(-5).forEach(activity => {
      const time = new Date(activity.timestamp).toLocaleTimeString();
      const status = activity.success ? '✓' : '✗';
      console.log(`  ${time} ${status} ${activity.type} ${activity.action} ${activity.duration ? `(${activity.duration}ms)` : ''}`);
    });
  }
}

/**
 * Helper function to simulate test execution
 */
async function simulateTestExecution(): Promise<void> {
  // Simulate various resource operations
  const resources = [
    { id: 'db-1', type: 'database' as const, delay: 150 },
    { id: 'server-1', type: 'server' as const, delay: 100 },
    { id: 'timer-1', type: 'timer' as const, delay: 50 },
    { id: 'socket-1', type: 'socket' as const, delay: 200 }
  ];
  
  // Register resources
  for (const res of resources) {
    resourceCleanupManager.registerResource({
      id: res.id,
      type: res.type,
      resource: { mock: true },
      cleanup: async () => {
        await new Promise(resolve => setTimeout(resolve, res.delay));
      },
      priority: 1
    });
  }
  
  // Simulate some test operations
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Cleanup resources
  await resourceCleanupManager.cleanup();
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🔍 Resource Cleanup Logging and Diagnostics Examples\n');
  
  try {
    await basicLoggingExample();
    await diagnosticSessionExample();
    await systemHealthExample();
    await leakPredictionExample();
    await reportGenerationExample();
    await cicdIntegrationExample();
    await dashboardExample();
    
    console.log('\n✅ All examples completed successfully!');
    console.log('\nNext Steps:');
    console.log('1. Integrate these patterns into your test suites');
    console.log('2. Set up automated reporting in your CI/CD pipeline');
    console.log('3. Configure monitoring dashboards for production environments');
    console.log('4. Use the CLI tool for ad-hoc analysis: node diagnosticCli.js health');
    
  } catch (error) {
    console.error('\n❌ Example execution failed:', error);
    throw error;
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(error => {
    console.error('Failed to run examples:', error);
    process.exit(1);
  });
}