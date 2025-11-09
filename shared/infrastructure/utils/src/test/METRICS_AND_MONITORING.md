# Advanced Metrics and Monitoring System

The Resource Cleanup system includes a comprehensive metrics and monitoring solution designed to provide deep insights into cleanup performance, detect recurring resource leaks, and offer real-time monitoring capabilities for CI/CD environments.

## Overview

The metrics and monitoring system consists of four main components:

1. **Advanced Metrics System** - Collects and analyzes performance metrics
2. **Alerting System** - Detects patterns and sends alerts for issues
3. **Dashboard System** - Provides real-time monitoring and CI/CD integration
4. **CLI Monitor** - Command-line tool for monitoring and management

## Features

### 📊 Performance Metrics
- Real-time performance tracking
- Response time analysis (average, P95, P99)
- Throughput monitoring
- Success/error rate tracking
- Resource type breakdown
- Time series data collection

### 🚨 Advanced Alerting
- Configurable threshold-based alerts
- Recurring issue pattern detection
- Performance degradation trend analysis
- Resource leak detection
- Severity-based alert classification
- Alert history and statistics

### 📈 Dashboard and Reporting
- Real-time monitoring dashboard
- CI/CD integration reports
- Multiple export formats (JSON, HTML, Markdown, CSV, Prometheus)
- Visual charts and graphs
- Executive summary reports
- Actionable recommendations

### 🔧 CLI Monitoring Tool
- Real-time status monitoring
- Alert management
- Report generation
- Configuration management
- Dashboard server

## Quick Start

### Basic Integration

```typescript
import {
  AdvancedMetricsSystem,
  AlertingSystem,
  DashboardSystem,
  CleanupLogger,
  DiagnosticTools,
  OpenHandleDetector,
  ConfigManager
} from '@shared/utils/test';

// Initialize the system
const configManager = new ConfigManager();
const config = configManager.getConfig();
const logger = new CleanupLogger(config);
const diagnosticTools = new DiagnosticTools(config);
const handleDetector = new OpenHandleDetector(config);

const metricsSystem = new AdvancedMetricsSystem(
  config,
  logger,
  diagnosticTools,
  handleDetector
);

const alertingSystem = new AlertingSystem(config, logger);
const dashboardSystem = new DashboardSystem(
  config,
  metricsSystem,
  alertingSystem,
  logger
);
```

### Jest Integration

```typescript
import { setupMetricsForJest } from '@shared/utils/test/examples/metricsIntegration';

// Setup metrics monitoring for your test suite
const metricsIntegration = setupMetricsForJest();

describe('My Test Suite', () => {
  it('should monitor cleanup operations', async () => {
    await metricsIntegration.monitorTestOperation('my-test', async () => {
      // Your test logic here
    });
    
    // Check metrics
    const metrics = metricsIntegration.getCurrentMetrics();
    expect(metrics.realtime.status).not.toBe('critical');
  });
});
```

## CLI Usage

The system includes a powerful CLI tool for monitoring and management:

### Installation

```bash
# The CLI is included with the test utilities
npm install @shared/utils
```

### Commands

```bash
# Show current system status
npx cleanup-monitor status

# Show active alerts
npx cleanup-monitor alerts

# Start real-time monitoring
npx cleanup-monitor monitor --interval 30

# Start web dashboard
npx cleanup-monitor dashboard --port 3001

# Generate reports
npx cleanup-monitor report json --output report.json
npx cleanup-monitor report html --output dashboard.html
npx cleanup-monitor report markdown --output report.md

# Export metrics
npx cleanup-monitor export prometheus --output metrics.prom
npx cleanup-monitor export csv --output metrics.csv

# Configure alert thresholds
npx cleanup-monitor configure \
  --error-rate-warning 10 \
  --error-rate-critical 25 \
  --response-time-warning 5000 \
  --response-time-critical 10000
```

## Configuration

### Alert Thresholds

```typescript
alertingSystem.configureThresholds({
  errorRate: {
    warning: 10,    // 10% error rate warning
    critical: 25    // 25% error rate critical
  },
  responseTime: {
    warning: 5000,  // 5 second warning
    critical: 10000 // 10 second critical
  },
  throughput: {
    warning: 1,     // 1 op/sec warning
    critical: 0.1   // 0.1 op/sec critical
  },
  handleLeaks: {
    warning: 5,     // 5 leaked handles warning
    critical: 15    // 15 leaked handles critical
  }
});
```

