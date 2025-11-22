#!/usr/bin/env node

/**
 * Script para analizar la estructura actual de un microservicio
 * y compararla con la estructura estándar
 * 
 * Uso:
 *   node scripts/migration/analyze-service-structure.js <service-path>
 * 
 * Ejemplo:
 *   node scripts/migration/analyze-service-structure.js domains/catalog/product-service
 */

const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Estructura estándar esperada
const STANDARD_STRUCTURE = {
  'src/domain/entities': { required: false, description: 'Entidades del dominio' },
  'src/domain/value-objects': { required: false, description: 'Objetos de valor' },
  'src/domain/repositories': { required: false, description: 'Interfaces de repositorios' },
  'src/domain/services': { required: false, description: 'Servicios de dominio' },
  'src/domain/events': { required: false, description: 'Eventos de dominio' },
  
  'src/application/use-cases': { required: false, description: 'Casos de uso' },
  'src/application/services': { required: false, description: 'Servicios de aplicación' },
  'src/application/dtos': { required: false, description: 'Data Transfer Objects' },
  'src/application/mappers': { required: false, description: 'Mapeadores' },
  
  'src/infrastructure/database/repositories': { required: false, description: 'Implementaciones de repositorios' },
  'src/infrastructure/database/models': { required: false, description: 'Modelos de BD' },
  'src/infrastructure/http': { required: false, description: 'Cliente HTTP' },
  'src/infrastructure/messaging': { required: false, description: 'Mensajería' },
  'src/infrastructure/external': { required: false, description: 'Servicios externos' },
  'src/infrastructure/cache': { required: false, description: 'Cache' },
  
  'src/presentation/controllers': { required: false, description: 'Controladores HTTP' },
  'src/presentation/routes': { required: false, description: 'Rutas' },
  'src/presentation/middleware': { required: false, description: 'Middleware' },
  'src/presentation/validators': { required: false, description: 'Validadores' },
  
  'src/config': { required: true, description: 'Configuración' },
  'src/shared': { required: false, description: 'Código compartido' },
  
  'tests/unit': { required: false, description: 'Tests unitarios' },
  'tests/integration': { required: false, description: 'Tests de integración' },
  'tests/e2e': { required: false, description: 'Tests end-to-end' },
  
  'docs': { required: false, description: 'Documentación' }
};

// Patrones de archivos antiguos (no estándar)
const OLD_PATTERNS = {
  'src/controllers': 'Debería estar en src/presentation/controllers',
  'src/routes': 'Debería estar en src/presentation/routes',
  'src/models': 'Debería estar en src/infrastructure/database/models o src/domain/entities',
  'src/services': 'Debería dividirse en src/domain/services y src/application/services',
  'src/middleware': 'Debería estar en src/presentation/middleware',
  'src/utils': 'Debería estar en src/shared/utils',
  'src/validators': 'Debería estar en src/presentation/validators',
  'test': 'Debería ser tests/ (plural)'
};

/**
 * Escanea recursivamente un directorio
 */
function scanDirectory(dir, basePath = '') {
  const results = {
    directories: [],
    files: []
  };
  
  if (!fs.existsSync(dir)) {
    return results;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      // Ignorar node_modules, dist, logs
      if (['node_modules', 'dist', 'logs', '.git'].includes(item)) {
        continue;
      }
      
      results.directories.push(relativePath);
      
      // Escanear recursivamente
      const subResults = scanDirectory(fullPath, relativePath);
      results.directories.push(...subResults.directories);
      results.files.push(...subResults.files);
    } else {
      results.files.push(relativePath);
    }
  }
  
  return results;
}

/**
 * Cuenta archivos TypeScript en un directorio
 */
function countTsFiles(dir) {
  if (!fs.existsSync(dir)) {
    return 0;
  }
  
  let count = 0;
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      if (!['node_modules', 'dist', 'logs'].includes(item)) {
        count += countTsFiles(fullPath);
      }
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      count++;
    }
  }
  
  return count;
}

/**
 * Analiza la estructura del servicio
 */
