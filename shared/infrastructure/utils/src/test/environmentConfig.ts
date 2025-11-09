/**
 * Environment Configuration for Test Resource Cleanup
 * 
 * This module provides comprehensive environment variable configuration
 * for the test resource cleanup system, supporting different environments
 * and deployment scenarios.
 */

import { CleanupConfig } from './types';

/**
 * Environment variable names and their descriptions
 */
export const ENV_VARS = {
  // Basic timeout configuration
  TEST_CLEANUP_TIMEOUT: 'Graceful shutdown timeout in milliseconds (default: 5000)',
  TEST_CLEANUP_FORCE_TIMEOUT: 'Force shutdown timeout in milliseconds (default: 10000)',
  
  // Retry configuration
  TEST_CLEANUP_MAX_RETRIES: 'Maximum number of retry attempts (default: 3)',
  TEST_CLEANUP_RETRY_DELAY: 'Delay between retry attempts in milliseconds (default: 1000)',
  
  // Logging configuration
  TEST_CLEANUP_LOG_LEVEL: 'Log level: error, warn, info, debug (default: info)',
  TEST_CLEANUP_LOG_TO_FILE: 'Enable file logging: true/false (default: false)',
  TEST_CLEANUP_LOG_FILE_PATH: 'Path to log file when file logging is enabled',
  
  // Handle detection
  TEST_CLEANUP_DETECT_HANDLES: 'Enable open handle detection: true/false (default: true)',
  TEST_CLEANUP_HANDLE_DETECTION_TIMEOUT: 'Handle detection timeout in milliseconds (default: 2000)',
  
  // Cleanup strategies
  TEST_CLEANUP_DATABASE_STRATEGY: 'Database cleanup strategy: graceful, force, hybrid (default: hybrid)',
  TEST_CLEANUP_SERVER_STRATEGY: 'Server cleanup strategy: graceful, force, hybrid (default: hybrid)',
  
  // Advanced configuration
  TEST_CLEANUP_STRICT_MODE: 'Enable strict mode for enhanced validation: true/false (default: false)',
  TEST_CLEANUP_ENABLE_METRICS: 'Enable performance metrics collection: true/false (default: true)',
  TEST_CLEANUP_ENABLE_DIAGNOSTICS: 'Enable diagnostic tools: true/false (default: true)',
  TEST_CLEANUP_ENVIRONMENT: 'Environment type: development, testing, ci, production (default: development)',
  
  // Database specific configuration
  TEST_CLEANUP_DB_CONNECTION_TIMEOUT: 'Database connection timeout in milliseconds (default: 5000)',
  TEST_CLEANUP_DB_QUERY_TIMEOUT: 'Database query timeout in milliseconds (default: 30000)',
  TEST_CLEANUP_DB_POOL_CLEANUP_TIMEOUT: 'Database pool cleanup timeout in milliseconds (default: 10000)',
  
  // Server specific configuration
  TEST_CLEANUP_SERVER_SHUTDOWN_TIMEOUT: 'Server shutdown timeout in milliseconds (default: 5000)',
  TEST_CLEANUP_SERVER_KEEPALIVE_TIMEOUT: 'Server keep-alive timeout in milliseconds (default: 5000)',
  TEST_CLEANUP_SERVER_REQUEST_TIMEOUT: 'Server request timeout in milliseconds (default: 30000)',
  
  // Timer specific configuration
  TEST_CLEANUP_TIMER_BATCH_SIZE: 'Timer cleanup batch size (default: 100)',
  TEST_CLEANUP_TIMER_MAX_ACTIVE: 'Maximum active timers allowed (default: 1000)'
} as const;

/**
 * Environment-specific configuration presets
 */
export const ENVIRONMENT_PRESETS: Record<string, Partial<CleanupConfig>> = {
  development: {
    gracefulTimeout: 3000,
    forceTimeout: 8000,
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
    environment: 'development'
  },
  
  testing: {
    gracefulTimeout: 5000,
    forceTimeout: 10000,
    maxRetries: 2,
    retryDelay: 500,
    logLevel: 'error',
    logToFile: false,
    detectHandles: true,
    handleDetectionTimeout: 2500,
    databaseStrategy: 'hybrid',
    serverStrategy: 'hybrid',
    strictMode: true,
    enableMetrics: false,
    enableDiagnostics: true,
    environment: 'testing'
  },
  
  ci: {
    gracefulTimeout: 15000,
    forceTimeout: 20000,
    maxRetries: 2,
    retryDelay: 500,
    logLevel: 'warn',
    logToFile: true,
    detectHandles: true,
    handleDetectionTimeout: 3000,
    databaseStrategy: 'hybrid',
    serverStrategy: 'hybrid',
    strictMode: true,
    enableMetrics: true,
    enableDiagnostics: true,
    environment: 'ci'
  },
  
  production: {
    gracefulTimeout: 10000,
    forceTimeout: 15000,
    maxRetries: 1,
    retryDelay: 2000,
    logLevel: 'error',
    logToFile: true,
    detectHandles: false,
    handleDetectionTimeout: 5000,
    databaseStrategy: 'graceful',
    serverStrategy: 'graceful',
    strictMode: true,
    enableMetrics: false,
    enableDiagnostics: false,
    environment: 'production'
  }
};