### Environment Variables

```bash
# Enable metrics collection
TEST_CLEANUP_ENABLE_METRICS=true

# Enable diagnostics
TEST_CLEANUP_ENABLE_DIAGNOSTICS=true

# Set log level for metrics
TEST_CLEANUP_LOG_LEVEL=info

# Configure alert thresholds
METRICS_ERROR_RATE_WARNING=10
METRICS_ERROR_RATE_CRITICAL=25
METRICS_RESPONSE_TIME_WARNING=5000
METRICS_RESPONSE_TIME_CRITICAL=10000
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test with Metrics Monitoring

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests with metrics
        run: |
          npm test
          npx cleanup-monitor report json --output ci-report.json
          npx cleanup-monitor export prometheus --output metrics.prom
        env:
          TEST_CLEANUP_ENABLE_METRICS: true
          TEST_CLEANUP_ENVIRONMENT: ci
          
      - name: Upload metrics artifacts
        uses: actions/upload-artifact@v3
        with:
          name: test-metrics
          path: |
            ci-report.json
            metrics.prom
            test-dashboard.html
            
      - name: Check test status
        run: |
          if [ -f cleanup-status.txt ]; then
            cat cleanup-status.txt
            exit_code=$(grep "Exit Code:" cleanup-status.txt | cut -d' ' -f3)
            exit $exit_code
          fi
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    
    environment {
        TEST_CLEANUP_ENABLE_METRICS = 'true'
        TEST_CLEANUP_ENVIRONMENT = 'ci'
    }
    
    stages {
        stage('Test') {
            steps {
                sh 'npm test'
                sh 'npx cleanup-monitor report html --output test-dashboard.html'
                sh 'npx cleanup-monitor export prometheus --output metrics.prom'
            }
        }
        
        stage('Publish Metrics') {
            steps {
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: '.',
                    reportFiles: 'test-dashboard.html',
                    reportName: 'Test Metrics Dashboard'
                ])
                
                archiveArtifacts artifacts: 'metrics.prom,ci-report.json'
            }
        }
    }
    
    post {
        always {
            script {
                if (fileExists('cleanup-status.txt')) {
                    def status = readFile('cleanup-status.txt')
                    echo "Cleanup Status: ${status}"
                }
            }
        }
    }
}
```

## Monitoring and Alerting

### Real-time Monitoring

The dashboard system provides real-time monitoring capabilities:

```typescript
// Start monitoring
await dashboardSystem.start();

// Get real-time data
const realtimeData = dashboardSystem.getRealtimeData();
console.log('Status:', realtimeData.status);
console.log('Error Rate:', realtimeData.metrics.errorRate);
console.log('Active Alerts:', realtimeData.alerts.active);
```

### Alert Management

```typescript
// Get active alerts
const activeAlerts = alertingSystem.getActiveAlerts();

// Get alert statistics
const alertStats = alertingSystem.getAlertStatistics();

// Generate alert report
const alertReport = alertingSystem.generateAlertReport();
```

### Custom Metrics Collection

```typescript
// Record custom operations
metricsSystem.recordCleanupOperation({
  timestamp: Date.now(),
  level: 'info',
  resourceId: 'my-resource',
  resourceType: 'custom',
  action: 'cleanup',
  duration: 1500
});

// Get performance metrics
const performanceMetrics = metricsSystem.getPerformanceMetrics();
```

## Report Generation

### Comprehensive Reports

```typescript
// Generate CI summary report
const ciSummary = metricsSystem.generateCISummary();

// Generate CI dashboard report
const ciDashboard = await dashboardSystem.generateCIDashboard();

// Export in various formats
await metricsSystem.exportMetrics('json', 'metrics.json');
await metricsSystem.exportMetrics('csv', 'metrics.csv');
await metricsSystem.exportMetrics('prometheus', 'metrics.prom');

await dashboardSystem.exportDashboardData('html', 'dashboard.html');
await dashboardSystem.exportDashboardData('markdown', 'report.md');
```

