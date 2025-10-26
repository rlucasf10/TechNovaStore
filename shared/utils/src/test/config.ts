import { CleanupConfig } from './types';

/**
 * Configuration utilities for the Resource Cleanup Manager
 */

/**
 * Default configuration for the cleanup system
 */
export const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
  gracefulTimeout: 5000,
  forceTimeout: 10000,
  maxRetries: 3,
  retryDelay: 1000,
  logLevel: 'info',
  logToFile: false,
  detectHandles: true,
  handleDetectionTimeout: 2000,
  databaseStrategy: 'hybrid',
  serverStrategy: 'hybrid',
  strictMode: false,
  enableMetrics: true,
  enableDiagnostics: true,
  database: {
    connectionTimeout: 5000,
    queryTimeout: 30000,
    poolCleanupTimeout: 10000
  },
  server: {
    shutdownTimeout: 5000,
    keepAliveTimeout: 5000,
    requestTimeout: 30000
  },
  timer: {
    cleanupBatchSize: 100,
    maxActiveTimers: 1000
  },
  environment: 'development'
};

/**
 * Get configuration from environment variables
 */
export function getConfigFromEnv(): Partial<CleanupConfig> {
  const config: Partial<CleanupConfig> = {};

  // Timeouts
  if (process.env.TEST_CLEANUP_TIMEOUT) {
    config.gracefulTimeout = parseInt(process.env.TEST_CLEANUP_TIMEOUT, 10);
  }
  
  if (process.env.TEST_CLEANUP_FORCE_TIMEOUT) {
    config.forceTimeout = parseInt(process.env.TEST_CLEANUP_FORCE_TIMEOUT, 10);
  }

  // Retries
  if (process.env.TEST_CLEANUP_MAX_RETRIES) {
    config.maxRetries = parseInt(process.env.TEST_CLEANUP_MAX_RETRIES, 10);
  }

  if (process.env.TEST_CLEANUP_RETRY_DELAY) {
    config.retryDelay = parseInt(process.env.TEST_CLEANUP_RETRY_DELAY, 10);
  }

  // Logging
  if (process.env.TEST_CLEANUP_LOG_LEVEL) {
    const level = process.env.TEST_CLEANUP_LOG_LEVEL.toLowerCase();
    if (['error', 'warn', 'info', 'debug'].includes(level)) {
      config.logLevel = level as 'error' | 'warn' | 'info' | 'debug';
    }
  }

  if (process.env.TEST_CLEANUP_LOG_TO_FILE) {
    config.logToFile = process.env.TEST_CLEANUP_LOG_TO_FILE === 'true';
  }

  if (process.env.TEST_CLEANUP_LOG_FILE_PATH) {
    config.logFilePath = process.env.TEST_CLEANUP_LOG_FILE_PATH;
  }

  // Handle detection
  if (process.env.TEST_CLEANUP_DETECT_HANDLES) {
    config.detectHandles = process.env.TEST_CLEANUP_DETECT_HANDLES === 'true';
  }

  if (process.env.TEST_CLEANUP_HANDLE_DETECTION_TIMEOUT) {
    config.handleDetectionTimeout = parseInt(process.env.TEST_CLEANUP_HANDLE_DETECTION_TIMEOUT, 10);
  }

  // Strategies
  if (process.env.TEST_CLEANUP_DATABASE_STRATEGY) {
    const strategy = process.env.TEST_CLEANUP_DATABASE_STRATEGY.toLowerCase();
    if (['graceful', 'force', 'hybrid'].includes(strategy)) {
      config.databaseStrategy = strategy as 'graceful' | 'force' | 'hybrid';
    }
  }

  if (process.env.TEST_CLEANUP_SERVER_STRATEGY) {
    const strategy = process.env.TEST_CLEANUP_SERVER_STRATEGY.toLowerCase();
    if (['graceful', 'force', 'hybrid'].includes(strategy)) {
      config.serverStrategy = strategy as 'graceful' | 'force' | 'hybrid';
    }
  }

  // Additional configuration options
  if (process.env.TEST_CLEANUP_STRICT_MODE) {
    config.strictMode = process.env.TEST_CLEANUP_STRICT_MODE === 'true';
  }

  if (process.env.TEST_CLEANUP_ENABLE_METRICS) {
    config.enableMetrics = process.env.TEST_CLEANUP_ENABLE_METRICS === 'true';
  }

  if (process.env.TEST_CLEANUP_ENABLE_DIAGNOSTICS) {
    config.enableDiagnostics = process.env.TEST_CLEANUP_ENABLE_DIAGNOSTICS === 'true';
  }

  // Environment
  if (process.env.TEST_CLEANUP_ENVIRONMENT) {
    const env = process.env.TEST_CLEANUP_ENVIRONMENT.toLowerCase();
    if (['development', 'testing', 'ci', 'production'].includes(env)) {
      config.environment = env as 'development' | 'testing' | 'ci' | 'production';
    }
  }

  // Database specific configuration
  const databaseConfig: Partial<CleanupConfig['database']> = {};
  if (process.env.TEST_CLEANUP_DB_CONNECTION_TIMEOUT) {
    databaseConfig.connectionTimeout = parseInt(process.env.TEST_CLEANUP_DB_CONNECTION_TIMEOUT, 10);
  }
  if (process.env.TEST_CLEANUP_DB_QUERY_TIMEOUT) {
    databaseConfig.queryTimeout = parseInt(process.env.TEST_CLEANUP_DB_QUERY_TIMEOUT, 10);
  }
  if (process.env.TEST_CLEANUP_DB_POOL_CLEANUP_TIMEOUT) {
    databaseConfig.poolCleanupTimeout = parseInt(process.env.TEST_CLEANUP_DB_POOL_CLEANUP_TIMEOUT, 10);
  }
  if (Object.keys(databaseConfig).length > 0) {
    config.database = databaseConfig as CleanupConfig['database'];
  }

  // Server specific configuration
  const serverConfig: Partial<CleanupConfig['server']> = {};
  if (process.env.TEST_CLEANUP_SERVER_SHUTDOWN_TIMEOUT) {
    serverConfig.shutdownTimeout = parseInt(process.env.TEST_CLEANUP_SERVER_SHUTDOWN_TIMEOUT, 10);
  }
  if (process.env.TEST_CLEANUP_SERVER_KEEPALIVE_TIMEOUT) {
    serverConfig.keepAliveTimeout = parseInt(process.env.TEST_CLEANUP_SERVER_KEEPALIVE_TIMEOUT, 10);
  }
  if (process.env.TEST_CLEANUP_SERVER_REQUEST_TIMEOUT) {
    serverConfig.requestTimeout = parseInt(process.env.TEST_CLEANUP_SERVER_REQUEST_TIMEOUT, 10);
  }
  if (Object.keys(serverConfig).length > 0) {
    config.server = serverConfig as CleanupConfig['server'];
  }

  // Timer specific configuration
  const timerConfig: Partial<CleanupConfig['timer']> = {};
  if (process.env.TEST_CLEANUP_TIMER_BATCH_SIZE) {
    timerConfig.cleanupBatchSize = parseInt(process.env.TEST_CLEANUP_TIMER_BATCH_SIZE, 10);
  }
  if (process.env.TEST_CLEANUP_TIMER_MAX_ACTIVE) {
    timerConfig.maxActiveTimers = parseInt(process.env.TEST_CLEANUP_TIMER_MAX_ACTIVE, 10);
  }
  if (Object.keys(timerConfig).length > 0) {
    config.timer = timerConfig as CleanupConfig['timer'];
  }

  return config;
}

