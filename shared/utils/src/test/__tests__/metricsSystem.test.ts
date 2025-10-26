/**
 * Tests for Advanced Metrics and Monitoring System
 */

import {
  AdvancedMetricsSystem,
  AlertingSystem,
  DashboardSystem,
  CleanupLogger,
  DiagnosticTools,
  OpenHandleDetector,
  CleanupConfig,
  CleanupLogEntry
} from '../index';

describe('Advanced Metrics System', () => {
  let metricsSystem: AdvancedMetricsSystem;
  let alertingSystem: AlertingSystem;
  let dashboardSystem: DashboardSystem;
  let logger: CleanupLogger;
  let config: CleanupConfig;

  beforeEach(() => {
    config = {
      gracefulTimeout: 5000,
      forceTimeout: 10000,
      maxRetries: 3,
      retryDelay: 1000,
      logLevel: 'info',
      logToFile: false,
      detectHandles: true,
      handleDetectionTimeout: 2000,
      databaseStrategy: 'graceful',
      serverStrategy: 'graceful',
      strictMode: false,
      enableMetrics: true,
      enableDiagnostics: true,
      database: {
        connectionTimeout: 5000,
        queryTimeout: 10000,
        poolCleanupTimeout: 3000
      },
      server: {
        shutdownTimeout: 5000,
        keepAliveTimeout: 2000,
        requestTimeout: 10000
      },
      timer: {
        cleanupBatchSize: 100,
        maxActiveTimers: 1000
      },
      environment: 'testing'
    };

    logger = new CleanupLogger(config);
    const handleDetector = new OpenHandleDetector({
      captureStacks: true,
      logLevel: 'info'
    });
    const diagnosticTools = new DiagnosticTools(logger, handleDetector);

    metricsSystem = new AdvancedMetricsSystem(
      config,
      logger,
      diagnosticTools,
      handleDetector
    );

    alertingSystem = new AlertingSystem(config, logger);

    dashboardSystem = new DashboardSystem(
      config,
      metricsSystem,
      alertingSystem,
      logger
    );
  });

  describe('AdvancedMetricsSystem', () => {
    it('should record cleanup operations', () => {
      const entry: CleanupLogEntry = {
        timestamp: Date.now(),
        level: 'info',
        resourceId: 'test-resource',
        resourceType: 'database',
        action: 'cleanup',
        duration: 1500
      };

      metricsSystem.recordCleanupOperation(entry);

      const performanceMetrics = metricsSystem.getPerformanceMetrics();
      expect(performanceMetrics.totalOperations).toBe(1);
    });

    it('should generate dashboard data', () => {
      const dashboardData = metricsSystem.generateDashboardData();
      
      expect(dashboardData).toHaveProperty('timestamp');
      expect(dashboardData).toHaveProperty('status');
      expect(dashboardData).toHaveProperty('summary');
      expect(dashboardData).toHaveProperty('charts');
    });

    it('should generate CI summary report', () => {
      const ciSummary = metricsSystem.generateCISummary();
      
      expect(ciSummary).toHaveProperty('timestamp');
      expect(ciSummary).toHaveProperty('status');
      expect(ciSummary).toHaveProperty('summary');
      expect(ciSummary).toHaveProperty('recommendations');
      expect(ciSummary).toHaveProperty('exitCode');
    });

    it('should track performance metrics', () => {
      // Record multiple operations
      for (let i = 0; i < 5; i++) {
        metricsSystem.recordCleanupOperation({
          timestamp: Date.now(),
          level: 'info',
          resourceId: `test-resource-${i}`,
          resourceType: 'database',
          action: 'cleanup',
          duration: 1000 + (i * 200)
        });
      }

      const performanceMetrics = metricsSystem.getPerformanceMetrics();
      expect(performanceMetrics.totalOperations).toBe(5);
      expect(performanceMetrics.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('AlertingSystem', () => {
    it('should detect high error rates', () => {
      const entry: CleanupLogEntry = {
        timestamp: Date.now(),
        level: 'error',
        resourceId: 'test-resource',
        resourceType: 'database',
        action: 'cleanup',
        duration: 1500,
        error: 'Connection timeout'
      };

      const metrics = {
        totalOperations: 10,
        successfulOperations: 5,
        failedOperations: 5,
        successRate: 50,
        errorRate: 50,
        resourceTypeStats: {
          database: { count: 5, errors: 3, totalTime: 5000 },
          server: { count: 3, errors: 1, totalTime: 2000 },
          timer: { count: 2, errors: 1, totalTime: 1000 },
          socket: { count: 0, errors: 0, totalTime: 0 },
          process: { count: 0, errors: 0, totalTime: 0 },
          custom: { count: 0, errors: 0, totalTime: 0 }
        },
        startTime: Date.now()
      };

      const performanceMetrics = metricsSystem.getPerformanceMetrics();
      const alerts = alertingSystem.analyzeAndAlert(entry, metrics, performanceMetrics);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.type.includes('error_rate'))).toBe(true);
    });

    it('should track alert statistics', () => {
      const alertStats = alertingSystem.getAlertStatistics();
      
      expect(alertStats).toHaveProperty('total');
      expect(alertStats).toHaveProperty('last24Hours');
      expect(alertStats).toHaveProperty('bySeverity');
      expect(alertStats).toHaveProperty('byType');
      expect(alertStats).toHaveProperty('trends');
    });

    it('should generate alert reports', () => {
      const alertReport = alertingSystem.generateAlertReport();
      
      expect(alertReport).toHaveProperty('timestamp');
      expect(alertReport).toHaveProperty('summary');
      expect(alertReport).toHaveProperty('recommendations');
      expect(alertReport).toHaveProperty('actionItems');
    });
  });

  describe('DashboardSystem', () => {
    it('should generate realtime monitoring data', () => {
      const realtimeData = dashboardSystem.getRealtimeData();
      
      expect(realtimeData).toHaveProperty('timestamp');
      expect(realtimeData).toHaveProperty('status');
      expect(realtimeData).toHaveProperty('metrics');
      expect(realtimeData).toHaveProperty('alerts');
      expect(realtimeData).toHaveProperty('charts');
    });

    it('should start and stop successfully', async () => {
      await expect(dashboardSystem.start()).resolves.not.toThrow();
      await expect(dashboardSystem.stop()).resolves.not.toThrow();
    });

    it('should generate CI dashboard report', async () => {
      const ciDashboard = await dashboardSystem.generateCIDashboard();
      
      expect(ciDashboard).toHaveProperty('timestamp');
      expect(ciDashboard).toHaveProperty('status');
      expect(ciDashboard).toHaveProperty('summary');
      expect(ciDashboard).toHaveProperty('metrics');
      expect(ciDashboard).toHaveProperty('recommendations');
      expect(ciDashboard).toHaveProperty('artifacts');
    });
  });

  describe('Integration', () => {
    it('should work together to provide comprehensive monitoring', async () => {
      // Start monitoring
      await dashboardSystem.start();

      // Record some operations
      for (let i = 0; i < 3; i++) {
        const entry: CleanupLogEntry = {
          timestamp: Date.now(),
          level: 'info',
          resourceId: `integration-test-${i}`,
          resourceType: 'server',
          action: 'cleanup',
          duration: 800 + (i * 100)
        };

        metricsSystem.recordCleanupOperation(entry);
      }

      // Get comprehensive data
      const realtimeData = dashboardSystem.getRealtimeData();
      const performanceMetrics = metricsSystem.getPerformanceMetrics();
      const alertStats = alertingSystem.getAlertStatistics();

      // Verify data consistency
      expect(realtimeData.metrics.totalOperations).toBe(performanceMetrics.totalOperations);
      expect(realtimeData.status).toMatch(/healthy|warning|critical/);

      // Stop monitoring
      await dashboardSystem.stop();
    });

    it('should handle error scenarios gracefully', () => {
      const errorEntry: CleanupLogEntry = {
        timestamp: Date.now(),
        level: 'error',
        resourceId: 'error-test',
        resourceType: 'database',
        action: 'cleanup',
        duration: 5000,
        error: 'Database connection failed'
      };

      expect(() => {
        metricsSystem.recordCleanupOperation(errorEntry);
      }).not.toThrow();

      const performanceMetrics = metricsSystem.getPerformanceMetrics();
      expect(performanceMetrics.totalOperations).toBe(1);
    });
  });
});