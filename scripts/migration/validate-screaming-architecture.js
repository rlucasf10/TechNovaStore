/**
 * Script para validar que todos los servicios siguen Screaming Architecture
 * 
 * Este script analiza la estructura de cada servicio y genera un reporte
 * de cumplimiento con los principios de Screaming Architecture.
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Criterios de validación para Screaming Architecture
const VALIDATION_CRITERIA = {
  // Debe tener carpetas de casos de uso en la raíz (no dentro de src/)
  hasUseCaseFolders: {
    name: 'Carpetas de casos de uso en raíz',
    weight: 30,
    description: 'Debe tener al menos 2 carpetas de casos de uso con nombres descriptivos del negocio'
  },
  
  // NO debe tener carpeta src/ (código debe estar en raíz)
  noSrcFolder: {
    name: 'Sin carpeta src/',
    weight: 20,
    description: 'El código debe estar en la raíz, no dentro de src/'
  },
  
  // Debe tener carpeta shared/ con infraestructura
  hasSharedFolder: {
    name: 'Carpeta shared/ con infraestructura',
    weight: 15,
    description: 'Debe tener shared/ con subcarpetas como models/, utils/, types/'
  },
  
  // Debe tener carpeta api/ con controladores y rutas
  hasApiFolder: {
    name: 'Carpeta api/ con presentación HTTP',
    weight: 15,
    description: 'Debe tener api/ con controladores y rutas'
  },
  
  // Tests deben estar junto al código (no en carpeta test/ separada)
  testsWithCode: {
    name: 'Tests junto al código',
    weight: 10,
    description: 'Los tests deben estar en las carpetas de casos de uso, no en test/ separada'
  },
  
  // Debe tener config/ en raíz
  hasConfigFolder: {
    name: 'Carpeta config/',
    weight: 5,
    description: 'Debe tener config/ para configuración'
  },
  
  // Debe tener index.ts en raíz
  hasIndexFile: {
    name: 'Archivo index.ts en raíz',
    weight: 5,
    description: 'Debe tener index.ts como punto de entrada en la raíz'
  }
};

/**
 * Obtiene todos los servicios del proyecto
 */
function getAllServices() {
  const domainsPath = path.join(process.cwd(), 'domains');
  const services = [];
  
  if (!fs.existsSync(domainsPath)) {
    console.error(`${colors.red}Error: No se encontró la carpeta domains/${colors.reset}`);
    return services;
  }
  
  const domains = fs.readdirSync(domainsPath);
  
  for (const domain of domains) {
    const domainPath = path.join(domainsPath, domain);
    const stat = fs.statSync(domainPath);
    
    if (!stat.isDirectory()) continue;
    
    const domainContents = fs.readdirSync(domainPath);
    
    for (const item of domainContents) {
      const itemPath = path.join(domainPath, item);
      const itemStat = fs.statSync(itemPath);
      
      // Ignorar archivos (como README.md)
      if (!itemStat.isDirectory()) continue;
      
      // Es un servicio
      services.push({
        name: item,
        domain: domain,
        path: itemPath,
        relativePath: `domains/${domain}/${item}`
      });
    }
  }
  
  return services;
}

/**
 * Analiza la estructura de un servicio
 */