/**
 * Get configuration optimized for CI environments
 */
export function getCIConfig(): Partial<CleanupConfig> {
  return {
    gracefulTimeout: 15000, // Longer timeout for CI
    forceTimeout: 20000,
    maxRetries: 2, // Fewer retries in CI
    retryDelay: 500, // Shorter delay in CI
    logLevel: 'warn', // Less verbose logging in CI
    logToFile: true,
    detectHandles: true,
    handleDetectionTimeout: 3000,
    databaseStrategy: 'hybrid',
    serverStrategy: 'hybrid',
    strictMode: true, // Enable strict mode in CI
    enableMetrics: true,
    enableDiagnostics: true,
    database: {
      connectionTimeout: 10000, // Longer timeout for CI
      queryTimeout: 45000,
      poolCleanupTimeout: 15000
    },
    server: {
      shutdownTimeout: 10000, // Longer timeout for CI
      keepAliveTimeout: 8000,
      requestTimeout: 45000
    },
    timer: {
      cleanupBatchSize: 50, // Smaller batches in CI
      maxActiveTimers: 500
    },
    environment: 'ci'
  };
}

/**
 * Get configuration optimized for development
 */
export function getDevConfig(): Partial<CleanupConfig> {
  return {
    gracefulTimeout: 3000, // Shorter timeout for dev
    forceTimeout: 8000,
    maxRetries: 3,
    retryDelay: 1000,
    logLevel: 'info', // More verbose logging in dev
    logToFile: false,
    detectHandles: true,
    handleDetectionTimeout: 2000,
    databaseStrategy: 'graceful', // Prefer graceful in dev
    serverStrategy: 'graceful',
    strictMode: false, // Relaxed mode in development
    enableMetrics: true,
    enableDiagnostics: true,
    database: {
      connectionTimeout: 3000, // Shorter timeout for dev
      queryTimeout: 20000,
      poolCleanupTimeout: 5000
    },
    server: {
      shutdownTimeout: 3000, // Shorter timeout for dev
      keepAliveTimeout: 3000,
      requestTimeout: 20000
    },
    timer: {
      cleanupBatchSize: 100,
      maxActiveTimers: 1000
    },
    environment: 'development'
  };
}

