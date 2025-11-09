/**
 * Example: Advanced Metrics and Monitoring Integration
 * 
 * This example demonstrates how to integrate the advanced metrics and monitoring
 * system into your test suite for comprehensive resource cleanup monitoring.
 */

import {
  AdvancedMetricsSystem,
  AlertingSystem,
  DashboardSystem,
  CleanupLogger,
  DiagnosticTools,
  OpenHandleDetector,
  ResourceCleanupManager,
  CleanupConfig,
  ConfigManager
} from '../index';

/**
 * Complete metrics integration setup for test suites
 */
export class MetricsIntegrationExample {
  private metricsSystem: AdvancedMetricsSystem;
  private alertingSystem: AlertingSystem;
  private dashboardSystem: DashboardSystem;
  private logger: CleanupLogger;
  private config: CleanupConfig;

  constructor() {
    // Initialize configuration
    const configManager = new ConfigManager();
    this.config = configManager.getConfig();

    // Initialize core components
    this.logger = new CleanupLogger(this.config);
    const diagnosticTools = new DiagnosticTools(this.config);
    const handleDetector = new OpenHandleDetector(this.config);

    // Initialize metrics and monitoring systems
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

  /**
   * Setup metrics monitoring for Jest test suite
   */
  async setupJestIntegration(): Promise<void> {
    // Configure Jest hooks for metrics collection
    beforeAll(async () => {
      await this.startMonitoring();
    });

    afterAll(async () => {
      await this.generateTestReport();
      await this.stopMonitoring();
    });

    afterEach(async () => {
      // Record test completion metrics
      this.recordTestCompletion();
    });
  }

  /**
   * Start monitoring system
   */
  async startMonitoring(): Promise<void> {
    try {
      // Start dashboard system
      await this.dashboardSystem.start();

      // Configure alert thresholds for test environment
      this.alertingSystem.configureThresholds({
        errorRate: {
          warning: 15, // More lenient for tests
          critical: 40
        },
        responseTime: {
          warning: 8000, // 8 seconds
          critical: 15000 // 15 seconds
        },
        throughput: {
          warning: 0.5,
          critical: 0.1
        },
        handleLeaks: {
          warning: 3,
          critical: 10
        }
      });

      this.logger.info('Metrics monitoring started for test suite');
    } catch (error) {
      this.logger.error('Failed to start monitoring', error as Error);
    }
  }

  /**
   * Stop monitoring system
   */
  async stopMonitoring(): Promise<void> {
    try {
      await this.dashboardSystem.stop();
      this.logger.info('Metrics monitoring stopped');
    } catch (error) {
      this.logger.error('Failed to stop monitoring', error as Error);
    }
  }

  /**
   * Record test completion and check for issues
   */
  recordTestCompletion(): void {
    const realtimeData = this.dashboardSystem.getRealtimeData();
    
    // Log test completion metrics
    this.logger.info('Test completed', {
      status: realtimeData.status,
      errorRate: realtimeData.metrics.errorRate,
      leaksDetected: realtimeData.metrics.leaksDetected,
      activeAlerts: realtimeData.alerts.active
    });

    // Check for critical issues
    if (realtimeData.status === 'critical') {
      console.warn('⚠️  Critical issues detected during test execution');
    }

    if (realtimeData.metrics.leaksDetected > 0) {
      console.warn(`🔍 Resource leaks detected: ${realtimeData.metrics.leaksDetected}`);
    }
  }

  /**
   * Generate comprehensive test report
   */
  async generateTestReport(): Promise<void> {
    try {
      // Generate CI dashboard report
      const ciReport = await this.dashboardSystem.generateCIDashboard();
      
      // Export metrics in multiple formats
      await this.metricsSystem.exportMetrics('json', 'test-metrics.json');
      await this.metricsSystem.exportMetrics('csv', 'test-metrics.csv');
      
      // Export dashboard data
      await this.dashboardSystem.exportDashboardData('html', 'test-dashboard.html');
      await this.dashboardSystem.exportDashboardData('markdown', 'test-report.md');

      // Log summary
      console.log('\n📊 Test Execution Summary');
      console.log('═'.repeat(50));
      console.log(`Status: ${ciReport.status.toUpperCase()}`);
      console.log(`Success Rate: ${ciReport.summary.successRate.toFixed(1)}%`);
      console.log(`Error Rate: ${ciReport.summary.errorRate.toFixed(1)}%`);
      console.log(`Leaks Detected: ${ciReport.summary.leaksDetected}`);
      console.log(`Active Alerts: ${ciReport.summary.alertsActive}`);

      if (ciReport.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        ciReport.recommendations.forEach((rec, i) => {
          console.log(`${i + 1}. ${rec}`);
        });
      }

      // Set exit code based on results
      if (ciReport.status === 'fail') {
        process.exitCode = 1;
      }

    } catch (error) {
      this.logger.error('Failed to generate test report', error as Error);
    }
  }

  /**
   * Example: Monitor specific test operations
   */
  async monitorTestOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      // Record successful operation
      this.metricsSystem.recordCleanupOperation({
        timestamp: startTime,
        level: 'info',
        resourceId: operationName,
        resourceType: 'custom',
        action: 'cleanup',
        duration: Date.now() - startTime
      });

      return result;
    } catch (error) {
      // Record failed operation
      this.metricsSystem.recordCleanupOperation({
        timestamp: startTime,
        level: 'error',
        resourceId: operationName,
        resourceType: 'custom',
        action: 'error',
        duration: Date.now() - startTime,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * Example: Custom alert configuration for specific tests
   */
  configureCustomAlerts(): void {
    // Configure stricter thresholds for critical tests
    this.alertingSystem.configureThresholds({
      errorRate: {
        warning: 5,
        critical: 15
      },
      responseTime: {
        warning: 3000,
        critical: 8000
      },
      throughput: {
        warning: 2,
        critical: 0.5
      },
      handleLeaks: {
        warning: 1,
        critical: 5
      }
    });
  }

  /**
   * Get current metrics for test assertions
   */
  getCurrentMetrics() {
    return {
      performance: this.metricsSystem.getPerformanceMetrics(),
      realtime: this.dashboardSystem.getRealtimeData(),
      alerts: this.alertingSystem.getActiveAlerts()
    };
  }
}

/**
 * Example Jest setup with metrics integration
 */
export function setupMetricsForJest(): MetricsIntegrationExample {
  const metricsIntegration = new MetricsIntegrationExample();

  // Global setup
  beforeAll(async () => {
    await metricsIntegration.setupJestIntegration();
  });

  // Return instance for use in tests
  return metricsIntegration;
}

/**
 * Example: Integration test with metrics monitoring
 */
export async function exampleIntegrationTest(): Promise<void> {
  const metrics = setupMetricsForJest();

  describe('Resource Cleanup with Metrics', () => {
    let testMetrics: MetricsIntegrationExample;

    beforeAll(() => {
      testMetrics = metrics;
    });

    it('should monitor database operations', async () => {
      await testMetrics.monitorTestOperation('database-test', async () => {
        // Simulate database operations
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Your actual test logic here
        expect(true).toBe(true);
      });

      // Check metrics after operation
      const currentMetrics = testMetrics.getCurrentMetrics();
      expect(currentMetrics.realtime.status).not.toBe('critical');
    });

    it('should detect resource leaks', async () => {
      // Configure strict monitoring for this test
      testMetrics.configureCustomAlerts();

      await testMetrics.monitorTestOperation('leak-detection-test', async () => {
        // Simulate operations that might leak resources
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      const currentMetrics = testMetrics.getCurrentMetrics();
      
      // Assert no critical alerts
      const criticalAlerts = currentMetrics.alerts.filter(a => a.severity === 'critical');
      expect(criticalAlerts).toHaveLength(0);
    });

    it('should maintain performance standards', async () => {
      const performanceMetrics = testMetrics.getCurrentMetrics().performance;
      
      // Assert performance standards
      expect(performanceMetrics.averageResponseTime).toBeLessThan(5000);
      expect(performanceMetrics.errorRate).toBeLessThan(10);
      expect(performanceMetrics.throughput).toBeGreaterThan(0.1);
    });
  });
}

/**
 * Example: CI/CD pipeline integration
 */
export async function exampleCIPipelineIntegration(): Promise<void> {
  const metricsIntegration = new MetricsIntegrationExample();
  
  try {
    // Start monitoring
    await metricsIntegration.startMonitoring();
    
    // Run your test suite here
    console.log('Running test suite with metrics monitoring...');
    
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate final report
    await metricsIntegration.generateTestReport();
    
    console.log('✅ CI pipeline completed with metrics monitoring');
    
  } catch (error) {
    console.error('❌ CI pipeline failed:', error);
    process.exit(1);
  } finally {
    await metricsIntegration.stopMonitoring();
  }
}

/**
 * Example: Custom metrics collection
 */
export class CustomMetricsCollector {
  private metricsIntegration: MetricsIntegrationExample;

  constructor() {
    this.metricsIntegration = new MetricsIntegrationExample();
  }

  async collectCustomMetrics(): Promise<void> {
    // Example: Monitor specific operations
    await this.metricsIntegration.monitorTestOperation('custom-operation', async () => {
      // Your custom operation here
      console.log('Executing custom operation...');
    });

    // Example: Get current state
    const metrics = this.metricsIntegration.getCurrentMetrics();
    
    console.log('Current Metrics:', {
      status: metrics.realtime.status,
      errorRate: metrics.performance.errorRate,
      responseTime: metrics.performance.averageResponseTime,
      activeAlerts: metrics.alerts.length
    });
  }
}

// Export for use in other files
export default MetricsIntegrationExample;