function analyzeService(servicePath) {
  const fullPath = path.resolve(servicePath);
  const serviceName = path.basename(servicePath);
  
  if (!fs.existsSync(fullPath)) {
    log(`Error: Service path does not exist: ${fullPath}`, 'red');
    process.exit(1);
  }
  
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`Analyzing Service: ${serviceName}`, 'cyan');
  log(`Path: ${fullPath}`, 'cyan');
  log(`${'='.repeat(80)}\n`, 'cyan');
  
  // Escanear estructura
  const structure = scanDirectory(fullPath);
  
  // Análisis de estructura estándar
  log('📁 Standard Structure Compliance:', 'blue');
  log('-'.repeat(80), 'blue');
  
  let compliantCount = 0;
  let totalRequired = 0;
  
  for (const [dirPath, info] of Object.entries(STANDARD_STRUCTURE)) {
    const exists = fs.existsSync(path.join(fullPath, dirPath));
    const fileCount = exists ? countTsFiles(path.join(fullPath, dirPath)) : 0;
    
    if (info.required) {
      totalRequired++;
      if (exists) compliantCount++;
    }
    
    const status = exists ? '✓' : '✗';
    const statusColor = exists ? 'green' : (info.required ? 'red' : 'yellow');
    const requiredLabel = info.required ? '[REQUIRED]' : '[OPTIONAL]';
    
    log(`  ${status} ${dirPath.padEnd(50)} ${requiredLabel.padEnd(12)} ${fileCount} files`, statusColor);
    log(`     ${info.description}`, 'reset');
  }
  
  const compliancePercent = totalRequired > 0 ? Math.round((compliantCount / totalRequired) * 100) : 0;
  log(`\nCompliance: ${compliantCount}/${totalRequired} required directories (${compliancePercent}%)`, 
      compliancePercent === 100 ? 'green' : 'yellow');
  
  // Análisis de patrones antiguos
  log('\n⚠️  Old Patterns Detected:', 'yellow');
  log('-'.repeat(80), 'yellow');
  
  let oldPatternsFound = false;
  for (const [oldPath, recommendation] of Object.entries(OLD_PATTERNS)) {
    const exists = fs.existsSync(path.join(fullPath, oldPath));
    if (exists) {
      const fileCount = countTsFiles(path.join(fullPath, oldPath));
      log(`  ✗ ${oldPath} (${fileCount} files)`, 'red');
      log(`     → ${recommendation}`, 'yellow');
      oldPatternsFound = true;
    }
  }
  
  if (!oldPatternsFound) {
    log('  ✓ No old patterns detected', 'green');
  }
  
  // Estadísticas generales
  log('\n📊 Statistics:', 'blue');
  log('-'.repeat(80), 'blue');
  
  const srcPath = path.join(fullPath, 'src');
  const testsPath = path.join(fullPath, 'tests');
  const testPath = path.join(fullPath, 'test');
  
  const srcFiles = countTsFiles(srcPath);
  const testFiles = countTsFiles(testsPath) + countTsFiles(testPath);
  const totalFiles = srcFiles + testFiles;
  
  log(`  Total TypeScript files: ${totalFiles}`, 'cyan');
  log(`  Source files (src/): ${srcFiles}`, 'cyan');
  log(`  Test files (tests/): ${testFiles}`, 'cyan');
  
  if (totalFiles > 0) {
    const testCoverage = Math.round((testFiles / srcFiles) * 100);
    log(`  Test/Source ratio: ${testCoverage}%`, testCoverage >= 50 ? 'green' : 'yellow');
  }
  
  // Archivos de configuración
  log('\n⚙️  Configuration Files:', 'blue');
  log('-'.repeat(80), 'blue');
  
  const configFiles = [
    'package.json',
    'tsconfig.json',
    'jest.config.js',
    'Dockerfile',
    'Dockerfile.prod',
    '.dockerignore',
    '.gitignore',
    'README.md'
  ];
  
  for (const file of configFiles) {
    const exists = fs.existsSync(path.join(fullPath, file));
    const status = exists ? '✓' : '✗';
    const color = exists ? 'green' : 'red';
    log(`  ${status} ${file}`, color);
  }
  
  // Recomendaciones
  log('\n💡 Recommendations:', 'magenta');
  log('-'.repeat(80), 'magenta');
  
  const recommendations = [];
  
  if (compliancePercent < 100) {
    recommendations.push('Crear directorios requeridos faltantes');
  }
  
  if (oldPatternsFound) {
    recommendations.push('Migrar archivos de patrones antiguos a estructura estándar');
  }
  
  if (!fs.existsSync(path.join(fullPath, 'src/domain'))) {
    recommendations.push('Crear capa de dominio (src/domain/) para lógica de negocio');
  }
  
  if (!fs.existsSync(path.join(fullPath, 'src/application'))) {
    recommendations.push('Crear capa de aplicación (src/application/) para casos de uso');
  }
  
  if (!fs.existsSync(path.join(fullPath, 'tests/unit'))) {
    recommendations.push('Organizar tests en tests/unit/, tests/integration/, tests/e2e/');
  }
  
  if (!fs.existsSync(path.join(fullPath, 'docs'))) {
    recommendations.push('Crear carpeta docs/ con documentación del servicio');
  }
  
  if (recommendations.length === 0) {
    log('  ✓ Service structure looks good!', 'green');
  } else {
    recommendations.forEach((rec, index) => {
      log(`  ${index + 1}. ${rec}`, 'yellow');
    });
  }
  
  // Plan de migración
  log('\n📋 Migration Plan:', 'blue');
  log('-'.repeat(80), 'blue');
  
  if (oldPatternsFound || compliancePercent < 100) {
    log('  1. Crear estructura estándar:', 'cyan');
    log('     node scripts/migration/generate-standard-structure.js ' + servicePath, 'reset');
    log('', 'reset');
    log('  2. Mover archivos manualmente:', 'cyan');
    
    for (const [oldPath, recommendation] of Object.entries(OLD_PATTERNS)) {
      if (fs.existsSync(path.join(fullPath, oldPath))) {
        log(`     - ${oldPath} → ${recommendation}`, 'yellow');
      }
    }
    
    log('', 'reset');
    log('  3. Actualizar imports en todos los archivos', 'cyan');
    log('  4. Actualizar tsconfig.json con paths aliases', 'cyan');
    log('  5. Ejecutar tests para verificar: npm test', 'cyan');
    log('  6. Actualizar documentación', 'cyan');
  } else {
    log('  ✓ No migration needed - structure is compliant!', 'green');
  }
  
  // Resumen final
  log('\n' + '='.repeat(80), 'cyan');
  
  const overallStatus = compliancePercent === 100 && !oldPatternsFound ? 'COMPLIANT' : 'NEEDS MIGRATION';
  const statusColor = overallStatus === 'COMPLIANT' ? 'green' : 'yellow';
  
  log(`Overall Status: ${overallStatus}`, statusColor);
  log('='.repeat(80) + '\n', 'cyan');
  
  // Generar reporte JSON
  const report = {
    serviceName,
    servicePath: fullPath,
    timestamp: new Date().toISOString(),
    compliance: {
      percent: compliancePercent,
      required: compliantCount,
      total: totalRequired
    },
    statistics: {
      totalFiles,
      srcFiles,
      testFiles,
      testCoverage: totalFiles > 0 ? Math.round((testFiles / srcFiles) * 100) : 0
    },
    oldPatternsFound,
    recommendations,
    status: overallStatus
  };
  
  const reportPath = path.join(fullPath, 'structure-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  log(`Report saved to: ${reportPath}`, 'green');
}

/**
 * Función principal
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('Error: Service path is required', 'red');
    log('Usage: node analyze-service-structure.js <service-path>', 'yellow');
    log('Example: node analyze-service-structure.js domains/catalog/product-service', 'yellow');
    process.exit(1);
  }
  
  const servicePath = args[0];
  
  try {
    analyzeService(servicePath);
  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
main();
