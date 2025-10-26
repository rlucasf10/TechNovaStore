# Test Resource Cleanup Environment Variables

This document describes all available environment variables for configuring the test resource cleanup system.

## Basic Configuration

### Timeouts

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TEST_CLEANUP_TIMEOUT` | Graceful shutdown timeout in milliseconds | 5000 | `TEST_CLEANUP_TIMEOUT=8000` |
| `TEST_CLEANUP_FORCE_TIMEOUT` | Force shutdown timeout in milliseconds | 10000 | `TEST_CLEANUP_FORCE_TIMEOUT=15000` |

### Retry Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TEST_CLEANUP_MAX_RETRIES` | Maximum number of retry attempts | 3 | `TEST_CLEANUP_MAX_RETRIES=2` |
| `TEST_CLEANUP_RETRY_DELAY` | Delay between retry attempts in milliseconds | 1000 | `TEST_CLEANUP_RETRY_DELAY=500` |

### Logging Configuration

| Variable | Description | Default | Valid Values | Example |
|----------|-------------|---------|--------------|---------|
| `TEST_CLEANUP_LOG_LEVEL` | Log level for cleanup operations | info | error, warn, info, debug | `TEST_CLEANUP_LOG_LEVEL=debug` |
| `TEST_CLEANUP_LOG_TO_FILE` | Enable file logging | false | true, false | `TEST_CLEANUP_LOG_TO_FILE=true` |
| `TEST_CLEANUP_LOG_FILE_PATH` | Path to log file (required if logging to file) | - | - | `TEST_CLEANUP_LOG_FILE_PATH=./logs/cleanup.log` |

## Advanced Configuration

### Handle Detection

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TEST_CLEANUP_DETECT_HANDLES` | Enable open handle detection | true | `TEST_CLEANUP_DETECT_HANDLES=false` |
| `TEST_CLEANUP_HANDLE_DETECTION_TIMEOUT` | Handle detection timeout in milliseconds | 2000 | `TEST_CLEANUP_HANDLE_DETECTION_TIMEOUT=3000` |

### Cleanup Strategies

| Variable | Description | Default | Valid Values | Example |
|----------|-------------|---------|--------------|---------|
| `TEST_CLEANUP_DATABASE_STRATEGY` | Database cleanup strategy | hybrid | graceful, force, hybrid | `TEST_CLEANUP_DATABASE_STRATEGY=graceful` |
| `TEST_CLEANUP_SERVER_STRATEGY` | Server cleanup strategy | hybrid | graceful, force, hybrid | `TEST_CLEANUP_SERVER_STRATEGY=force` |

### System Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TEST_CLEANUP_STRICT_MODE` | Enable strict mode for enhanced validation | false | `TEST_CLEANUP_STRICT_MODE=true` |
| `TEST_CLEANUP_ENABLE_METRICS` | Enable performance metrics collection | true | `TEST_CLEANUP_ENABLE_METRICS=false` |
| `TEST_CLEANUP_ENABLE_DIAGNOSTICS` | Enable diagnostic tools | true | `TEST_CLEANUP_ENABLE_DIAGNOSTICS=false` |
| `TEST_CLEANUP_ENVIRONMENT` | Environment type | development | development, testing, ci, production | `TEST_CLEANUP_ENVIRONMENT=ci` |

## Resource-Specific Configuration

### Database Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TEST_CLEANUP_DB_CONNECTION_TIMEOUT` | Database connection timeout in milliseconds | 5000 | `TEST_CLEANUP_DB_CONNECTION_TIMEOUT=8000` |
| `TEST_CLEANUP_DB_QUERY_TIMEOUT` | Database query timeout in milliseconds | 30000 | `TEST_CLEANUP_DB_QUERY_TIMEOUT=45000` |
| `TEST_CLEANUP_DB_POOL_CLEANUP_TIMEOUT` | Database pool cleanup timeout in milliseconds | 10000 | `TEST_CLEANUP_DB_POOL_CLEANUP_TIMEOUT=15000` |

### Server Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TEST_CLEANUP_SERVER_SHUTDOWN_TIMEOUT` | Server shutdown timeout in milliseconds | 5000 | `TEST_CLEANUP_SERVER_SHUTDOWN_TIMEOUT=8000` |
| `TEST_CLEANUP_SERVER_KEEPALIVE_TIMEOUT` | Server keep-alive timeout in milliseconds | 5000 | `TEST_CLEANUP_SERVER_KEEPALIVE_TIMEOUT=3000` |
| `TEST_CLEANUP_SERVER_REQUEST_TIMEOUT` | Server request timeout in milliseconds | 30000 | `TEST_CLEANUP_SERVER_REQUEST_TIMEOUT=45000` |

### Timer Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TEST_CLEANUP_TIMER_BATCH_SIZE` | Timer cleanup batch size | 100 | `TEST_CLEANUP_TIMER_BATCH_SIZE=200` |
| `TEST_CLEANUP_TIMER_MAX_ACTIVE` | Maximum active timers allowed | 1000 | `TEST_CLEANUP_TIMER_MAX_ACTIVE=2000` |

## Environment Presets

The system automatically detects the environment and applies appropriate presets:

### Development Environment
```bash
TEST_CLEANUP_TIMEOUT=3000
TEST_CLEANUP_FORCE_TIMEOUT=8000
TEST_CLEANUP_LOG_LEVEL=info
TEST_CLEANUP_LOG_TO_FILE=false
TEST_CLEANUP_DATABASE_STRATEGY=graceful
TEST_CLEANUP_SERVER_STRATEGY=graceful
TEST_CLEANUP_STRICT_MODE=false
```

### Testing Environment
```bash
TEST_CLEANUP_TIMEOUT=5000
TEST_CLEANUP_FORCE_TIMEOUT=10000
TEST_CLEANUP_LOG_LEVEL=error
TEST_CLEANUP_LOG_TO_FILE=false
TEST_CLEANUP_STRICT_MODE=true
TEST_CLEANUP_ENABLE_METRICS=false
```

### CI Environment
```bash
TEST_CLEANUP_TIMEOUT=15000
TEST_CLEANUP_FORCE_TIMEOUT=20000
TEST_CLEANUP_LOG_LEVEL=warn
TEST_CLEANUP_LOG_TO_FILE=true
TEST_CLEANUP_STRICT_MODE=true
TEST_CLEANUP_DB_CONNECTION_TIMEOUT=10000
TEST_CLEANUP_SERVER_SHUTDOWN_TIMEOUT=10000
```

### Production Environment
```bash
TEST_CLEANUP_TIMEOUT=10000
TEST_CLEANUP_FORCE_TIMEOUT=15000
TEST_CLEANUP_LOG_LEVEL=error
TEST_CLEANUP_LOG_TO_FILE=true
TEST_CLEANUP_STRICT_MODE=true
TEST_CLEANUP_ENABLE_METRICS=false
TEST_CLEANUP_ENABLE_DIAGNOSTICS=false
```

## Usage Examples

### Basic Setup
```bash
# Set basic timeouts
export TEST_CLEANUP_TIMEOUT=8000
export TEST_CLEANUP_FORCE_TIMEOUT=12000

# Enable debug logging
export TEST_CLEANUP_LOG_LEVEL=debug
```

### CI/CD Setup
```bash
# CI optimized configuration
export TEST_CLEANUP_TIMEOUT=20000
export TEST_CLEANUP_FORCE_TIMEOUT=30000
export TEST_CLEANUP_LOG_LEVEL=warn
export TEST_CLEANUP_LOG_TO_FILE=true
export TEST_CLEANUP_LOG_FILE_PATH=./logs/test-cleanup.log
export TEST_CLEANUP_STRICT_MODE=true
```

### Performance Testing Setup
```bash
# Fast cleanup for performance tests
export TEST_CLEANUP_TIMEOUT=1000
export TEST_CLEANUP_FORCE_TIMEOUT=3000
export TEST_CLEANUP_LOG_LEVEL=error
export TEST_CLEANUP_ENABLE_METRICS=true
export TEST_CLEANUP_ENABLE_DIAGNOSTICS=false
```

### Database-Heavy Tests Setup
```bash
# Optimized for database operations
export TEST_CLEANUP_DATABASE_STRATEGY=graceful
export TEST_CLEANUP_DB_CONNECTION_TIMEOUT=10000
export TEST_CLEANUP_DB_QUERY_TIMEOUT=60000
export TEST_CLEANUP_DB_POOL_CLEANUP_TIMEOUT=15000
```

## Environment Detection

The system automatically detects the environment based on these conditions:

1. **CI Environment**: `process.env.CI === 'true'`
2. **Testing Environment**: `process.env.NODE_ENV === 'test'`
3. **Production Environment**: `process.env.NODE_ENV === 'production'`
4. **Development Environment**: Default fallback

## Validation

The system validates all environment variables and will:

1. Warn about invalid values and use defaults
2. Check for logical conflicts (e.g., force timeout < graceful timeout)
3. Ensure required dependencies (e.g., log file path when logging to file)
4. Validate numeric ranges and reasonable limits

## Best Practices

1. **Use environment-specific configurations**: Let the system auto-detect or explicitly set `TEST_CLEANUP_ENVIRONMENT`
2. **Start with defaults**: Only override specific values you need to change
3. **Use CI-specific settings**: Enable strict mode and file logging in CI
4. **Monitor performance**: Enable metrics in development and CI to identify bottlenecks
5. **Validate configuration**: Check logs for validation warnings
6. **Document custom settings**: Comment your environment-specific overrides

## Troubleshooting

### Common Issues

1. **Tests hanging**: Increase `TEST_CLEANUP_FORCE_TIMEOUT`
2. **Premature cleanup**: Increase `TEST_CLEANUP_TIMEOUT`
3. **Too verbose logging**: Set `TEST_CLEANUP_LOG_LEVEL=error`
4. **Missing log files**: Ensure `TEST_CLEANUP_LOG_FILE_PATH` is writable
5. **Configuration conflicts**: Check validation warnings in logs

### Debug Configuration

```bash
# Enable maximum debugging
export TEST_CLEANUP_LOG_LEVEL=debug
export TEST_CLEANUP_ENABLE_DIAGNOSTICS=true
export TEST_CLEANUP_DETECT_HANDLES=true
export TEST_CLEANUP_STRICT_MODE=true
```