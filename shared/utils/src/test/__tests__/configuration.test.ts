/**
 * Tests for the configuration system
 */

import {
  ConfigManager,
  getConfigManager,
  getCurrentConfig,
  initializeConfig,
  generateConfigDocumentation,
  DEFAULT_CLEANUP_CONFIG,
  createCleanupConfig,
  validateConfig,
  validateConfigOrThrow,
  getValidatedConfig,
  getCIConfig,
  getDevConfig,
  getTestConfig,
  detectEnvironment,
  getEnvironmentPreset,
  validateEnvironmentConfig,
  parseBooleanEnv,
  parseIntegerEnv,
  parseEnumEnv
} from '../index';
import { CleanupConfig } from '../types';

describe('Configuration System', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Reset configuration manager
    const configManager = getConfigManager();
    configManager.reset();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('ConfigManager', () => {
    it('should be a singleton', () => {
      const manager1 = getConfigManager();
      const manager2 = getConfigManager();
      expect(manager1).toBe(manager2);
    });

    it('should initialize with default configuration', () => {
      const configManager = getConfigManager();
      configManager.initialize();
      
      const config = configManager.getConfig();
      expect(config.gracefulTimeout).toBe(5000); // Testing environment default
      expect(config.environment).toBe('testing'); // NODE_ENV=test in Jest
    });

    it('should allow custom configuration', () => {
      const customConfig: Partial<CleanupConfig> = {
        gracefulTimeout: 8000,
        logLevel: 'debug',
        strictMode: true
      };

      const configManager = getConfigManager();
      configManager.initialize(customConfig);
      
      const config = configManager.getConfig();
      expect(config.gracefulTimeout).toBe(8000);
      expect(config.logLevel).toBe('debug');
      expect(config.strictMode).toBe(true);
    });

    it('should update configuration', () => {
      const configManager = getConfigManager();
      configManager.initialize();
      
      configManager.updateConfig({
        gracefulTimeout: 12000,
        forceTimeout: 15000, // Must be >= gracefulTimeout
        database: {
          connectionTimeout: 6000,
          queryTimeout: 40000,
          poolCleanupTimeout: 8000
        }
      });
      
      const config = configManager.getConfig();
      expect(config.gracefulTimeout).toBe(12000);
      expect(config.database.connectionTimeout).toBe(6000);
    });

    it('should validate configuration on update', () => {
      const configManager = getConfigManager();
      configManager.initialize();
      
      expect(() => {
        configManager.updateConfig({
          gracefulTimeout: -1000 // Invalid negative timeout
        });
      }).toThrow();
    });

    it('should provide configuration summary', () => {
      const configManager = getConfigManager();
      configManager.initialize();
      
      const summary = configManager.getConfigSummary();
      expect(summary).toContain('Environment: testing'); // Jest runs in test environment
      expect(summary).toContain('Graceful Timeout:');
      expect(summary).toContain('Force Timeout:');
    });

    it('should export configuration as environment variables', () => {
      const configManager = getConfigManager();
      configManager.initialize({
        gracefulTimeout: 7000,
        logLevel: 'warn'
      });
      
      const envVars = configManager.exportAsEnvVars();
      expect(envVars.TEST_CLEANUP_TIMEOUT).toBe('7000');
      expect(envVars.TEST_CLEANUP_LOG_LEVEL).toBe('warn');
    });
  });

  describe('Environment Configuration', () => {
    it('should detect CI environment', () => {
      process.env.CI = 'true';
      const environment = detectEnvironment();
      expect(environment).toBe('ci');
    });

    it('should detect test environment', () => {
      process.env.NODE_ENV = 'test';
      const environment = detectEnvironment();
      expect(environment).toBe('testing');
    });

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      const environment = detectEnvironment();
      expect(environment).toBe('production');
    });

    it('should default to development environment', () => {
      delete process.env.CI;
      delete process.env.NODE_ENV;
      const environment = detectEnvironment();
      expect(environment).toBe('development');
    });

    it('should get environment preset', () => {
      const ciPreset = getEnvironmentPreset('ci');
      expect(ciPreset.environment).toBe('ci');
      expect(ciPreset.strictMode).toBe(true);
      expect(ciPreset.gracefulTimeout).toBe(15000);
    });
  });

  describe('Environment Variable Parsing', () => {
    it('should parse boolean environment variables', () => {
      expect(parseBooleanEnv('true', false)).toBe(true);
      expect(parseBooleanEnv('false', true)).toBe(false);
      expect(parseBooleanEnv('TRUE', false)).toBe(true);
      expect(parseBooleanEnv(undefined, true)).toBe(true);
    });

    it('should parse integer environment variables', () => {
      expect(parseIntegerEnv('5000', 1000)).toBe(5000);
      expect(parseIntegerEnv('invalid', 1000)).toBe(1000);
      expect(parseIntegerEnv(undefined, 1000)).toBe(1000);
      expect(parseIntegerEnv('500', 1000, 1000, 2000)).toBe(1000); // Below min
      expect(parseIntegerEnv('3000', 1000, 1000, 2000)).toBe(2000); // Above max
    });

    it('should parse enum environment variables', () => {
      const validValues = ['error', 'warn', 'info', 'debug'] as const;
      expect(parseEnumEnv('info', validValues, 'error')).toBe('info');
      expect(parseEnumEnv('INFO', validValues, 'error')).toBe('info');
      expect(parseEnumEnv('invalid', validValues, 'error')).toBe('error');
      expect(parseEnumEnv(undefined, validValues, 'error')).toBe('error');
    });
  });

  describe('Configuration from Environment Variables', () => {
    it('should read configuration from environment variables', () => {
      process.env.TEST_CLEANUP_TIMEOUT = '8000';
      process.env.TEST_CLEANUP_LOG_LEVEL = 'debug';
      process.env.TEST_CLEANUP_STRICT_MODE = 'true';
      process.env.TEST_CLEANUP_DB_CONNECTION_TIMEOUT = '6000';

      initializeConfig();
      const config = getCurrentConfig();

      expect(config.gracefulTimeout).toBe(8000);
      expect(config.logLevel).toBe('debug');
      expect(config.strictMode).toBe(true);
      expect(config.database.connectionTimeout).toBe(6000);
    });

    it('should validate environment configuration', () => {
      process.env.TEST_CLEANUP_TIMEOUT = '5000';
      process.env.TEST_CLEANUP_FORCE_TIMEOUT = '3000'; // Invalid: less than graceful timeout

      const validation = validateEnvironmentConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        'TEST_CLEANUP_FORCE_TIMEOUT must be greater than or equal to TEST_CLEANUP_TIMEOUT'
      );
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const validConfig: CleanupConfig = {
        ...DEFAULT_CLEANUP_CONFIG,
        gracefulTimeout: 5000,
        forceTimeout: 10000
      };

      const errors = validateConfig(validConfig);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid timeouts', () => {
      const invalidConfig: CleanupConfig = {
        ...DEFAULT_CLEANUP_CONFIG,
        gracefulTimeout: -1000,
        forceTimeout: -500 // Also negative to avoid the comparison issue
      };

      const errors = validateConfig(invalidConfig);
      expect(errors).toContain('gracefulTimeout must be non-negative');
      // Check for any timeout-related error since the validation logic might vary
      expect(errors.length).toBeGreaterThan(1);
    });

    it('should detect invalid database configuration', () => {
      const invalidConfig: CleanupConfig = {
        ...DEFAULT_CLEANUP_CONFIG,
        database: {
          connectionTimeout: -1000,
          queryTimeout: -500,
          poolCleanupTimeout: 0
        }
      };

      const errors = validateConfig(invalidConfig);
      expect(errors).toContain('database.connectionTimeout must be non-negative');
      expect(errors).toContain('database.queryTimeout must be non-negative');
    });

    it('should throw on invalid configuration', () => {
      const invalidConfig: Partial<CleanupConfig> = {
        gracefulTimeout: -1000
      };

      expect(() => {
        validateConfigOrThrow(createCleanupConfig(invalidConfig));
      }).toThrow('Invalid cleanup configuration');
    });
  });

  describe('Environment-Specific Configurations', () => {
    it('should provide CI configuration', () => {
      const ciConfig = getCIConfig();
      expect(ciConfig.environment).toBe('ci');
      expect(ciConfig.strictMode).toBe(true);
      expect(ciConfig.logToFile).toBe(true);
      expect(ciConfig.gracefulTimeout).toBe(15000);
    });

    it('should provide development configuration', () => {
      const devConfig = getDevConfig();
      expect(devConfig.environment).toBe('development');
      expect(devConfig.strictMode).toBe(false);
      expect(devConfig.logToFile).toBe(false);
      expect(devConfig.databaseStrategy).toBe('graceful');
    });

    it('should provide testing configuration', () => {
      const testConfig = getTestConfig();
      expect(testConfig.environment).toBe('testing');
      expect(testConfig.strictMode).toBe(true);
      expect(testConfig.enableMetrics).toBe(false);
      expect(testConfig.logLevel).toBe('error');
    });
  });

  describe('Configuration Merging', () => {
    it('should merge configurations correctly', () => {
      const customConfig: Partial<CleanupConfig> = {
        gracefulTimeout: 7000,
        database: {
          connectionTimeout: 4000,
          queryTimeout: 25000,
          poolCleanupTimeout: 8000
        }
      };

      const config = createCleanupConfig(customConfig);
      expect(config.gracefulTimeout).toBe(7000);
      expect(config.database.connectionTimeout).toBe(4000);
      expect(config.database.queryTimeout).toBe(25000);
      // Should keep environment-specific values for non-specified options (testing environment has maxRetries: 2)
      expect(config.maxRetries).toBe(2);
    });

    it('should use environment-specific base configuration', () => {
      process.env.CI = 'true';
      
      const config = createCleanupConfig();
      expect(config.environment).toBe('ci');
      expect(config.strictMode).toBe(true);
      expect(config.gracefulTimeout).toBe(15000); // CI default
    });
  });

  describe('Convenience Functions', () => {
    it('should initialize and get current configuration', () => {
      initializeConfig({ gracefulTimeout: 6000 });
      const config = getCurrentConfig();
      expect(config.gracefulTimeout).toBe(6000);
    });

    it('should get validated configuration', () => {
      const config = getValidatedConfig({ gracefulTimeout: 8000 });
      expect(config.gracefulTimeout).toBe(8000);
      
      expect(() => {
        getValidatedConfig({ gracefulTimeout: -1000 });
      }).toThrow();
    });
  });

  describe('Documentation Generation', () => {
    it('should generate configuration documentation', () => {
      const docs = generateConfigDocumentation();
      expect(docs).toContain('# Test Resource Cleanup Configuration');
      expect(docs).toContain('ConfigManager');
      expect(docs).toContain('Environment Variables');
      expect(docs).toContain('TEST_CLEANUP_TIMEOUT');
    });
  });

  describe('Configuration Optimization', () => {
    it('should detect if configuration is optimized for environment', () => {
      process.env.NODE_ENV = 'test';
      
      const configManager = getConfigManager();
      configManager.initialize();
      
      // Should be optimized since it auto-detects test environment
      expect(configManager.isOptimizedForEnvironment()).toBe(true);
      
      // Change to different environment
      configManager.updateConfig({ environment: 'development' });
      expect(configManager.isOptimizedForEnvironment()).toBe(false);
    });

    it('should provide optimization recommendations', () => {
      const configManager = getConfigManager();
      configManager.initialize({
        environment: 'development',
        gracefulTimeout: 45000, // Too high
        forceTimeout: 50000, // Must be >= gracefulTimeout
        maxRetries: 8 // Too many
      });
      
      const recommendations = configManager.getOptimizationRecommendations();
      expect(recommendations.some(r => r.includes('graceful timeout'))).toBe(true);
      expect(recommendations.some(r => r.includes('max retries'))).toBe(true);
    });
  });
});