function analyzeServiceStructure(service) {
  const structure = {
    folders: [],
    files: [],
    hasSrcFolder: false,
    hasTestFolder: false,
    useCaseFolders: [],
    hasShared: false,
    hasApi: false,
    hasConfig: false,
    hasIndexFile: false,
    testsInUseCases: 0,
    testsInTestFolder: 0
  };
  
  try {
    const contents = fs.readdirSync(service.path);
    
    for (const item of contents) {
      const itemPath = path.join(service.path, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        structure.folders.push(item);
        
        // Detectar carpeta src/
        if (item === 'src') {
          structure.hasSrcFolder = true;
        }
        
        // Detectar carpeta test/ o tests/
        if (item === 'test' || item === 'tests') {
          structure.hasTestFolder = true;
          // Contar tests en carpeta separada
          structure.testsInTestFolder = countTestFiles(itemPath);
        }
        
        // Detectar carpeta shared/
        if (item === 'shared') {
          structure.hasShared = true;
        }
        
        // Detectar carpeta api/
        if (item === 'api') {
          structure.hasApi = true;
        }
        
        // Detectar carpeta config/
        if (item === 'config') {
          structure.hasConfig = true;
        }
        
        // Detectar posibles casos de uso (carpetas con nombres kebab-case que no son especiales)
        const specialFolders = ['src', 'dist', 'node_modules', 'shared', 'api', 'config', 'docs', 'scripts', 'test', 'tests', 'logs', 'coverage'];
        if (!specialFolders.includes(item) && item.includes('-')) {
          // Verificar si tiene archivos .ts (no solo .test.ts)
          const hasCode = hasTypeScriptFiles(itemPath);
          if (hasCode) {
            structure.useCaseFolders.push(item);
            // Contar tests en caso de uso
            structure.testsInUseCases += countTestFiles(itemPath);
          }
        }
      } else {
        structure.files.push(item);
        
        // Detectar index.ts en raíz
        if (item === 'index.ts') {
          structure.hasIndexFile = true;
        }
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error analizando ${service.name}: ${error.message}${colors.reset}`);
  }
  
  return structure;
}

/**
 * Verifica si una carpeta tiene archivos TypeScript (no solo tests)
 */
function hasTypeScriptFiles(folderPath) {
  try {
    const files = fs.readdirSync(folderPath);
    return files.some(file => file.endsWith('.ts') && !file.endsWith('.test.ts'));
  } catch {
    return false;
  }
}

/**
 * Cuenta archivos de test en una carpeta (recursivo)
 */
function countTestFiles(folderPath) {
  let count = 0;
  
  try {
    const items = fs.readdirSync(folderPath);
    
    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        count += countTestFiles(itemPath);
      } else if (item.endsWith('.test.ts') || item.endsWith('.spec.ts')) {
        count++;
      }
    }
  } catch {
    // Ignorar errores
  }
  
  return count;
}

/**
 * Valida un servicio contra los criterios de Screaming Architecture
 */
function validateService(service, structure) {
  const results = {};
  let totalScore = 0;
  let maxScore = 0;
  
  // Validar cada criterio
  for (const [key, criterion] of Object.entries(VALIDATION_CRITERIA)) {
    maxScore += criterion.weight;
    let passed = false;
    let details = '';
    
    switch (key) {
      case 'hasUseCaseFolders':
        passed = structure.useCaseFolders.length >= 2;
        details = passed 
          ? `✓ Encontradas ${structure.useCaseFolders.length} carpetas de casos de uso: ${structure.useCaseFolders.slice(0, 3).join(', ')}${structure.useCaseFolders.length > 3 ? '...' : ''}`
          : `✗ Solo ${structure.useCaseFolders.length} carpetas de casos de uso (se requieren al menos 2)`;
        break;
        
      case 'noSrcFolder':
        passed = !structure.hasSrcFolder;
        details = passed 
          ? '✓ No tiene carpeta src/ (código en raíz)'
          : '✗ Tiene carpeta src/ (debe mover código a raíz)';
        break;
        
      case 'hasSharedFolder':
        passed = structure.hasShared;
        details = passed 
          ? '✓ Tiene carpeta shared/'
          : '✗ No tiene carpeta shared/';
        break;
        
      case 'hasApiFolder':
        passed = structure.hasApi;
        details = passed 
          ? '✓ Tiene carpeta api/'
          : '✗ No tiene carpeta api/';
        break;
        
      case 'testsWithCode':
        // Preferible tener tests en casos de uso, no en carpeta separada
        const hasTestsInUseCases = structure.testsInUseCases > 0;
        const hasTestsInSeparateFolder = structure.testsInTestFolder > 0;
        
        if (hasTestsInUseCases && !hasTestsInSeparateFolder) {
          passed = true;
          details = `✓ ${structure.testsInUseCases} tests junto al código`;
        } else if (hasTestsInUseCases && hasTestsInSeparateFolder) {
          passed = false;
          details = `⚠ ${structure.testsInUseCases} tests en casos de uso, pero también ${structure.testsInTestFolder} en carpeta test/ separada`;
        } else if (hasTestsInSeparateFolder) {
          passed = false;
          details = `✗ ${structure.testsInTestFolder} tests en carpeta test/ separada (deben estar junto al código)`;
        } else {
          passed = false;
          details = '✗ No se encontraron tests';
        }
        break;
        
      case 'hasConfigFolder':
        passed = structure.hasConfig;
        details = passed 
          ? '✓ Tiene carpeta config/'
          : '✗ No tiene carpeta config/';
        break;
        
      case 'hasIndexFile':
        passed = structure.hasIndexFile;
        details = passed 
          ? '✓ Tiene index.ts en raíz'
          : '✗ No tiene index.ts en raíz';
        break;
    }
    
    if (passed) {
      totalScore += criterion.weight;
    }
    
    results[key] = {
      passed,
      details,
      weight: criterion.weight,
      score: passed ? criterion.weight : 0
    };
  }
  
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  return {
    results,
    totalScore,
    maxScore,
    percentage,
    status: percentage >= 90 ? 'excellent' : percentage >= 70 ? 'good' : percentage >= 50 ? 'needs-improvement' : 'poor'
  };
}

/**
 * Genera el reporte de validación
 */
function generateReport(servicesData) {
  const reportLines = [];
  
  reportLines.push('# Reporte de Validación de Screaming Architecture');
  reportLines.push('');
  reportLines.push(`Fecha: ${new Date().toLocaleString('es-ES')}`);
  reportLines.push('');
  reportLines.push('## Resumen');
  reportLines.push('');
  
  // Estadísticas generales
  const totalServices = servicesData.length;
  const excellentServices = servicesData.filter(s => s.validation.status === 'excellent').length;
  const goodServices = servicesData.filter(s => s.validation.status === 'good').length;
  const needsImprovementServices = servicesData.filter(s => s.validation.status === 'needs-improvement').length;
  const poorServices = servicesData.filter(s => s.validation.status === 'poor').length;
  
  const avgScore = Math.round(servicesData.reduce((sum, s) => sum + s.validation.percentage, 0) / totalServices);
  
  reportLines.push(`- **Total de servicios analizados**: ${totalServices}`);
  reportLines.push(`- **Puntuación promedio**: ${avgScore}%`);
  reportLines.push('');
  reportLines.push('### Distribución por Estado');
  reportLines.push('');
  reportLines.push(`- 🟢 **Excelente** (≥90%): ${excellentServices} servicios`);
  reportLines.push(`- 🟡 **Bueno** (70-89%): ${goodServices} servicios`);
  reportLines.push(`- 🟠 **Necesita mejoras** (50-69%): ${needsImprovementServices} servicios`);
  reportLines.push(`- 🔴 **Pobre** (<50%): ${poorServices} servicios`);
  reportLines.push('');
  
  // Agrupar por dominio
  const byDomain = {};
  for (const service of servicesData) {
    if (!byDomain[service.service.domain]) {
      byDomain[service.service.domain] = [];
    }
    byDomain[service.service.domain].push(service);
  }
  
  reportLines.push('## Resultados por Dominio');
  reportLines.push('');
  
  for (const [domain, services] of Object.entries(byDomain)) {
    reportLines.push(`### Dominio: ${domain}`);
    reportLines.push('');
    
    // Ordenar por puntuación (mayor a menor)
    services.sort((a, b) => b.validation.percentage - a.validation.percentage);
    
    for (const serviceData of services) {
      const { service, structure, validation } = serviceData;
      const statusIcon = validation.status === 'excellent' ? '🟢' : 
                        validation.status === 'good' ? '🟡' : 
                        validation.status === 'needs-improvement' ? '🟠' : '🔴';
      
      reportLines.push(`#### ${statusIcon} ${service.name} (${validation.percentage}%)`);
      reportLines.push('');
      reportLines.push(`**Ruta**: \`${service.relativePath}\``);
      reportLines.push('');
      reportLines.push('**Criterios de validación**:');
      reportLines.push('');
      
      for (const [key, criterion] of Object.entries(VALIDATION_CRITERIA)) {
        const result = validation.results[key];
        const icon = result.passed ? '✅' : '❌';
        reportLines.push(`- ${icon} **${criterion.name}** (${result.score}/${result.weight} pts): ${result.details}`);
      }
      
      reportLines.push('');
      
      // Recomendaciones si no es excelente
      if (validation.status !== 'excellent') {
        reportLines.push('**Recomendaciones**:');
        reportLines.push('');
        
        for (const [key, result] of Object.entries(validation.results)) {
          if (!result.passed) {
            const criterion = VALIDATION_CRITERIA[key];
            reportLines.push(`- ${criterion.description}`);
          }
        }
        
        reportLines.push('');
      }
    }
  }
  
  // Resumen de cumplimiento por criterio
  reportLines.push('## Cumplimiento por Criterio');
  reportLines.push('');
  reportLines.push('| Criterio | Servicios que cumplen | Porcentaje |');
  reportLines.push('|----------|----------------------|------------|');
  
  for (const [key, criterion] of Object.entries(VALIDATION_CRITERIA)) {
    const passingServices = servicesData.filter(s => s.validation.results[key].passed).length;
    const percentage = Math.round((passingServices / totalServices) * 100);
    reportLines.push(`| ${criterion.name} | ${passingServices}/${totalServices} | ${percentage}% |`);
  }
  
  reportLines.push('');
  
  // Servicios que necesitan atención urgente
  const urgentServices = servicesData.filter(s => s.validation.status === 'poor' || s.validation.status === 'needs-improvement');
  
  if (urgentServices.length > 0) {
    reportLines.push('## Servicios que Necesitan Atención');
    reportLines.push('');
    reportLines.push('Los siguientes servicios tienen puntuaciones bajas y deben ser refactorizados:');
    reportLines.push('');
    
    urgentServices.sort((a, b) => a.validation.percentage - b.validation.percentage);
    
    for (const serviceData of urgentServices) {
      const { service, validation } = serviceData;
      reportLines.push(`- **${service.name}** (${service.domain}): ${validation.percentage}% - \`${service.relativePath}\``);
    }
    
    reportLines.push('');
  }
  
  // Conclusión
  reportLines.push('## Conclusión');
  reportLines.push('');
  
  if (avgScore >= 90) {
    reportLines.push('✅ **Excelente**: La mayoría de los servicios siguen correctamente Screaming Architecture.');
  } else if (avgScore >= 70) {
    reportLines.push('🟡 **Bueno**: Los servicios están en buen camino, pero algunos necesitan ajustes.');
  } else if (avgScore >= 50) {
    reportLines.push('🟠 **Necesita mejoras**: Varios servicios requieren refactorización para cumplir con Screaming Architecture.');
  } else {
    reportLines.push('🔴 **Crítico**: La mayoría de los servicios no siguen Screaming Architecture y requieren refactorización urgente.');
  }
  
  reportLines.push('');
  reportLines.push('---');
  reportLines.push('');
  reportLines.push('*Reporte generado automáticamente por validate-screaming-architecture.js*');
  
  return reportLines.join('\n');
}

/**
 * Imprime el reporte en consola con colores
 */
function printConsoleReport(servicesData) {
  console.log(`\n${colors.bold}${colors.cyan}=== REPORTE DE VALIDACIÓN DE SCREAMING ARCHITECTURE ===${colors.reset}\n`);
  
  const totalServices = servicesData.length;
  const avgScore = Math.round(servicesData.reduce((sum, s) => sum + s.validation.percentage, 0) / totalServices);
  
  console.log(`${colors.bold}Total de servicios:${colors.reset} ${totalServices}`);
  console.log(`${colors.bold}Puntuación promedio:${colors.reset} ${avgScore}%\n`);
  
  // Agrupar por dominio
  const byDomain = {};
  for (const service of servicesData) {
    if (!byDomain[service.service.domain]) {
      byDomain[service.service.domain] = [];
    }
    byDomain[service.service.domain].push(service);
  }
  
  for (const [domain, services] of Object.entries(byDomain)) {
    console.log(`${colors.bold}${colors.blue}Dominio: ${domain}${colors.reset}`);
    
    services.sort((a, b) => b.validation.percentage - a.validation.percentage);
    
    for (const serviceData of services) {
      const { service, validation } = serviceData;
      const color = validation.status === 'excellent' ? colors.green : 
                   validation.status === 'good' ? colors.yellow : 
                   validation.status === 'needs-improvement' ? colors.yellow : colors.red;
      
      console.log(`  ${color}${service.name}: ${validation.percentage}%${colors.reset} (${validation.totalScore}/${validation.maxScore} pts)`);
    }
    
    console.log('');
  }
}

/**
 * Función principal
 */
function main() {
  console.log(`${colors.bold}${colors.cyan}Validando estructura de servicios...${colors.reset}\n`);
  
  // Obtener todos los servicios
  const services = getAllServices();
  
  if (services.length === 0) {
    console.error(`${colors.red}No se encontraron servicios para analizar${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`Encontrados ${services.length} servicios\n`);
  
  // Analizar cada servicio
  const servicesData = [];
  
  for (const service of services) {
    console.log(`Analizando ${colors.cyan}${service.name}${colors.reset} (${service.domain})...`);
    
    const structure = analyzeServiceStructure(service);
    const validation = validateService(service, structure);
    
    servicesData.push({
      service,
      structure,
      validation
    });
  }
  
  console.log('');
  
  // Imprimir reporte en consola
  printConsoleReport(servicesData);
  
  // Generar reporte en archivo
  const report = generateReport(servicesData);
  const reportPath = path.join(process.cwd(), '.kiro', 'specs', 'project-refactor-screaming-architecture', 'DOMAIN_STRUCTURE_VALIDATION.md');
  
  fs.writeFileSync(reportPath, report, 'utf8');
  
  console.log(`${colors.green}✓ Reporte generado en: ${reportPath}${colors.reset}\n`);
  
  // Retornar código de salida basado en puntuación promedio
  const avgScore = Math.round(servicesData.reduce((sum, s) => sum + s.validation.percentage, 0) / servicesData.length);
  
  if (avgScore >= 70) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Ejecutar
main();
