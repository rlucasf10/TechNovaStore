# TechNovaStore Load Testing Suite

This directory contains comprehensive load testing configurations and tools for the TechNovaStore automated e-commerce platform.

## Overview

The load testing suite is designed to validate the performance, scalability, and reliability of the TechNovaStore API under various load conditions. It uses Artillery.io as the primary load testing framework and includes custom utilities for monitoring and reporting.

## Test Configurations

### 1. Basic Load Test (`load-test.yml`)
- **Purpose**: General API performance validation
- **Load Pattern**: Gradual ramp-up to sustained load
- **Duration**: ~4 minutes total
- **Target RPS**: Up to 50 requests per second
- **Scenarios**: Public API endpoints, product browsing, search functionality

### 2. Critical APIs Test (`critical-apis.yml`)
- **Purpose**: Stress testing for business-critical endpoints
- **Load Pattern**: Focused high-intensity testing
- **Duration**: ~4 minutes total
- **Target RPS**: Up to 100 requests per second
- **Scenarios**: Authentication, order processing, payment handling

### 3. Stress Test (`stress-test.yml`)
- **Purpose**: Find system breaking points and limits
- **Load Pattern**: Extreme load with traffic spikes
- **Duration**: ~5 minutes total
- **Target RPS**: Up to 1000 requests per second (spike)
- **Scenarios**: Heavy search loads, concurrent browsing, system resource stress

### 4. Performance Benchmark (`benchmark.yml`)
- **Purpose**: Establish performance baselines and SLA validation
- **Load Pattern**: Controlled load progression
- **Duration**: ~8 minutes total
- **Target RPS**: Progressive from 1 to 100 requests per second
- **Scenarios**: Comprehensive API coverage with detailed metrics

## Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Artillery** (installed automatically by the runner script)
3. **Running TechNovaStore services** (API Gateway on port 3000)

### Installation

```bash
# Install dependencies
npm install

# Artillery will be installed automatically when running tests
```

### Running Tests

#### Using NPM Scripts (Recommended)

```bash
# Run basic load test
npm run test:load

# Run critical APIs stress test
npm run test:load:critical

# Run stress test
npm run test:stress

# Run performance benchmark with report generation
npm run test:benchmark

# Generate HTML report from JSON results
npm run test:load:report
```

#### Using the Test Runner Script

```bash
# Navigate to load test directory
cd tests/load

# Run individual tests
node run-load-tests.js load
node run-load-tests.js critical
node run-load-tests.js stress
node run-load-tests.js benchmark

# Run all tests in sequence
node run-load-tests.js all

# Run with custom target
node run-load-tests.js load --target http://staging.technovastore.com

# Run with environment configuration
node run-load-tests.js benchmark --environment staging
```

#### Using Artillery Directly

```bash
# Basic usage
artillery run load-test.yml

# With custom target
artillery run load-test.yml --target http://localhost:3000

# With output report
artillery run benchmark.yml --output reports/benchmark-report.json

# Generate HTML report
artillery report reports/benchmark-report.json
```

## Performance Monitoring

### Real-time Performance Monitor

The performance monitor provides real-time metrics during load tests:

```bash
# Start performance monitoring
node performance-monitor.js

# Custom configuration
node performance-monitor.js --target http://localhost:3000 --interval 5000 --duration 300000

# Monitor specific environment
node performance-monitor.js --target https://staging.technovastore.com --duration 600000
```

### Monitor Features

- **Real-time metrics**: Response times, success rates, system resources
- **Multiple endpoints**: Monitors critical API endpoints simultaneously
- **System metrics**: Memory usage, CPU usage, load average
- **Automatic reporting**: Generates detailed JSON reports
- **Graceful shutdown**: Handles SIGINT/SIGTERM for clean exits

## Test Scenarios

### Public API Scenarios
- Health check validation
- Product catalog browsing
- Product search functionality
- Product detail retrieval
- API documentation access

### Authenticated Scenarios
- User authentication flow
- Order creation and management
- Payment processing
- User profile management
- GDPR data operations

