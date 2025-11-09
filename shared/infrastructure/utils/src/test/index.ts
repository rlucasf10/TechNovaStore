/**
 * Test Resource Cleanup System
 * 
 * A comprehensive system for managing and cleaning up resources during test execution
 * to prevent Jest from hanging due to unclosed handles.
 */

// Core types and interfaces
export * from './types';

// Main resource cleanup manager
export { ResourceCleanupManager, resourceCleanupManager } from './resourceCleanupManager';

// Database cleanup manager
export { DatabaseCleanupManager, databaseCleanupManager } from './databaseCleanup';
export type { DatabaseType } from './databaseCleanup';

// Server cleanup manager
export { 
  TestServerManager, 
  testServerManager,
  createTestServer,
  stopTestServer,
  stopAllTestServers
} from './serverCleanup';
export type { ServerInstance, ServerCleanupConfig } from './serverCleanup';

// Configuration utilities
export {
  DEFAULT_CLEANUP_CONFIG,
  getConfigFromEnv,
  getCIConfig,
  getDevConfig,
  getTestConfig,
  createCleanupConfig,
  validateConfig,
  validateConfigOrThrow,
  getValidatedConfig
} from './config';

// Environment configuration
export {
  ENV_VARS,
  ENVIRONMENT_PRESETS,
  detectEnvironment,
  getEnvironmentPreset,
  parseBooleanEnv,
  parseIntegerEnv,
  parseEnumEnv,
  generateEnvDocumentation,
  validateEnvironmentConfig
} from './environmentConfig';

// Configuration manager
export {
  ConfigManager,
  getConfigManager,
  getCurrentConfig,
  initializeConfig,
  generateConfigDocumentation
} from './configManager';

// Priority system
export {
  DEFAULT_PRIORITIES,
  Priority,
  getDefaultPriority,
  createPriorityComparator,
  isValidPriority,
  normalizePriority,
  getPriorityDescription,
  SCENARIO_PRIORITIES,
  getScenarioPriorities,
  createPriorityCalculator
} from './priorities';

// Timer cleanup manager
export { 
  TimerCleanupManager, 
  timerCleanupManager,
  setupTimerCleanup,
  cleanupTimers,
  teardownTimerCleanup,
  managedTimers
} from './timerCleanup';
export type { TimerInstance, TimerCleanupStats } from './timerCleanup';

// Open handle detector
export { 
  OpenHandleDetector, 
  openHandleDetector 
} from './handleDetector';

// Enhanced logging and diagnostics
export { 
  CleanupLogger 
} from './cleanupLogger';
export type { 
  CleanupMetrics, 
  PerformanceReport, 
  ErrorAnalysis, 
  TimelineAnalysis 
} from './cleanupLogger';

// Diagnostic tools
export { 
  DiagnosticTools 
} from './diagnosticTools';
export type { 
  DiagnosticSession, 
  DiagnosticAnalysis, 
  LeakAnalysis, 
  SystemHealthReport, 
  ResourceUtilization, 
  SystemAlert, 
  CleanupPatternAnalysis, 
  LeakPrediction 
} from './diagnosticTools';

// Report generator
export { 
  ReportGenerator 
} from './reportGenerator';
export type { 
  ReportOptions, 
  ComprehensiveReport, 
  PerformanceAnalysisReport, 
  LeakAnalysisReport, 
  PrioritizedRecommendation 
} from './reportGenerator';

// Jest timer setup utilities
export {
  setupJestTimerCleanup,
  manualTimerCleanup,
  getTimerStats,
  assertNoActiveTimers,
  flushAllTimers,
  advanceTimersByTime,
  setupFakeTimersWithCleanup,
  withTimerIsolation,
  createTestTimeout,
  createTestInterval
} from './jestTimerSetup';
export type { JestTimerConfig } from './jestTimerSetup';

// Mock provider system
export { 
  MockProvider, 
  mockProvider, 
  mockHelpers 
} from './mockProvider';
export type { 
  MockResponse, 
  MockRule, 
  MockRequest, 
  MockStats 
} from './mockProvider';

// In-memory database utilities
export { 
  InMemoryMongoManager, 
  InMemoryPostgreSQLManager,
  inMemoryMongo, 
  inMemoryPostgreSQL, 
  inMemoryHelpers 
} from './inMemoryDatabase';
export type { 
  InMemoryDatabaseConfig, 
  InMemoryDatabaseInstance 
} from './inMemoryDatabase';

// Standardized test setup utilities
export {
  setupUnitTest,
  setupIntegrationTest,
  setupECommerceTest,
  setupSimpleTest,
  setupPerformanceTest,
  testUtils
} from './standardTestSetup';
export type { 
  TestSetupConfig, 
  TestContext 
} from './standardTestSetup';

// Advanced metrics and monitoring system
export { 
  AdvancedMetricsSystem 
} from './metricsSystem';
export type { 
  PerformanceMetrics, 
  ResourceTypeMetrics, 
  TimeSeriesPoint, 
  CollectedMetrics, 
  Alert, 
  AlertRule, 
  DashboardData, 
  ChartConfig, 
  CISummaryReport, 
  OperationRecord 
} from './metricsSystem';

// Advanced alerting system
export { 
  AlertingSystem 
} from './alertingSystem';
export type { 
  AlertHistory, 
  AlertStatistics, 
  RecurringIssue, 
  AlertTrends, 
  AlertReport, 
  ActionItem, 
  AlertThresholds 
} from './alertingSystem';

// Dashboard system for CI/CD monitoring
export { 
  DashboardSystem 
} from './dashboardSystem';
export type { 
  CIDashboardReport, 
  CIArtifact, 
  RealtimeMonitoringData 
} from './dashboardSystem';

// CLI monitoring tool (commented out due to dependencies)
// export { 
//   MetricsMonitorCLI, 
//   setupCLI 
// } from './cli/metricsMonitor';

// Convenience functions for common use cases
export {
  setupTestCleanup,
  createTestResource,
  withCleanup,
  cleanupAfterTest,
  cleanupAfterAll
} from './helpers';