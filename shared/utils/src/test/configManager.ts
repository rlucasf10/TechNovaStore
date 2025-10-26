/**
 * Configuration Manager for Test Resource Cleanup
 * 
 * This module provides a centralized configuration management system
 * that handles environment variables, validation, and configuration merging.
 */

import { CleanupConfig } from './types';
import { 
  createCleanupConfig, 
  validateConfig, 
  validateConfigOrThrow,
  getValidatedConfig,
  DEFAULT_CLEANUP_CONFIG,
  getCIConfig,
  getDevConfig,
  getTestConfig
} from './config';
import { 
  detectEnvironment, 
  getEnvironmentPreset, 
  validateEnvironmentConfig,
  generateEnvDocumentation 
} from './environmentConfig';

/**
 * Configuration Manager class that provides a singleton interface
 * for managing test resource cleanup configuration
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private currentConfig: CleanupConfig;
  private isInitialized: boolean = false;

  private constructor() {
    this.currentConfig = DEFAULT_CLEANUP_CONFIG;
  }

  /**
   * Get the singleton instance of ConfigManager
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Initialize the configuration manager with optional custom config
   */
  public initialize(customConfig?: Partial<CleanupConfig>): void {
    try {
      // Validate environment configuration first
      const envValidation = validateEnvironmentConfig();
      if (!envValidation.valid) {
        console.warn('Environment configuration issues detected:', envValidation.errors);
      }

      // Create and validate the configuration
      this.currentConfig = getValidatedConfig(customConfig);
      this.isInitialized = true;

      // Log configuration in development mode
      if (this.currentConfig.environment === 'development' && this.currentConfig.logLevel === 'debug') {
        console.log('Test Resource Cleanup Configuration:', JSON.stringify(this.currentConfig, null, 2));
      }
    } catch (error) {
      console.error('Failed to initialize configuration manager:', error);
      throw error;
    }
  }

  /**
   * Get the current configuration
   */
  public getConfig(): CleanupConfig {
    if (!this.isInitialized) {
      this.initialize();
    }
    return { ...this.currentConfig };
  }

  /**
   * Update configuration with new values
   */
  public updateConfig(updates: Partial<CleanupConfig>): void {
    const newConfig = {
      ...this.currentConfig,
      ...updates
    };

    // Deep merge nested objects
    if (updates.database) {
      newConfig.database = {
        ...this.currentConfig.database,
        ...updates.database
      };
    }

    if (updates.server) {
      newConfig.server = {
        ...this.currentConfig.server,
        ...updates.server
      };
    }

    if (updates.timer) {
      newConfig.timer = {
        ...this.currentConfig.timer,
        ...updates.timer
      };
    }

    // Validate the new configuration
    validateConfigOrThrow(newConfig);
    this.currentConfig = newConfig;
  }

  /**
   * Reset configuration to defaults
   */
  public reset(): void {
    this.currentConfig = DEFAULT_CLEANUP_CONFIG;
    this.isInitialized = false;
  }

  /**
   * Get configuration for a specific environment
   */
  public getEnvironmentConfig(environment: string): CleanupConfig {
    const preset = getEnvironmentPreset(environment);
    return createCleanupConfig(preset);
  }

  /**
   * Validate current configuration
   */
  public validateCurrentConfig(): { valid: boolean; errors: string[] } {
    const errors = validateConfig(this.currentConfig);
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get configuration summary for logging/debugging
   */
  public getConfigSummary(): string {
    const config = this.getConfig();
    return `Environment: ${config.environment}, ` +
           `Graceful Timeout: ${config.gracefulTimeout}ms, ` +
           `Force Timeout: ${config.forceTimeout}ms, ` +
           `Max Retries: ${config.maxRetries}, ` +
           `Strict Mode: ${config.strictMode}, ` +
           `Handle Detection: ${config.detectHandles}`;
  }

  /**
   * Check if configuration is optimized for the current environment
   */
  public isOptimizedForEnvironment(): boolean {
    const detectedEnv = detectEnvironment();
    return this.currentConfig.environment === detectedEnv;
  }

  /**
   * Get recommendations for configuration optimization
   */
  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const config = this.getConfig();
    const detectedEnv = detectEnvironment();

    if (config.environment !== detectedEnv) {
      recommendations.push(`Consider setting environment to '${detectedEnv}' for optimal performance`);
    }

    if (detectedEnv === 'ci' && !config.strictMode) {
      recommendations.push('Enable strict mode for CI environment');
    }

    if (detectedEnv === 'development' && config.logLevel === 'error') {
      recommendations.push('Consider using "info" or "debug" log level in development');
    }

    if (config.gracefulTimeout > 30000) {
      recommendations.push('Consider reducing graceful timeout for faster test execution');
    }

    if (config.maxRetries > 5) {
      recommendations.push('Consider reducing max retries to prevent long test runs');
    }

    return recommendations;
  }

  /**
   * Export current configuration as environment variables
   */
  public exportAsEnvVars(): Record<string, string> {
    const config = this.getConfig();
    return {
      TEST_CLEANUP_TIMEOUT: config.gracefulTimeout.toString(),
      TEST_CLEANUP_FORCE_TIMEOUT: config.forceTimeout.toString(),
      TEST_CLEANUP_MAX_RETRIES: config.maxRetries.toString(),
      TEST_CLEANUP_RETRY_DELAY: config.retryDelay.toString(),
      TEST_CLEANUP_LOG_LEVEL: config.logLevel,
      TEST_CLEANUP_LOG_TO_FILE: config.logToFile.toString(),
      TEST_CLEANUP_DETECT_HANDLES: config.detectHandles.toString(),
      TEST_CLEANUP_HANDLE_DETECTION_TIMEOUT: config.handleDetectionTimeout.toString(),
      TEST_CLEANUP_DATABASE_STRATEGY: config.databaseStrategy,
      TEST_CLEANUP_SERVER_STRATEGY: config.serverStrategy,
      TEST_CLEANUP_STRICT_MODE: config.strictMode.toString(),
      TEST_CLEANUP_ENABLE_METRICS: config.enableMetrics.toString(),
      TEST_CLEANUP_ENABLE_DIAGNOSTICS: config.enableDiagnostics.toString(),
      TEST_CLEANUP_ENVIRONMENT: config.environment,
      TEST_CLEANUP_DB_CONNECTION_TIMEOUT: config.database.connectionTimeout.toString(),
      TEST_CLEANUP_DB_QUERY_TIMEOUT: config.database.queryTimeout.toString(),
      TEST_CLEANUP_DB_POOL_CLEANUP_TIMEOUT: config.database.poolCleanupTimeout.toString(),
      TEST_CLEANUP_SERVER_SHUTDOWN_TIMEOUT: config.server.shutdownTimeout.toString(),
      TEST_CLEANUP_SERVER_KEEPALIVE_TIMEOUT: config.server.keepAliveTimeout.toString(),
      TEST_CLEANUP_SERVER_REQUEST_TIMEOUT: config.server.requestTimeout.toString(),
      TEST_CLEANUP_TIMER_BATCH_SIZE: config.timer.cleanupBatchSize.toString(),
      TEST_CLEANUP_TIMER_MAX_ACTIVE: config.timer.maxActiveTimers.toString()
    };
  }
}