/**
 * Detect current environment based on environment variables
 */
export function detectEnvironment(): string {
  if (process.env.CI === 'true') {
    return 'ci';
  }
  
  if (process.env.NODE_ENV === 'test') {
    return 'testing';
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  return 'development';
}

/**
 * Get environment preset configuration
 */
export function getEnvironmentPreset(environment?: string): Partial<CleanupConfig> {
  const env = environment || detectEnvironment();
  return ENVIRONMENT_PRESETS[env] || ENVIRONMENT_PRESETS.development;
}

/**
 * Parse boolean environment variable
 */
export function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
}

/**
 * Parse integer environment variable with validation
 */
export function parseIntegerEnv(
  value: string | undefined, 
  defaultValue: number, 
  min?: number, 
  max?: number
): number {
  if (value === undefined) {
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    console.warn(`Invalid integer value for environment variable: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  }
  
  if (min !== undefined && parsed < min) {
    console.warn(`Value ${parsed} is below minimum ${min}, using minimum value`);
    return min;
  }
  
  if (max !== undefined && parsed > max) {
    console.warn(`Value ${parsed} is above maximum ${max}, using maximum value`);
    return max;
  }
  
  return parsed;
}

/**
 * Parse enum environment variable
 */
export function parseEnumEnv<T extends string>(
  value: string | undefined,
  validValues: readonly T[],
  defaultValue: T
): T {
  if (value === undefined) {
    return defaultValue;
  }
  
  const lowerValue = value.toLowerCase() as T;
  
  if (validValues.includes(lowerValue)) {
    return lowerValue;
  }
  
  console.warn(
    `Invalid enum value: ${value}, valid values are: ${validValues.join(', ')}, using default: ${defaultValue}`
  );
  return defaultValue;
}

/**
 * Generate environment variable documentation
 */
export function generateEnvDocumentation(): string {
  const lines = ['# Test Resource Cleanup Environment Variables\n'];
  
  Object.entries(ENV_VARS).forEach(([key, description]) => {
    lines.push(`## ${key}`);
    lines.push(description);
    lines.push('');
  });
  
  lines.push('## Environment Presets\n');
  Object.entries(ENVIRONMENT_PRESETS).forEach(([env, config]) => {
    lines.push(`### ${env.toUpperCase()}`);
    lines.push('```');
    lines.push(JSON.stringify(config, null, 2));
    lines.push('```\n');
  });
  
  return lines.join('\n');
}

/**
 * Validate environment configuration
 */
export function validateEnvironmentConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for conflicting environment variables
  const timeout = process.env.TEST_CLEANUP_TIMEOUT;
  const forceTimeout = process.env.TEST_CLEANUP_FORCE_TIMEOUT;
  
  if (timeout && forceTimeout) {
    const timeoutVal = parseInt(timeout, 10);
    const forceTimeoutVal = parseInt(forceTimeout, 10);
    
    if (!isNaN(timeoutVal) && !isNaN(forceTimeoutVal) && forceTimeoutVal < timeoutVal) {
      errors.push('TEST_CLEANUP_FORCE_TIMEOUT must be greater than or equal to TEST_CLEANUP_TIMEOUT');
    }
  }
  
  // Check log file path when logging to file is enabled
  if (process.env.TEST_CLEANUP_LOG_TO_FILE === 'true' && !process.env.TEST_CLEANUP_LOG_FILE_PATH) {
    errors.push('TEST_CLEANUP_LOG_FILE_PATH is required when TEST_CLEANUP_LOG_TO_FILE is true');
  }
  
  // Validate numeric values
  const numericVars = [
    'TEST_CLEANUP_TIMEOUT',
    'TEST_CLEANUP_FORCE_TIMEOUT',
    'TEST_CLEANUP_MAX_RETRIES',
    'TEST_CLEANUP_RETRY_DELAY',
    'TEST_CLEANUP_HANDLE_DETECTION_TIMEOUT',
    'TEST_CLEANUP_DB_CONNECTION_TIMEOUT',
    'TEST_CLEANUP_DB_QUERY_TIMEOUT',
    'TEST_CLEANUP_DB_POOL_CLEANUP_TIMEOUT',
    'TEST_CLEANUP_SERVER_SHUTDOWN_TIMEOUT',
    'TEST_CLEANUP_SERVER_KEEPALIVE_TIMEOUT',
    'TEST_CLEANUP_SERVER_REQUEST_TIMEOUT',
    'TEST_CLEANUP_TIMER_BATCH_SIZE',
    'TEST_CLEANUP_TIMER_MAX_ACTIVE'
  ];
  
  numericVars.forEach(varName => {
    const value = process.env[varName];
    if (value && isNaN(parseInt(value, 10))) {
      errors.push(`${varName} must be a valid integer, got: ${value}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}