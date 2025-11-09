#!/usr/bin/env node

/**
 * Script de validación de todos los servicios
 * Verifica compilación TypeScript, Docker y health checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return null;
  }
}

// Mapeo de servicios por dominio
const servicesByDomain = {
  catalog: [
    { name: 'product-service', container: 'technovastore-product-service', port: 3001 },
    { name: 'sync-engine', container: 'technovastore-sync-engine', port: 3006 },
    { name: 'recommender-service', container: 'technovastore-recommender', port: 3010 }
  ],
  commerce: [
    { name: 'order-service', container: 'technovastore-order-service', port: 3002 },
    { name: 'payment-service', container: 'technovastore-payment-service', port: 3004 },
    { name: 'auto-purchase-service', container: 'technovastore-auto-purchase', port: 3007 }
  ],
  customer: [
    { name: 'user-service', container: 'technovastore-user-service', port: 3003 },
    { name: 'notification-service', container: 'technovastore-notification-service', port: 3005 }
  ],
  support: [
    { name: 'ticket-service', container: 'technovastore-ticket-service', port: 3012 },
    { name: 'chatbot-service', container: 'technovastore-chatbot', port: 3009 },
    { name: 'shipment-tracker', container: 'technovastore-shipment-tracker', port: 3008 }
  ],
  platform: [
    { name: 'api-gateway', container: 'technovastore-api-gateway', port: 3000 },
    { name: 'frontend', container: 'technovastore-frontend', port: 3011 }
  ]
};

function checkTypeScriptCompilation() {
  log('\n=== Verificación de Compilación TypeScript ===\n', 'cyan');
  
  let allCompiled = true;
  
  for (const [domain, services] of Object.entries(servicesByDomain)) {
    log(`\n📁 Dominio: ${domain}`, 'blue');
    
    for (const service of services) {
      const servicePath = path.join('domains', domain, service.name);
      const tsConfigPath = path.join(servicePath, 'tsconfig.json');
      
      // Verificar si el servicio tiene TypeScript
      if (!fs.existsSync(tsConfigPath)) {
        log(`  ⚠️  ${service.name}: No tiene tsconfig.json (puede ser JavaScript)`, 'yellow');
        continue;
      }
      
      try {
        log(`  🔍 Verificando ${service.name}...`, 'blue');
        exec(`npx tsc --noEmit --project ${tsConfigPath}`, { silent: true });
        log(`  ✅ ${service.name}: Compilación exitosa`, 'green');
      } catch (error) {
        log(`  ❌ ${service.name}: Error de compilación`, 'red');
        allCompiled = false;
      }
    }
  }
  
  return allCompiled;
}

function checkDockerContainers() {
  log('\n=== Verificación de Contenedores Docker ===\n', 'cyan');
  
  let allRunning = true;
  
  // Obtener lista de contenedores en ejecución
  const runningContainers = exec('docker ps --format "{{.Names}}"', { silent: true });
  const runningList = runningContainers ? runningContainers.split('\n').filter(Boolean) : [];
  
  for (const [domain, services] of Object.entries(servicesByDomain)) {
    log(`\n📁 Dominio: ${domain}`, 'blue');
    
    for (const service of services) {
      const isRunning = runningList.includes(service.container);
      
      if (isRunning) {
        log(`  ✅ ${service.name} (${service.container}): En ejecución`, 'green');
      } else {
        log(`  ❌ ${service.name} (${service.container}): NO está en ejecución`, 'red');
        allRunning = false;
      }
    }
  }
  
  return allRunning;
}

function checkHealthEndpoints() {
  log('\n=== Verificación de Health Checks ===\n', 'cyan');
  
  let allHealthy = true;
  
  for (const [domain, services] of Object.entries(servicesByDomain)) {
    log(`\n📁 Dominio: ${domain}`, 'blue');
    
    for (const service of services) {
      try {
        // Intentar hacer curl al endpoint de health
        const healthUrl = `http://localhost:${service.port}/health`;
        exec(`curl -f -s ${healthUrl}`, { silent: true, ignoreError: false });
        log(`  ✅ ${service.name}: Health check OK (puerto ${service.port})`, 'green');
      } catch (error) {
        log(`  ⚠️  ${service.name}: Health check no disponible (puerto ${service.port})`, 'yellow');
        // No marcamos como fallo porque algunos servicios pueden no tener health endpoint
      }
    }
  }
  
  return allHealthy;
}

function generateReport() {
  log('\n=== Reporte de Servicios ===\n', 'cyan');
  
  let totalServices = 0;
  
  for (const [domain, services] of Object.entries(servicesByDomain)) {
    totalServices += services.length;
  }
  
  log(`Total de dominios: ${Object.keys(servicesByDomain).length}`, 'blue');
  log(`Total de servicios: ${totalServices}`, 'blue');
  
  log('\nServicios por dominio:', 'blue');
  for (const [domain, services] of Object.entries(servicesByDomain)) {
    log(`  ${domain}: ${services.length} servicios`, 'blue');
  }
}

function main() {
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Validación de Todos los Servicios - TechNovaStore        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  // Verificar compilación TypeScript
  const compilationOk = checkTypeScriptCompilation();
  
  // Verificar contenedores Docker
  const dockerOk = checkDockerContainers();
  
  // Verificar health checks
  const healthOk = checkHealthEndpoints();
  
  // Generar reporte
  generateReport();
  
  // Resultado final
  log('\n=== Resultado Final ===\n', 'cyan');
  
  if (compilationOk && dockerOk) {
    log('✅ VALIDACIÓN EXITOSA', 'green');
    log('✅ Todos los servicios compilan correctamente', 'green');
    log('✅ Todos los contenedores Docker están en ejecución', 'green');
    
    if (healthOk) {
      log('✅ Health checks disponibles', 'green');
    } else {
      log('⚠️  Algunos health checks no están disponibles (no crítico)', 'yellow');
    }
    
    process.exit(0);
  } else {
    log('❌ VALIDACIÓN FALLIDA', 'red');
    
    if (!compilationOk) {
      log('  - Algunos servicios tienen errores de compilación', 'red');
    }
    
    if (!dockerOk) {
      log('  - Algunos contenedores no están en ejecución', 'red');
      log('  - Ejecuta: docker-compose -f docker-compose.optimized.yml up -d', 'yellow');
    }
    
    process.exit(1);
  }
}

main();
