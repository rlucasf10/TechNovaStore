/**
 * Configuration Examples for Test Resource Cleanup
 * 
 * This file demonstrates various ways to configure the test resource cleanup system
 * for different environments and use cases.
 */

import {
  getConfigManager,
  initializeConfig,
  getCurrentConfig
} from '../configManager';
import {
  detectEnvironment,
  getEnvironmentPreset
} from '../environmentConfig';
import { CleanupConfig } from '../types';

/**
 * Example 1: Basic configuration initialization
 */
export function basicConfigurationExample(): void {
  // Initialize with default configuration
  initializeConfig();

  const config = getCurrentConfig();
  console.log('Current configuration:', config);
}

/**
 * Example 2: Custom configuration for development
 */
export function developmentConfigurationExample(): void {
  const customConfig: Partial<CleanupConfig> = {
    gracefulTimeout: 2000, // Faster timeout for development
    logLevel: 'debug', // Verbose logging
    enableDiagnostics: true,
    database: {
      connectionTimeout: 2000,
      queryTimeout: 15000,
      poolCleanupTimeout: 8000
    }
  };

  initializeConfig(customConfig);

  const configManager = getConfigManager();
  console.log('Development config summary:', configManager.getConfigSummary());
}

/**
 * Example 3: CI/CD optimized configuration
 */
export function ciConfigurationExample(): void {
  const ciConfig: Partial<CleanupConfig> = {
    gracefulTimeout: 20000, // Longer timeout for CI
    forceTimeout: 30000,
    maxRetries: 1, // Fewer retries in CI
    logLevel: 'warn',
    logToFile: true,
    logFilePath: './logs/test-cleanup.log',
    strictMode: true,
    enableMetrics: true,
    database: {
      connectionTimeout: 15000,
      queryTimeout: 60000, // Longer query timeout for CI
      poolCleanupTimeout: 20000
    },
    server: {
      shutdownTimeout: 15000,
      keepAliveTimeout: 10000,
      requestTimeout: 60000
    }
  };

  initializeConfig(ciConfig);

  const configManager = getConfigManager();
  const recommendations = configManager.getOptimizationRecommendations();
  console.log('CI optimization recommendations:', recommendations);
}

/**
 * Example 4: Performance testing configuration
 */
export function performanceTestingConfigurationExample(): void {
  const perfConfig: Partial<CleanupConfig> = {
    gracefulTimeout: 1000, // Very fast cleanup
    forceTimeout: 3000,
    maxRetries: 1,
    logLevel: 'error', // Minimal logging for performance
    enableMetrics: true, // Enable metrics to measure performance
    enableDiagnostics: false, // Disable diagnostics for speed
    timer: {
      cleanupBatchSize: 500, // Larger batches for efficiency
      maxActiveTimers: 2000
    }
  };

  initializeConfig(perfConfig);
}

/**
 * Example 5: Integration testing configuration
 */
export function integrationTestingConfigurationExample(): void {
  const integrationConfig: Partial<CleanupConfig> = {
    gracefulTimeout: 8000, // Longer timeout for complex cleanup
    forceTimeout: 15000,
    maxRetries: 3,
    logLevel: 'info',
    detectHandles: true,
    handleDetectionTimeout: 5000,
    databaseStrategy: 'hybrid',
    serverStrategy: 'hybrid',
    strictMode: true,
    database: {
      connectionTimeout: 8000,
      queryTimeout: 45000,
      poolCleanupTimeout: 12000
    },
    server: {
      shutdownTimeout: 8000,
      keepAliveTimeout: 6000,
      requestTimeout: 45000
    }
  };

  initializeConfig(integrationConfig);
}

/**
 * Example 6: Environment-based configuration
 */
export function environmentBasedConfigurationExample(): void {
  const environment = detectEnvironment();
  console.log('Detected environment:', environment);

  const preset = getEnvironmentPreset(environment);
  initializeConfig(preset);

  const configManager = getConfigManager();
  console.log('Environment optimized:', configManager.isOptimizedForEnvironment());
}

/**
 * Example 7: Dynamic configuration updates
 */