### Report Contents

Reports include:

- **Executive Summary** - High-level status and key metrics
- **Performance Analysis** - Detailed performance breakdown
- **Alert Analysis** - Active alerts and patterns
- **Resource Utilization** - Resource type breakdown
- **Recommendations** - Actionable improvement suggestions
- **Trend Analysis** - Performance trends over time
- **Leak Detection** - Resource leak analysis

## Best Practices

### 1. Configure Appropriate Thresholds

Set alert thresholds based on your application's performance characteristics:

```typescript
// For high-performance applications
alertingSystem.configureThresholds({
  errorRate: { warning: 5, critical: 15 },
  responseTime: { warning: 2000, critical: 5000 }
});

// For integration tests
alertingSystem.configureThresholds({
  errorRate: { warning: 15, critical: 30 },
  responseTime: { warning: 8000, critical: 15000 }
});
```

### 2. Monitor Critical Operations

Wrap critical operations with monitoring:

```typescript
await metricsIntegration.monitorTestOperation('database-migration', async () => {
  await runDatabaseMigration();
});
```

### 3. Regular Report Generation

Generate reports regularly to track trends:

```typescript
// Daily reports
setInterval(async () => {
  await dashboardSystem.exportDashboardData('json', `daily-report-${Date.now()}.json`);
}, 24 * 60 * 60 * 1000);
```

### 4. CI/CD Integration

Always include metrics in your CI/CD pipeline:

```typescript
// In your test setup
beforeAll(async () => {
  if (process.env.CI) {
    await metricsIntegration.startMonitoring();
  }
});

afterAll(async () => {
  if (process.env.CI) {
    await metricsIntegration.generateTestReport();
  }
});
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Reduce metrics collection window size
   - Increase cleanup frequency
   - Check for memory leaks in test code

2. **False Positive Alerts**
   - Adjust alert thresholds
   - Review alert patterns
   - Configure environment-specific thresholds

3. **Performance Impact**
   - Disable metrics in development if needed
   - Use sampling for high-volume operations
   - Optimize metrics collection intervals

### Debug Mode

Enable debug logging for troubleshooting:

```bash
TEST_CLEANUP_LOG_LEVEL=debug npm test
```

### Metrics Validation

Validate metrics collection:

```typescript
const metrics = metricsSystem.getPerformanceMetrics();
console.log('Metrics validation:', {
  totalOperations: metrics.totalOperations,
  averageResponseTime: metrics.averageResponseTime,
  errorRate: metrics.errorRate
});
```

## API Reference

### AdvancedMetricsSystem

- `recordCleanupOperation(entry: CleanupLogEntry): void`
- `getPerformanceMetrics(): PerformanceMetrics`
- `generateDashboardData(): DashboardData`
- `generateCISummary(): CISummaryReport`
- `exportMetrics(format: string, outputPath: string): Promise<void>`
- `getActiveAlerts(): Alert[]`
- `reset(): void`

### AlertingSystem

- `analyzeAndAlert(entry, metrics, performance): Alert[]`
- `getAlertStatistics(): AlertStatistics`
- `generateAlertReport(): AlertReport`
- `configureThresholds(thresholds: AlertThresholds): void`
- `exportAlertData(outputPath: string): void`

### DashboardSystem

- `start(): Promise<void>`
- `stop(): Promise<void>`
- `generateCIDashboard(): Promise<CIDashboardReport>`
- `getRealtimeData(): RealtimeMonitoringData`
- `exportDashboardData(format, outputPath): Promise<void>`

## Examples

See the [examples directory](./examples/) for complete integration examples:

- [Basic Integration](./examples/metricsIntegration.ts)
- [Jest Setup](./examples/metricsIntegration.ts#setupMetricsForJest)
- [CI/CD Pipeline](./examples/metricsIntegration.ts#exampleCIPipelineIntegration)
- [Custom Metrics](./examples/metricsIntegration.ts#CustomMetricsCollector)

## Contributing

When contributing to the metrics system:

1. Add appropriate type definitions
2. Include comprehensive tests
3. Update documentation
4. Follow existing patterns
5. Consider performance impact

## License

This metrics and monitoring system is part of the Resource Cleanup utilities and follows the same license terms.