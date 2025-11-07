/**
 * CI Environment Configuration
 * Sets up environment variables and configurations specific to CI/CD environments
 */

// Force CI environment
process.env.CI = 'true';
process.env.NODE_ENV = 'test';

// Logging configuration for CI
process.env.LOG_LEVEL = 'error';
process.env.DEBUG = 'false';

// Resource cleanup configuration for CI
process.env.TEST_CLEANUP_TIMEOUT = '15000';
process.env.TEST_CLEANUP_FORCE_TIMEOUT = '25000';
process.env.TEST_CLEANUP_LOG_LEVEL = 'error';
process.env.TEST_CLEANUP_DETECT_HANDLES = 'true';
process.env.TEST_CLEANUP_STRICT_MODE = 'true';
process.env.TEST_CLEANUP_LOG_TO_FILE = 'true';
process.env.TEST_CLEANUP_LOG_FILE_PATH = 'coverage/cleanup.log';

// Database configuration for CI
process.env.MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/technovastore_ci_test';
process.env.POSTGRES_TEST_URI = process.env.POSTGRES_TEST_URI || 'postgresql://localhost:5432/technovastore_ci_test';

// Performance configuration for CI
process.env.TEST_CONCURRENCY = '2';
process.env.TEST_MAX_WORKERS = '2';

// Security configuration for CI
process.env.JWT_SECRET = 'ci-test-jwt-secret-key-for-automated-tests';
process.env.ENCRYPTION_KEY = 'ci-test-encryption-key-32-chars-long';

// External service mocking (always enabled in CI)
process.env.MOCK_EXTERNAL_SERVICES = 'true';
process.env.MOCK_PAYMENT_PROVIDERS = 'true';
process.env.MOCK_SHIPPING_PROVIDERS = 'true';
process.env.MOCK_EMAIL_SERVICE = 'true';

console.log('CI environment configured for tests');