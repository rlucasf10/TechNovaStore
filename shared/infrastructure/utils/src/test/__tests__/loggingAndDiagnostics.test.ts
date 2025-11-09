/**
 * Tests for Enhanced Logging and Diagnostic System
 */

import { 
  CleanupLogger, 
  DiagnosticTools, 
  ReportGenerator,
  resourceCleanupManager 
} from '../index';
import { CleanupConfig } from '../types';
import { OpenHandleDetector } from '../handleDetector';
import * as fs from 'fs';
import * as path from 'path';

describe('Enhanced Logging and Diagnostic System', () => {
  let testConfig: CleanupConfig;
  let logger: CleanupLogger;
  let handleDetector: OpenHandleDetector;
  let diagnosticTools: DiagnosticTools;
  let reportGenerator: ReportGenerator;
  let tempDir: string;

  beforeAll(() => {
    tempDir = path.join(__dirname, 'temp-test-logs');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  beforeEach(() => {
    testConfig = {
      gracefulTimeout: 1000,
      forceTimeout: 2000,
      maxRetries: 2,
      retryDelay: 100,
      logLevel: 'info',
      logToFile: true,
      logFilePath: path.join(tempDir, 'test-cleanup.log'),
      detectHandles: true,
      handleDetectionTimeout: 1000,
      databaseStrategy: 'hybrid',
      serverStrategy: 'hybrid'
    };

    logger = new CleanupLogger(testConfig);
    handleDetector = new OpenHandleDetector({ captureStacks: true });
    diagnosticTools = new DiagnosticTools(logger, handleDetector);
    reportGenerator = new ReportGenerator(logger, diagnosticTools, handleDetector);
  });

  afterEach(() => {
    // Clean up test files
    try {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(tempDir, file));
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('CleanupLogger', () => {
    it('should log cleanup operations with proper formatting', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.log({
        timestamp: Date.now(),
        level: 'info',
        resourceId: 'test-resource',
        resourceType: 'database',
        action: 'cleanup',
        duration: 150
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ResourceCleanup]'),
        expect.anything()
      );

      consoleSpy.mockRestore();
    });

    it('should collect metrics from log entries', () => {
      // Log some test entries
      logger.log({
        timestamp: Date.now(),
        level: 'info',
        resourceId: 'db-1',
        resourceType: 'database',
        action: 'cleanup',
        duration: 100
      });

      logger.log({
        timestamp: Date.now(),
        level: 'error',
        resourceId: 'server-1',
        resourceType: 'server',
        action: 'cleanup',
        duration: 200,
        error: 'Connection failed'
      });

      const metrics = logger.getMetrics();
      
      expect(metrics.totalOperations).toBe(2);
      expect(metrics.successfulOperations).toBe(1);
      expect(metrics.failedOperations).toBe(1);
      expect(metrics.errorRate).toBe(50);
      expect(metrics.averageCleanupTime).toBe(150);
    });

    it('should generate performance reports', () => {
      // Add some test data
      for (let i = 0; i < 5; i++) {
        logger.log({
          timestamp: Date.now() - (i * 1000),
          level: 'info',
          resourceId: `resource-${i}`,
          resourceType: 'database',
          action: 'cleanup',
          duration: 100 + (i * 50)
        });
      }

      const report = logger.generatePerformanceReport();
      
      expect(report.totalOperations).toBe(5);
      expect(report.successRate).toBe(100);
      expect(report.averageCleanupTime).toBeGreaterThan(0);
      expect(report.resourceTypeBreakdown).toHaveProperty('database');
      expect(report.errorAnalysis).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('should write logs to file when configured', () => {
      logger.log({
        timestamp: Date.now(),
        level: 'info',
        resourceId: 'test-resource',
        resourceType: 'database',
        action: 'cleanup'
      });

      // Check if log file was created and contains data
      expect(fs.existsSync(testConfig.logFilePath!)).toBe(true);
      const logContent = fs.readFileSync(testConfig.logFilePath!, 'utf8');
      expect(logContent).toContain('test-resource');
      expect(logContent).toContain('database');
    });
  });

  describe('DiagnosticTools', () => {
    it('should start and end diagnostic sessions', () => {
      const session = diagnosticTools.startDiagnosticSession('Test Session');
      
      expect(session.id).toBeDefined();
      expect(session.name).toBe('Test Session');
      expect(session.startTime).toBeGreaterThan(0);
      expect(session.endTime).toBe(0);

      const analysis = diagnosticTools.endDiagnosticSession(session.id);
      
      expect(analysis.sessionId).toBe(session.id);
      expect(analysis.duration).toBeGreaterThan(0);
      expect(analysis.leakAnalysis).toBeDefined();
      expect(analysis.performanceAnalysis).toBeDefined();
    });

    it('should analyze resource leaks', () => {
      const leakAnalysis = diagnosticTools.analyzeResourceLeaks();
      
      expect(leakAnalysis.totalLeaks).toBeGreaterThanOrEqual(0);
      expect(leakAnalysis.severityAssessment).toMatch(/^(low|medium|high|critical)$/);
      expect(leakAnalysis.leaksByType).toBeDefined();
      expect(leakAnalysis.mitigationStrategies).toBeInstanceOf(Array);
    });

    it('should generate system health reports', () => {
      const healthReport = diagnosticTools.generateSystemHealthReport();
      
      expect(healthReport.timestamp).toBeGreaterThan(0);
      expect(healthReport.overallHealth).toMatch(/^(excellent|good|fair|poor|critical)$/);
      expect(healthReport.resourceUtilization).toBeDefined();
      expect(healthReport.performanceMetrics).toBeDefined();
      expect(healthReport.leakStatus).toBeDefined();
      expect(healthReport.recommendations).toBeInstanceOf(Array);
      expect(healthReport.alerts).toBeInstanceOf(Array);
    });

    it('should predict potential leaks', () => {
      // Add some test data to create patterns
      for (let i = 0; i < 3; i++) {
        logger.log({
          timestamp: Date.now(),
          level: 'error',
          resourceId: `db-${i}`,
          resourceType: 'database',
          action: 'cleanup',
          error: 'Connection timeout'
        });
      }

      const predictions = diagnosticTools.predictPotentialLeaks();
      
      expect(predictions).toBeInstanceOf(Array);
      predictions.forEach(prediction => {
        expect(prediction.resourceType).toBeDefined();
        expect(prediction.probability).toBeGreaterThanOrEqual(0);
        expect(prediction.probability).toBeLessThanOrEqual(1);
        expect(prediction.riskLevel).toMatch(/^(low|medium|high)$/);
        expect(prediction.description).toBeDefined();
        expect(prediction.preventionStrategy).toBeDefined();
      });
    });

    it('should export diagnostic data', () => {
      const exportPath = path.join(tempDir, 'diagnostic-export.json');
      
      diagnosticTools.exportDiagnosticData(exportPath);
      
      expect(fs.existsSync(exportPath)).toBe(true);
      const exportedData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
      expect(exportedData.timestamp).toBeDefined();
      expect(exportedData.systemHealth).toBeDefined();
      expect(exportedData.cleanupPatterns).toBeDefined();
    });
  });

  describe('ReportGenerator', () => {
    it('should generate comprehensive reports', () => {
      const report = reportGenerator.generateComprehensiveReport({
        testSuite: 'Test Suite',
        environment: 'test',
        includeLogEntries: true
      });

      expect(report.metadata).toBeDefined();
      expect(report.metadata.testSuite).toBe('Test Suite');
      expect(report.metadata.environment).toBe('test');
      expect(report.executive).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.analysis).toBeDefined();
      expect(report.details).toBeDefined();
      expect(report.visualizations).toBeDefined();
    });

    it('should generate CI summary reports', () => {
      const ciReport = reportGenerator.generateCISummaryReport();
      
      expect(ciReport.timestamp).toBeGreaterThan(0);
      expect(ciReport.status).toMatch(/^(pass|warning|fail)$/);
      expect(ciReport.summary).toBeDefined();
      expect(ciReport.summary.totalResources).toBeGreaterThanOrEqual(0);
      expect(ciReport.summary.successRate).toBeGreaterThanOrEqual(0);
      expect(ciReport.summary.successRate).toBeLessThanOrEqual(100);
      expect([0, 1]).toContain(ciReport.exitCode);
      expect(typeof ciReport.wouldJestHang).toBe('boolean');
    });

    it('should generate performance analysis reports', () => {
      const performanceReport = reportGenerator.generatePerformanceAnalysisReport();
      
      expect(performanceReport.timestamp).toBeGreaterThan(0);
      expect(performanceReport.overview).toBeDefined();
      expect(performanceReport.overview.performanceGrade).toMatch(/^[A-F]$/);
      expect(performanceReport.timing).toBeDefined();
      expect(performanceReport.bottlenecks).toBeInstanceOf(Array);
      expect(performanceReport.optimization).toBeInstanceOf(Array);
      expect(performanceReport.trends).toBeDefined();
      expect(performanceReport.benchmarks).toBeInstanceOf(Array);
    });

    it('should generate leak analysis reports', () => {
      const leakReport = reportGenerator.generateLeakAnalysisReport();
      
      expect(leakReport.timestamp).toBeGreaterThan(0);
      expect(leakReport.summary).toBeDefined();
      expect(leakReport.summary.severity).toMatch(/^(low|medium|high|critical)$/);
      expect(leakReport.summary.riskLevel).toMatch(/^(low|medium|high|critical)$/);
      expect(leakReport.leakDetails).toBeDefined();
      expect(leakReport.handleAnalysis).toBeDefined();
      expect(leakReport.predictions).toBeInstanceOf(Array);
      expect(leakReport.actionPlan).toBeInstanceOf(Array);
      expect(leakReport.preventionStrategies).toBeInstanceOf(Array);
    });

    it('should export reports in different formats', async () => {
      const report = reportGenerator.generateComprehensiveReport();
      
      const jsonPath = path.join(tempDir, 'test-report.json');
      const htmlPath = path.join(tempDir, 'test-report.html');
      const mdPath = path.join(tempDir, 'test-report.md');
      const csvPath = path.join(tempDir, 'test-report.csv');

      await reportGenerator.exportReport(report, 'json', jsonPath);
      await reportGenerator.exportReport(report, 'html', htmlPath);
      await reportGenerator.exportReport(report, 'markdown', mdPath);
      await reportGenerator.exportReport(report, 'csv', csvPath);

      expect(fs.existsSync(jsonPath)).toBe(true);
      expect(fs.existsSync(htmlPath)).toBe(true);
      expect(fs.existsSync(mdPath)).toBe(true);
      expect(fs.existsSync(csvPath)).toBe(true);

      // Verify content
      const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      expect(jsonContent.metadata).toBeDefined();

      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('Resource Cleanup Report');

      const mdContent = fs.readFileSync(mdPath, 'utf8');
      expect(mdContent).toContain('# Resource Cleanup Report');

      const csvContent = fs.readFileSync(csvPath, 'utf8');
      expect(csvContent).toContain('Timestamp,Resource Type,Action');
    });

    it('should generate dashboard data', () => {
      const dashboardData = reportGenerator.generateDashboardData();
      
      expect(dashboardData.timestamp).toBeGreaterThan(0);
      expect(dashboardData.status).toBeDefined();
      expect(dashboardData.metrics).toBeDefined();
      expect(dashboardData.alerts).toBeInstanceOf(Array);
      expect(dashboardData.recentActivity).toBeInstanceOf(Array);
      expect(dashboardData.charts).toBeDefined();
      expect(dashboardData.charts.resourcesByType).toBeDefined();
      expect(dashboardData.charts.performanceOverTime).toBeDefined();
      expect(dashboardData.charts.errorDistribution).toBeDefined();
    });
  });

  describe('Integration with ResourceCleanupManager', () => {
    beforeEach(() => {
      // Reset the global manager
      resourceCleanupManager.updateConfig(testConfig);
    });

    it('should integrate logging with resource cleanup operations', async () => {
      // Register a test resource
      resourceCleanupManager.registerResource({
        id: 'integration-test-resource',
        type: 'database',
        resource: { mock: true },
        cleanup: async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        },
        priority: 1
      });

      // Perform cleanup
      const report = await resourceCleanupManager.cleanup();
      
      expect(report.resources.total).toBeGreaterThanOrEqual(1);
      expect(report.resources.cleaned).toBeGreaterThanOrEqual(1);
      expect(report.duration).toBeGreaterThan(0);

      // Check that metrics were collected
      const metrics = resourceCleanupManager.getPerformanceMetrics();
      expect(metrics.totalOperations).toBeGreaterThan(0);
    });

    it('should provide diagnostic capabilities through the manager', () => {
      const session = resourceCleanupManager.startDiagnosticSession('Integration Test');
      expect(session.id).toBeDefined();

      const analysis = resourceCleanupManager.endDiagnosticSession(session.id);
      expect(analysis.sessionId).toBe(session.id);

      const healthReport = resourceCleanupManager.generateSystemHealthReport();
      expect(healthReport.overallHealth).toBeDefined();

      const leakAnalysis = resourceCleanupManager.analyzeResourceLeaks();
      expect(leakAnalysis.totalLeaks).toBeGreaterThanOrEqual(0);
    });

    it('should generate reports through the manager', () => {
      const comprehensiveReport = resourceCleanupManager.generateComprehensiveReport();
      expect(comprehensiveReport.metadata).toBeDefined();

      const ciReport = resourceCleanupManager.generateCISummaryReport();
      expect(ciReport.status).toBeDefined();

      const performanceReport = resourceCleanupManager.generatePerformanceAnalysisReport();
      expect(performanceReport.overview).toBeDefined();

      const leakReport = resourceCleanupManager.generateLeakAnalysisReport();
      expect(leakReport.summary).toBeDefined();
    });

    it('should handle errors gracefully in logging operations', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Test with invalid log file path
      resourceCleanupManager.updateConfig({
        ...testConfig,
        logToFile: true,
        logFilePath: '/invalid/path/test.log'
      });

      // This should not throw, but should log an error
      resourceCleanupManager.registerResource({
        id: 'error-test',
        type: 'custom',
        resource: null,
        cleanup: () => {},
        priority: 1
      });

      // The operation should still work despite logging errors
      expect(resourceCleanupManager.getActiveResources()).toHaveLength(1);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty log entries gracefully', () => {
      const metrics = logger.getMetrics();
      expect(metrics.totalOperations).toBe(0);
      expect(metrics.errorRate).toBe(0);

      const report = logger.generatePerformanceReport();
      expect(report.totalOperations).toBe(0);
      expect(report.successRate).toBe(100);
    });

    it('should handle invalid diagnostic session IDs', () => {
      expect(() => {
        diagnosticTools.endDiagnosticSession('invalid-session-id');
      }).toThrow('Diagnostic session invalid-session-id not found');
    });

    it('should handle file system errors in report export', async () => {
      const report = reportGenerator.generateComprehensiveReport();
      
      // Try to export to an invalid path (Windows compatible)
      await expect(
        reportGenerator.exportReport(report, 'json', 'Z:\\invalid\\path\\report.json')
      ).rejects.toThrow();
    });

    it('should validate report format parameters', async () => {
      const report = reportGenerator.generateComprehensiveReport();
      
      await expect(
        reportGenerator.exportReport(report, 'invalid' as any, 'test.txt')
      ).rejects.toThrow('Unsupported format: invalid');
    });
  });
});