/**
 * Convenience function to get the global configuration manager instance
 */
export function getConfigManager(): ConfigManager {
  return ConfigManager.getInstance();
}

/**
 * Convenience function to get the current configuration
 */
export function getCurrentConfig(): CleanupConfig {
  return getConfigManager().getConfig();
}

/**
 * Convenience function to initialize configuration
 */
export function initializeConfig(customConfig?: Partial<CleanupConfig>): void {
  getConfigManager().initialize(customConfig);
}

/**
 * Generate configuration documentation
 */
export function generateConfigDocumentation(): string {
  const lines = [
    '# Test Resource Cleanup Configuration\n',
    '## Overview\n',
    'The test resource cleanup system supports comprehensive configuration through environment variables and programmatic configuration.\n',
    '## Configuration Manager\n',
    'Use the ConfigManager singleton to manage configuration:\n',
    '```typescript',
    'import { getConfigManager } from "./configManager";',
    '',
    'const configManager = getConfigManager();',
    'configManager.initialize({ strictMode: true });',
    'const config = configManager.getConfig();',
    '```\n',
    '## Environment Variables\n'
  ];

  lines.push(generateEnvDocumentation());

  lines.push('\n## Programmatic Configuration\n');
  lines.push('```typescript');
  lines.push('import { initializeConfig } from "./configManager";');
  lines.push('');
  lines.push('initializeConfig({');
  lines.push('  gracefulTimeout: 5000,');
  lines.push('  strictMode: true,');
  lines.push('  database: {');
  lines.push('    connectionTimeout: 3000');
  lines.push('  }');
  lines.push('});');
  lines.push('```');

  return lines.join('\n');
}