export function dynamicConfigurationExample(): void {
  // Initialize with basic config
  initializeConfig();

  const configManager = getConfigManager();

  // Update configuration based on test conditions
  if (process.env.SLOW_TESTS === 'true') {
    configManager.updateConfig({
      gracefulTimeout: 15000,
      forceTimeout: 25000
    });
  }

  // Update database configuration for specific tests
  configManager.updateConfig({
    database: {
      connectionTimeout: 10000,
      queryTimeout: 60000,
      poolCleanupTimeout: 12000
    }
  });

  console.log('Updated config:', configManager.getConfigSummary());
}

/**
 * Example 8: Configuration validation and error handling
 */
export function configurationValidationExample(): void {
  try {
    const invalidConfig: Partial<CleanupConfig> = {
      gracefulTimeout: -1000, // Invalid negative timeout
      maxRetries: -5, // Invalid negative retries
      database: {
        connectionTimeout: -1, // Invalid negative timeout
        queryTimeout: 0, // Invalid zero timeout
        poolCleanupTimeout: 100000 // Unreasonably high timeout
      }
    };

    initializeConfig(invalidConfig);
  } catch (error) {
    console.error('Configuration validation failed:', (error as Error).message);

    // Initialize with valid configuration instead
    initializeConfig({
      gracefulTimeout: 5000,
      maxRetries: 3
    });
  }

  const configManager = getConfigManager();
  const validation = configManager.validateCurrentConfig();

  if (!validation.valid) {
    console.error('Configuration issues:', validation.errors);
  }
}

/**
 * Example 9: Export configuration as environment variables
 */
export function exportConfigurationExample(): void {
  initializeConfig({
    gracefulTimeout: 8000,
    logLevel: 'info',
    strictMode: true
  });

  const configManager = getConfigManager();
  const envVars = configManager.exportAsEnvVars();

  console.log('Configuration as environment variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
}

/**
 * Example 10: Configuration for specific test scenarios
 */
export function scenarioBasedConfigurationExample(): void {
  // Configuration for database-heavy tests
  const databaseHeavyConfig: Partial<CleanupConfig> = {
    databaseStrategy: 'graceful',
    database: {
      connectionTimeout: 10000,
      queryTimeout: 60000,
      poolCleanupTimeout: 15000
    },
    gracefulTimeout: 12000
  };

  // Configuration for server-heavy tests
  const serverHeavyConfig: Partial<CleanupConfig> = {
    serverStrategy: 'hybrid',
    server: {
      shutdownTimeout: 10000,
      keepAliveTimeout: 8000,
      requestTimeout: 30000
    },
    gracefulTimeout: 12000
  };

  // Configuration for timer-heavy tests
  const timerHeavyConfig: Partial<CleanupConfig> = {
    timer: {
      cleanupBatchSize: 1000,
      maxActiveTimers: 5000
    },
    gracefulTimeout: 8000
  };

  // Use appropriate configuration based on test type
  const testType = process.env.TEST_TYPE || 'general';

  switch (testType) {
    case 'database':
      initializeConfig(databaseHeavyConfig);
      break;
    case 'server':
      initializeConfig(serverHeavyConfig);
      break;
    case 'timer':
      initializeConfig(timerHeavyConfig);
      break;
    default:
      initializeConfig();
  }

  console.log(`Configuration optimized for ${testType} tests`);
}

/**
 * Example usage in Jest setup
 */
export function jestSetupExample(): void {
  // In jest.setup.ts or similar
  beforeAll(() => {
    // Initialize configuration based on environment
    const environment = detectEnvironment();
    const preset = getEnvironmentPreset(environment);

    // Add custom overrides
    const customConfig: Partial<CleanupConfig> = {
      ...preset,
      logLevel: process.env.DEBUG_TESTS === 'true' ? 'debug' : preset.logLevel
    };

    initializeConfig(customConfig);

    const configManager = getConfigManager();
    console.log('Test cleanup initialized:', configManager.getConfigSummary());
  });

  afterAll(() => {
    const configManager = getConfigManager();
    configManager.reset();
  });
}