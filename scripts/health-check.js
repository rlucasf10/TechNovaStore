#!/usr/bin/env node

/**
 * Health Check Script for TechNovaStore
 * 
 * This script performs comprehensive health checks on all services
 * and provides detailed status information.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const config = {
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 2000, // 2 seconds
  services: [
    { name: 'API Gateway', url: 'http://localhost:3000/health', critical: true },
    { name: 'Frontend', url: 'http://localhost:3011', critical: true },
    { name: 'Product Service', url: 'http://localhost:3001/health', critical: false },
    { name: 'Order Service', url: 'http://localhost:3002/health', critical: false },
    { name: 'User Service', url: 'http://localhost:3003/health', critical: false },
    { name: 'Payment Service', url: 'http://localhost:3004/health', critical: false },
    { name: 'Notification Service', url: 'http://localhost:3005/health', critical: false },
    { name: 'Ticket Service', url: 'http://localhost:3012/health', critical: false },
    { name: 'Sync Engine', url: 'http://localhost:3006/health', critical: false },
    { name: 'Auto Purchase', url: 'http://localhost:3007/health', critical: false },
    { name: 'Shipment Tracker', url: 'http://localhost:3008/health', critical: false },
    { name: 'Chatbot', url: 'http://localhost:3009/health', critical: false },
    { name: 'Recommender', url: 'http://localhost:3010/health', critical: false }
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  critical: (msg) => console.log(`${colors.red}${colors.bright}[CRITICAL]${colors.reset} ${msg}`)
};

// HTTP request function with timeout and retries
function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: timeout,
      headers: {
        'User-Agent': 'TechNovaStore-HealthCheck/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime: Date.now() - startTime
        });
      });
    });

    const startTime = Date.now();
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Health check function with retries
async function checkService(service) {
  let lastError;
  
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      const response = await makeRequest(service.url, config.timeout);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          name: service.name,
          status: 'healthy',
          statusCode: response.statusCode,
          responseTime: response.responseTime,
          attempt: attempt,
          critical: service.critical
        };
      } else {
        throw new Error(`HTTP ${response.statusCode}`);
      }
    } catch (error) {
      lastError = error;
      
      if (attempt < config.retries) {
        log.warning(`${service.name} health check failed (attempt ${attempt}/${config.retries}): ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
    }
  }
  
  return {
    name: service.name,
    status: 'unhealthy',
    error: lastError.message,
    attempt: config.retries,
    critical: service.critical
  };
}

// Main health check function
async function performHealthCheck() {
  log.info('Starting TechNovaStore health check...');
  console.log('');
  
  const startTime = Date.now();
  const results = [];
  
  // Check all services concurrently
  const promises = config.services.map(service => checkService(service));
  const responses = await Promise.all(promises);
  
  // Process results
  let healthyCount = 0;
  let unhealthyCount = 0;
  let criticalFailures = 0;
  
  console.log('='.repeat(80));
  console.log(`${colors.bright}HEALTH CHECK RESULTS${colors.reset}`);
  console.log('='.repeat(80));
  
  responses.forEach(result => {
    results.push(result);
    
    if (result.status === 'healthy') {
      healthyCount++;
      log.success(`${result.name.padEnd(20)} - ${result.status.toUpperCase()} (${result.responseTime}ms)`);
    } else {
      unhealthyCount++;
      if (result.critical) {
        criticalFailures++;
        log.critical(`${result.name.padEnd(20)} - ${result.status.toUpperCase()} - ${result.error}`);
      } else {
        log.warning(`${result.name.padEnd(20)} - ${result.status.toUpperCase()} - ${result.error}`);
      }
    }
  });
  
  const totalTime = Date.now() - startTime;
  
  console.log('='.repeat(80));
  console.log(`${colors.bright}SUMMARY${colors.reset}`);
  console.log('='.repeat(80));
  console.log(`Total services checked: ${results.length}`);
  console.log(`${colors.green}Healthy services: ${healthyCount}${colors.reset}`);
  console.log(`${colors.yellow}Unhealthy services: ${unhealthyCount}${colors.reset}`);
  console.log(`${colors.red}Critical failures: ${criticalFailures}${colors.reset}`);
  console.log(`Total check time: ${totalTime}ms`);
  console.log('');
  
  // Determine overall status
  if (criticalFailures > 0) {
    log.critical('CRITICAL: One or more critical services are unhealthy!');
    process.exit(1);
  } else if (unhealthyCount > 0) {
    log.warning('WARNING: Some non-critical services are unhealthy');
    process.exit(2);
  } else {
    log.success('SUCCESS: All services are healthy!');
    process.exit(0);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    host: 'localhost',
    environment: 'development'
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--host':
      case '-h':
        options.host = args[++i];
        break;
      case '--environment':
      case '-e':
        options.environment = args[++i];
        break;
      case '--timeout':
      case '-t':
        config.timeout = parseInt(args[++i]) * 1000;
        break;
      case '--retries':
      case '-r':
        config.retries = parseInt(args[++i]);
        break;
      case '--help':
        console.log(`
TechNovaStore Health Check Script

Usage: node health-check.js [options]

Options:
  --host, -h <host>           Target host (default: localhost)
  --environment, -e <env>     Environment (development, staging, production)
  --timeout, -t <seconds>     Request timeout in seconds (default: 10)
  --retries, -r <count>       Number of retries (default: 3)
  --help                      Show this help message

Examples:
  node health-check.js
  node health-check.js --host staging.example.com --environment staging
  node health-check.js --timeout 5 --retries 2
        `);
        process.exit(0);
        break;
    }
  }
  
  return options;
}

// Update service URLs based on options
function updateServiceUrls(options) {
  const baseUrl = options.host === 'localhost' ? 'http://localhost' : `http://${options.host}`;
  
  config.services = config.services.map(service => ({
    ...service,
    url: service.url.replace('http://localhost', baseUrl)
  }));
}

// Main execution
async function main() {
  try {
    const options = parseArgs();
    updateServiceUrls(options);
    
    log.info(`Health checking TechNovaStore services on ${options.host} (${options.environment})`);
    log.info(`Timeout: ${config.timeout}ms, Retries: ${config.retries}`);
    console.log('');
    
    await performHealthCheck();
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    process.exit(3);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error(`Uncaught exception: ${error.message}`);
  process.exit(3);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled rejection at ${promise}: ${reason}`);
  process.exit(3);
});

// Run the health check
if (require.main === module) {
  main();
}

module.exports = { checkService, performHealthCheck };