### Stress Scenarios
- Heavy search loads with complex queries
- Concurrent product catalog browsing
- Rapid-fire API requests
- System resource exhaustion testing
- Traffic spike simulation

## Performance Thresholds

### Public Endpoints
- **95th Percentile**: < 2000ms
- **99th Percentile**: < 5000ms
- **Success Rate**: > 95%

### Authenticated Endpoints
- **95th Percentile**: < 3000ms
- **99th Percentile**: < 7000ms
- **Success Rate**: > 90%

### Critical Endpoints
- **95th Percentile**: < 1500ms
- **99th Percentile**: < 3000ms
- **Success Rate**: > 98%

## Report Generation

### Automatic Reports

All tests generate detailed reports in the `reports/` directory:

- **JSON Reports**: Raw metrics data for analysis
- **HTML Reports**: Visual reports with charts and tables
- **Summary Reports**: Aggregated results from multiple test runs

### Report Contents

- **Request/Response Metrics**: Count, rates, response times
- **HTTP Status Codes**: Distribution and error analysis
- **Response Time Distribution**: Percentiles and histograms
- **Endpoint Performance**: Per-endpoint breakdown
- **System Resource Usage**: Memory, CPU, load metrics

### Custom Report Generation

```javascript
const { reportUtils } = require('./config');

// Generate HTML report from JSON
reportUtils.generateHTMLReport(
  'reports/benchmark-report.json',
  'reports/benchmark-report.html'
);
```

## Configuration

### Environment Variables

```bash
# Service URLs (override defaults)
export PRODUCT_SERVICE_URL=http://localhost:3001
export USER_SERVICE_URL=http://localhost:3002
export ORDER_SERVICE_URL=http://localhost:3003
export PAYMENT_SERVICE_URL=http://localhost:3004
export NOTIFICATION_SERVICE_URL=http://localhost:3005

# Test configuration
export LOAD_TEST_TARGET=http://localhost:3000
export LOAD_TEST_DURATION=300
export LOAD_TEST_RPS=50
```

### Custom Test Data

Edit `config.js` to customize:

- **Product IDs**: Test product identifiers
- **Search Terms**: Search query variations
- **User Credentials**: Test user accounts
- **Performance Thresholds**: Success criteria

## Troubleshooting

### Common Issues

1. **Artillery Not Found**
   ```bash
   # Install globally
   npm install -g artillery
   
   # Or use the runner script (auto-installs)
   node run-load-tests.js load
   ```

2. **Connection Refused**
   - Ensure TechNovaStore services are running
   - Check target URL configuration
   - Verify firewall/network settings

3. **High Error Rates**
   - Check service logs for errors
   - Verify database connections
   - Monitor system resources

4. **Timeout Errors**
   - Increase timeout values in test configs
   - Check network latency
   - Verify service response times

### Performance Optimization

1. **System Resources**
   - Monitor CPU and memory usage
   - Ensure adequate system resources
   - Consider horizontal scaling

2. **Database Performance**
   - Monitor database connections
   - Check query performance
   - Verify indexing strategies

3. **Network Configuration**
   - Optimize connection pooling
   - Configure load balancing
   - Implement caching strategies

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Start services
        run: docker-compose up -d
        
      - name: Wait for services
        run: sleep 30
        
      - name: Run load tests
        run: npm run test:load
        
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: load-test-reports
          path: tests/load/reports/
```

## Best Practices

### Test Design
- Start with realistic load patterns
- Include think time between requests
- Test both success and failure scenarios
- Monitor system resources during tests

### Performance Analysis
- Establish baseline metrics
- Compare results over time
- Identify performance regressions
- Set up automated alerting

### Continuous Testing
- Run tests regularly (nightly/weekly)
- Include load tests in CI/CD pipeline
- Monitor production performance
- Validate after deployments

## Support

For questions or issues with load testing:

1. Check the troubleshooting section
2. Review Artillery.io documentation
3. Examine service logs and metrics
4. Contact the development team

## Contributing

When adding new load tests:

1. Follow existing naming conventions
2. Include appropriate performance thresholds
3. Add documentation for new scenarios
4. Test configurations before committing
5. Update this README with new features