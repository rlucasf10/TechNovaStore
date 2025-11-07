/**
 * Environment Configuration for Integration Tests
 * Sets up environment variables and test-specific configurations
 */

// Test environment configuration
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = process.env.CI ? 'error' : 'warn';

// Database configuration for integration tests
process.env.MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/technovastore_integration_test';
process.env.POSTGRES_TEST_URI = process.env.POSTGRES_TEST_URI || 'postgresql://localhost:5432/technovastore_integration_test';

// Test server configuration
process.env.TEST_SERVER_PORT_RANGE_START = '3100';
process.env.TEST_SERVER_PORT_RANGE_END = '3199';

// Resource cleanup configuration
process.env.TEST_CLEANUP_TIMEOUT = process.env.CI ? '20000' : '15000';
process.env.TEST_CLEANUP_FORCE_TIMEOUT = process.env.CI ? '30000' : '20000';
process.env.TEST_CLEANUP_LOG_LEVEL = process.env.CI ? 'error' : 'warn';
process.env.TEST_CLEANUP_DETECT_HANDLES = 'true';

// CI-specific configuration
if (process.env.CI) {
  process.env.TEST_CLEANUP_STRICT_MODE = 'true';
  process.env.TEST_CLEANUP_LOG_TO_FILE = 'true';
  process.env.TEST_CLEANUP_LOG_FILE_PATH = 'coverage/integration/cleanup.log';
}

// External service mocking
process.env.MOCK_EXTERNAL_SERVICES = 'true';
process.env.MOCK_PAYMENT_PROVIDERS = 'true';
process.env.MOCK_SHIPPING_PROVIDERS = 'true';

// Security configuration for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';

console.log('Integration test environment configured');