/**
 * Artillery Load Testing Configuration
 * Helper functions and utilities for load testing
 */

const fs = require('fs');
const path = require('path');

// Load testing environment configuration
const loadTestConfig = {
  // Target environments
  environments: {
    local: 'http://localhost:3000',
    staging: process.env.STAGING_URL || 'https://staging.technovastore.com',
    production: process.env.PRODUCTION_URL || 'https://technovastore.com'
  },
  
  // Test data generators
  generators: {
    // Generate random product IDs
    randomProductId: () => {
      const chars = 'abcdef0123456789';
      let result = '';
      for (let i = 0; i < 24; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
    
    // Generate random search terms
    randomSearchTerm: () => {
      const terms = [
        'laptop', 'smartphone', 'tablet', 'monitor', 'keyboard',
        'mouse', 'headphones', 'camera', 'printer', 'router',
        'gaming', 'professional', 'wireless', 'bluetooth', 'USB'
      ];
      return terms[Math.floor(Math.random() * terms.length)];
    },
    
    // Generate random user data
    randomUser: () => ({
      email: `loadtest${Math.floor(Math.random() * 10000)}@technovastore.com`,
      password: 'LoadTest123!',
      firstName: 'Load',
      lastName: 'Test'
    }),
    
    // Generate random order data
    randomOrder: () => ({
      items: [
        {
          sku: `PRODUCT-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: Math.floor(Math.random() * 900) + 100
        }
      ],
      shippingAddress: {
        street: 'Test Street 123',
        city: 'Test City',
        postalCode: '12345',
        country: 'ES'
      }
    })
  },
  
  // Performance thresholds by endpoint type
  thresholds: {
    public: {
      p95: 2000,
      p99: 5000,
      successRate: 95
    },
    authenticated: {
      p95: 3000,
      p99: 7000,
      successRate: 90
    },
    critical: {
      p95: 1500,
      p99: 3000,
      successRate: 98
    }
  }
};

// Custom Artillery functions
const customFunctions = {
  // Generate test data
  generateProductId: (context, events, done) => {
    context.vars.productId = loadTestConfig.generators.randomProductId();
    return done();
  },
  
  generateSearchTerm: (context, events, done) => {
    context.vars.searchTerm = loadTestConfig.generators.randomSearchTerm();
    return done();
  },
  
  generateUserData: (context, events, done) => {
    const user = loadTestConfig.generators.randomUser();
    context.vars.userEmail = user.email;
    context.vars.userPassword = user.password;
    context.vars.userFirstName = user.firstName;
    context.vars.userLastName = user.lastName;
    return done();
  },
  
  generateOrderData: (context, events, done) => {
    const order = loadTestConfig.generators.randomOrder();
    context.vars.orderData = JSON.stringify(order);
    return done();
  },
  
  // Log performance metrics
  logMetrics: (context, events, done) => {
    const timestamp = new Date().toISOString();
    const metrics = {
      timestamp,
      scenario: context.scenario?.name || 'unknown',
      phase: context.phase?.name || 'unknown',
      userId: context.vars.userId || 'anonymous'
    };
    
    console.log(`[METRICS] ${JSON.stringify(metrics)}`);
    return done();
  }
};

// Report generation utilities
const reportUtils = {
  // Generate HTML report from JSON results
  generateHTMLReport: (jsonReportPath, outputPath) => {
    try {
      const reportData = JSON.parse(fs.readFileSync(jsonReportPath, 'utf8'));
      
      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>TechNovaStore Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2196F3; }
        .metric-label { color: #666; margin-top: 5px; }
        .error { color: #f44336; }
        .success { color: #4CAF50; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TechNovaStore Load Test Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Test Duration: ${reportData.aggregate?.phases?.length || 0} phases</p>
    </div>
    
    <div class="metrics">
        <div class="metric-card">
            <div class="metric-value">${reportData.aggregate?.counters?.['http.requests'] || 0}</div>
            <div class="metric-label">Total Requests</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${reportData.aggregate?.counters?.['http.responses'] || 0}</div>
            <div class="metric-label">Total Responses</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${Math.round(reportData.aggregate?.histograms?.['http.response_time']?.p95 || 0)}ms</div>
            <div class="metric-label">95th Percentile Response Time</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${Math.round(reportData.aggregate?.histograms?.['http.response_time']?.p99 || 0)}ms</div>
            <div class="metric-label">99th Percentile Response Time</div>
        </div>
    </div>
    
    <h2>HTTP Status Codes</h2>
    <table>
        <tr><th>Status Code</th><th>Count</th><th>Percentage</th></tr>
        ${Object.entries(reportData.aggregate?.counters || {})
          .filter(([key]) => key.startsWith('http.codes.'))
          .map(([key, value]) => {
            const code = key.replace('http.codes.', '');
            const total = reportData.aggregate?.counters?.['http.responses'] || 1;
            const percentage = ((value / total) * 100).toFixed(2);
            const statusClass = code.startsWith('2') ? 'success' : code.startsWith('5') ? 'error' : '';
            return `<tr><td class="${statusClass}">${code}</td><td>${value}</td><td>${percentage}%</td></tr>`;
          }).join('')}
    </table>
    
    <h2>Response Time Distribution</h2>
    <table>
        <tr><th>Percentile</th><th>Response Time (ms)</th></tr>
        <tr><td>50th (Median)</td><td>${Math.round(reportData.aggregate?.histograms?.['http.response_time']?.p50 || 0)}</td></tr>
        <tr><td>75th</td><td>${Math.round(reportData.aggregate?.histograms?.['http.response_time']?.p75 || 0)}</td></tr>
        <tr><td>90th</td><td>${Math.round(reportData.aggregate?.histograms?.['http.response_time']?.p90 || 0)}</td></tr>
        <tr><td>95th</td><td>${Math.round(reportData.aggregate?.histograms?.['http.response_time']?.p95 || 0)}</td></tr>
        <tr><td>99th</td><td>${Math.round(reportData.aggregate?.histograms?.['http.response_time']?.p99 || 0)}</td></tr>
    </table>
</body>
</html>`;
      
      fs.writeFileSync(outputPath, html);
      console.log(`HTML report generated: ${outputPath}`);
    } catch (error) {
      console.error('Error generating HTML report:', error);
    }
  }
};

module.exports = {
  loadTestConfig,
  customFunctions,
  reportUtils
};