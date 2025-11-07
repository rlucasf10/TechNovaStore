#!/usr/bin/env node

/**
 * TechNovaStore Performance Monitor
 * Real-time performance monitoring during load tests
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
  constructor(options = {}) {
    this.target = options.target || 'http://localhost:3000';
    this.interval = options.interval || 5000; // 5 seconds
    this.duration = options.duration || 300000; // 5 minutes
    this.outputFile = options.outputFile || path.join(__dirname, 'reports', `performance-monitor-${Date.now()}.json`);
    
    this.metrics = [];
    this.isRunning = false;
    this.startTime = null;
  }

  // Make HTTP request and measure performance
  async measureEndpoint(endpoint, method = 'GET', data = null) {
    const url = new URL(endpoint, this.target);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const startTime = process.hrtime.bigint();
    
    return new Promise((resolve) => {
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'User-Agent': 'TechNovaStore-Performance-Monitor/1.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      if (data && method !== 'GET') {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = httpModule.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          const endTime = process.hrtime.bigint();
          const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
          
          resolve({
            endpoint,
            method,
            statusCode: res.statusCode,
            responseTime,
            responseSize: Buffer.byteLength(responseData),
            headers: res.headers,
            success: res.statusCode >= 200 && res.statusCode < 400
          });
        });
      });

      req.on('error', (error) => {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000;
        
        resolve({
          endpoint,
          method,
          statusCode: 0,
          responseTime,
          responseSize: 0,
          error: error.message,
          success: false
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000;
        
        resolve({
          endpoint,
          method,
          statusCode: 0,
          responseTime,
          responseSize: 0,
          error: 'Request timeout',
          success: false
        });
      });

      if (data && method !== 'GET') {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  // Monitor multiple endpoints
  async monitorEndpoints() {
    const endpoints = [
      { path: '/health', method: 'GET' },
      { path: '/api/products', method: 'GET' },
      { path: '/api/products/search?q=laptop', method: 'GET' },
      { path: '/api/docs', method: 'GET' },
      { path: '/api/csrf-token', method: 'GET' }
    ];

    const results = await Promise.all(
      endpoints.map(({ path, method, data }) => 
        this.measureEndpoint(path, method, data)
      )
    );

    const timestamp = new Date().toISOString();
    const systemMetrics = this.getSystemMetrics();
    
    const measurement = {
      timestamp,
      system: systemMetrics,
      endpoints: results,
      summary: {
        totalRequests: results.length,
        successfulRequests: results.filter(r => r.success).length,
        failedRequests: results.filter(r => !r.success).length,
        averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
        maxResponseTime: Math.max(...results.map(r => r.responseTime)),
        minResponseTime: Math.min(...results.map(r => r.responseTime))
      }
    };

    this.metrics.push(measurement);
    
    // Log real-time metrics
    console.log(`[${timestamp}] Avg: ${measurement.summary.averageResponseTime.toFixed(2)}ms | Success: ${measurement.summary.successfulRequests}/${measurement.summary.totalRequests} | Max: ${measurement.summary.maxResponseTime.toFixed(2)}ms`);
    
    return measurement;
  }

  // Get system metrics
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      loadAverage: require('os').loadavg()
    };
  }

  // Start monitoring
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Monitor is already running');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();
    
    console.log(`🔍 Starting performance monitoring...`);
    console.log(`   Target: ${this.target}`);
    console.log(`   Interval: ${this.interval}ms`);
    console.log(`   Duration: ${this.duration}ms`);
    console.log(`   Output: ${this.outputFile}`);
    console.log('');

    const intervalId = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(intervalId);
        return;
      }

      try {
        await this.monitorEndpoints();
      } catch (error) {
        console.error('❌ Monitoring error:', error.message);
      }

      // Check if duration has elapsed
      if (Date.now() - this.startTime >= this.duration) {
        this.stop();
        clearInterval(intervalId);
      }
    }, this.interval);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, stopping monitor...');
      this.stop();
      clearInterval(intervalId);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, stopping monitor...');
      this.stop();
      clearInterval(intervalId);
    });
  }

  // Stop monitoring and save results
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    console.log('\n📊 Performance monitoring completed');
    console.log(`   Duration: ${totalDuration}ms`);
    console.log(`   Total measurements: ${this.metrics.length}`);

    // Generate summary statistics
    const summary = this.generateSummary();
    
    // Save results
    const report = {
      metadata: {
        target: this.target,
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: totalDuration,
        interval: this.interval,
        totalMeasurements: this.metrics.length
      },
      summary,
      measurements: this.metrics
    };

    // Ensure reports directory exists
    const reportsDir = path.dirname(this.outputFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(this.outputFile, JSON.stringify(report, null, 2));
    console.log(`   Report saved: ${this.outputFile}`);

    // Display summary
    this.displaySummary(summary);
  }

  // Generate summary statistics
  generateSummary() {
    if (this.metrics.length === 0) {
      return null;
    }

    const allEndpointResults = this.metrics.flatMap(m => m.endpoints);
    const responseTimes = allEndpointResults.map(r => r.responseTime);
    const successfulRequests = allEndpointResults.filter(r => r.success);
    
    // Calculate percentiles
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const percentile = (p) => {
      const index = Math.ceil((p / 100) * sortedTimes.length) - 1;
      return sortedTimes[index] || 0;
    };

    return {
      totalRequests: allEndpointResults.length,
      successfulRequests: successfulRequests.length,
      failedRequests: allEndpointResults.length - successfulRequests.length,
      successRate: (successfulRequests.length / allEndpointResults.length) * 100,
      responseTime: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        p50: percentile(50),
        p75: percentile(75),
        p90: percentile(90),
        p95: percentile(95),
        p99: percentile(99)
      },
      endpointStats: this.getEndpointStats()
    };
  }

  // Get statistics by endpoint
  getEndpointStats() {
    const endpointMap = new Map();
    
    this.metrics.forEach(measurement => {
      measurement.endpoints.forEach(endpoint => {
        const key = `${endpoint.method} ${endpoint.endpoint}`;
        if (!endpointMap.has(key)) {
          endpointMap.set(key, []);
        }
        endpointMap.get(key).push(endpoint);
      });
    });

    const stats = {};
    endpointMap.forEach((results, endpoint) => {
      const responseTimes = results.map(r => r.responseTime);
      const successful = results.filter(r => r.success);
      
      stats[endpoint] = {
        totalRequests: results.length,
        successfulRequests: successful.length,
        successRate: (successful.length / results.length) * 100,
        avgResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        minResponseTime: Math.min(...responseTimes),
        maxResponseTime: Math.max(...responseTimes)
      };
    });

    return stats;
  }

  // Display summary in console
  displaySummary(summary) {
    if (!summary) {
      console.log('❌ No data to summarize');
      return;
    }

    console.log('\n📈 Performance Summary:');
    console.log(`   Total Requests: ${summary.totalRequests}`);
    console.log(`   Success Rate: ${summary.successRate.toFixed(2)}%`);
    console.log(`   Avg Response Time: ${summary.responseTime.avg.toFixed(2)}ms`);
    console.log(`   95th Percentile: ${summary.responseTime.p95.toFixed(2)}ms`);
    console.log(`   99th Percentile: ${summary.responseTime.p99.toFixed(2)}ms`);
    
    console.log('\n📊 Endpoint Performance:');
    Object.entries(summary.endpointStats).forEach(([endpoint, stats]) => {
      console.log(`   ${endpoint}:`);
      console.log(`     Success Rate: ${stats.successRate.toFixed(2)}%`);
      console.log(`     Avg Response: ${stats.avgResponseTime.toFixed(2)}ms`);
    });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      if (key === 'interval' || key === 'duration') {
        options[key] = parseInt(value);
      } else {
        options[key] = value;
      }
    }
  }
  
  const monitor = new PerformanceMonitor(options);
  await monitor.start();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Monitor failed:', error.message);
    process.exit(1);
  });
}

module.exports = PerformanceMonitor;