/**
 * Get configuration optimized for testing environments
 */
export function getTestConfig(): Partial<CleanupConfig> {
  return {
    gracefulTimeout: 5000, // Standard timeout for tests
    forceTimeout: 10000,
    maxRetries: 2, // Fewer retries in tests
    retryDelay: 500, // Shorter delay in tests
    logLevel: 'error', // Minimal logging in tests
    logToFile: false,
    detectHandles: true,
    handleDetectionTimeout: 2500,
    databaseStrategy: 'hybrid',
    serverStrategy: 'hybrid',
    strictMode: true, // Enable strict mode in testing
    enableMetrics: false, // Disable metrics for faster tests
    enableDiagnostics: true,
    database: {
      connectionTimeout: 5000,
      queryTimeout: 15000,
      poolCleanupTimeout: 8000
    },
    server: {
      shutdownTimeout: 5000,
      keepAliveTimeout: 4000,
      requestTimeout: 15000
    },
    timer: {
      cleanupBatchSize: 200, // Larger batches for faster cleanup
      maxActiveTimers: 500
    },
    environment: 'testing'
  };
}

/**
 * Create a complete configuration by merging defaults with environment and custom config
 */
export function createCleanupConfig(customConfig?: Partial<CleanupConfig>): CleanupConfig {
  const envConfig = getConfigFromEnv();
  
  // Determine base config based on environment
  let baseConfig: Partial<CleanupConfig>;
  if (process.env.CI === 'true') {
    baseConfig = getCIConfig();
  } else if (process.env.NODE_ENV === 'test') {
    baseConfig = getTestConfig();
  } else {
    baseConfig = getDevConfig();
  }
  
  // Merge configurations with proper deep merge for nested objects
  const mergedConfig = {
    ...DEFAULT_CLEANUP_CONFIG,
    ...baseConfig,
    ...envConfig,
    ...customConfig
  };

  // Deep merge nested objects
  if (baseConfig.database || envConfig.database || customConfig?.database) {
    mergedConfig.database = {
      ...DEFAULT_CLEANUP_CONFIG.database,
      ...baseConfig.database,
      ...envConfig.database,
      ...customConfig?.database
    };
  }

  if (baseConfig.server || envConfig.server || customConfig?.server) {
    mergedConfig.server = {
      ...DEFAULT_CLEANUP_CONFIG.server,
      ...baseConfig.server,
      ...envConfig.server,
      ...customConfig?.server
    };
  }

  if (baseConfig.timer || envConfig.timer || customConfig?.timer) {
    mergedConfig.timer = {
      ...DEFAULT_CLEANUP_CONFIG.timer,
      ...baseConfig.timer,
      ...envConfig.timer,
      ...customConfig?.timer
    };
  }

  return mergedConfig;
}

