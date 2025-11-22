#!/usr/bin/env node

const http = require('http');

// Servicios a monitorear
const appServices = [
  { name: 'API Gateway', url: 'http://localhost:3000/health', type: 'app' },
  { name: 'Product Service', url: 'http://localhost:3001/health', type: 'app' },
  { name: 'Order Service', url: 'http://localhost:3002/health', type: 'app' },
  { name: 'User Service', url: 'http://localhost:3003/health', type: 'app' },
  { name: 'Payment Service', url: 'http://localhost:3004/health', type: 'app' }
];

const monitoringServices = [
  { name: 'Prometheus', url: 'http://localhost:9090/-/healthy', type: 'monitoring' },
  { name: 'Grafana', url: 'http://localhost:3013/api/health', type: 'monitoring' }
];

async function checkService(service) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.get(service.url, { timeout: 3000 }, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          resolve({
            name: service.name,
            status: health.status || 'healthy',
            responseTime,
            healthy: res.statusCode === 200
          });
        } catch {
          // Handle non-JSON responses (like Prometheus)
          const isHealthy = res.statusCode === 200 && data.includes('Healthy');
          resolve({
            name: service.name,
            status: isHealthy ? 'healthy' : 'error',
            responseTime,
            healthy: isHealthy
          });
        }
      });
    });
    
    req.on('error', () => {
      resolve({
        name: service.name,
        status: 'down',
        responseTime: Date.now() - startTime,
        healthy: false
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: service.name,
        status: 'timeout',
        responseTime: 3000,
        healthy: false
      });
    });
  });
}

async function monitorServices() {
  console.log('🔍 Monitoring TechNovaStore Services...\n');
  
  // Check app services first
  const appResults = await Promise.all(appServices.map(checkService));
  const appHealthy = appResults.filter(r => r.healthy).length;
  
  console.log('📱 Application Services:');
  appResults.forEach(result => {
    const icon = result.healthy ? '✅' : '❌';
    const status = result.status.toUpperCase();
    console.log(`  ${icon} ${result.name}: ${status} (${result.responseTime}ms)`);
  });
  
  // Check monitoring services
  const monitoringResults = await Promise.all(monitoringServices.map(checkService));
  const monitoringHealthy = monitoringResults.filter(r => r.healthy).length;
  
  console.log('\n📊 Monitoring Services:');
  monitoringResults.forEach(result => {
    const icon = result.healthy ? '✅' : '❌';
    const status = result.status.toUpperCase();
    console.log(`  ${icon} ${result.name}: ${status} (${result.responseTime}ms)`);
  });
  
  console.log(`\n📈 Summary:`);
  console.log(`  App Services: ${appHealthy}/${appServices.length} healthy`);
  console.log(`  Monitoring: ${monitoringHealthy}/${monitoringServices.length} healthy`);
  
  // Exit with error only if monitoring services are down
  if (monitoringHealthy < monitoringServices.length) {
    console.log('\n❌ Monitoring services have issues!');
    process.exit(1);
  } else if (appHealthy === 0) {
    console.log('\n⚠️  App services are not running (monitoring only mode)');
  } else {
    console.log('\n✅ All checked services are healthy');
  }
}

monitorServices().catch(console.error);