/**
 * Validate configuration values
 */
export function validateConfig(config: CleanupConfig): string[] {
  const errors: string[] = [];

  // Basic timeout validations
  if (config.gracefulTimeout < 0) {
    errors.push('gracefulTimeout must be non-negative');
  }

  if (config.forceTimeout < config.gracefulTimeout) {
    errors.push('forceTimeout must be greater than or equal to gracefulTimeout');
  }

  if (config.maxRetries < 0) {
    errors.push('maxRetries must be non-negative');
  }

  if (config.retryDelay < 0) {
    errors.push('retryDelay must be non-negative');
  }

  if (config.handleDetectionTimeout < 0) {
    errors.push('handleDetectionTimeout must be non-negative');
  }

  // Logging validations
  if (config.logToFile && !config.logFilePath) {
    errors.push('logFilePath is required when logToFile is true');
  }

  // Database configuration validations
  if (config.database.connectionTimeout < 0) {
    errors.push('database.connectionTimeout must be non-negative');
  }

  if (config.database.queryTimeout < 0) {
    errors.push('database.queryTimeout must be non-negative');
  }

  if (config.database.poolCleanupTimeout < 0) {
    errors.push('database.poolCleanupTimeout must be non-negative');
  }

  // Server configuration validations
  if (config.server.shutdownTimeout < 0) {
    errors.push('server.shutdownTimeout must be non-negative');
  }

  if (config.server.keepAliveTimeout < 0) {
    errors.push('server.keepAliveTimeout must be non-negative');
  }

  if (config.server.requestTimeout < 0) {
    errors.push('server.requestTimeout must be non-negative');
  }

  // Timer configuration validations
  if (config.timer.cleanupBatchSize <= 0) {
    errors.push('timer.cleanupBatchSize must be positive');
  }

  if (config.timer.maxActiveTimers <= 0) {
    errors.push('timer.maxActiveTimers must be positive');
  }

  // Logical validations
  if (config.database.connectionTimeout > config.gracefulTimeout) {
    errors.push('database.connectionTimeout should not exceed gracefulTimeout');
  }

  if (config.server.shutdownTimeout > config.gracefulTimeout) {
    errors.push('server.shutdownTimeout should not exceed gracefulTimeout');
  }

  // Reasonable limits validations
  if (config.gracefulTimeout > 60000) {
    errors.push('gracefulTimeout should not exceed 60 seconds for reasonable test performance');
  }

  if (config.maxRetries > 10) {
    errors.push('maxRetries should not exceed 10 to prevent infinite loops');
  }

  if (config.timer.maxActiveTimers > 10000) {
    errors.push('timer.maxActiveTimers should not exceed 10000 for memory safety');
  }

  return errors;
}

/**
 * Validate and throw if configuration is invalid
 */
export function validateConfigOrThrow(config: CleanupConfig): void {
  const errors = validateConfig(config);
  if (errors.length > 0) {
    throw new Error(`Invalid cleanup configuration:\n${errors.join('\n')}`);
  }
}

/**
 * Get configuration with validation
 */
export function getValidatedConfig(customConfig?: Partial<CleanupConfig>): CleanupConfig {
  const config = createCleanupConfig(customConfig);
  validateConfigOrThrow(config);
  return config;
}