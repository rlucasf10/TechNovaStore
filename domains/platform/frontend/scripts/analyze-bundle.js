#!/usr/bin/env node

/**
 * Script para analizar el bundle de Next.js
 * 
 * Este script ejecuta el bundle analyzer de Next.js y genera un reporte
 * con las dependencias más pesadas y recomendaciones de optimización.
 * 
 * Uso:
 *   ANALYZE=true npm run build
 *   node scripts/analyze-bundle.js
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

/**
 * Analiza el package.json para identificar dependencias pesadas
 */
function analyzePackageJson() {
  console.log(`\n${colors.bright}${colors.cyan}📦 Analizando dependencias...${colors.reset}\n`);
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  const dependencies = packageJson.dependencies || {};
  
  // Dependencias conocidas como pesadas
  const heavyDependencies = {
    'recharts': { size: '~400KB', recommendation: 'Usar dynamic imports' },
    'framer-motion': { size: '~200KB', recommendation: 'Usar dynamic imports para animaciones complejas' },
    '@tanstack/react-query': { size: '~50KB', recommendation: 'OK - necesaria para data fetching' },
    'axios': { size: '~30KB', recommendation: 'OK - necesaria para HTTP' },
    'socket.io-client': { size: '~100KB', recommendation: 'Cargar solo cuando se necesite chat' },
    'jspdf': { size: '~500KB', recommendation: 'Usar dynamic import - solo para generar PDFs' },
    'html2canvas': { size: '~200KB', recommendation: 'Usar dynamic import - solo para capturas' },
    'date-fns': { size: '~70KB', recommendation: 'Usar modularizeImports para tree-shaking' },
    'lucide-react': { size: '~600KB', recommendation: 'Usar modularizeImports para tree-shaking' },
    'zod': { size: '~50KB', recommendation: 'OK - necesaria para validación' },
  };
  
  console.log(`${colors.bright}Dependencias Pesadas Detectadas:${colors.reset}\n`);
  console.log(`${'Paquete'.padEnd(30)} ${'Tamaño'.padEnd(15)} Recomendación`);
  console.log('─'.repeat(80));
  
  let totalHeavyDeps = 0;
  
  Object.keys(dependencies).forEach(dep => {
    if (heavyDependencies[dep]) {
      const info = heavyDependencies[dep];
      const installed = '✓';
      const color = info.recommendation.includes('dynamic import') ? colors.yellow : colors.green;
      
      console.log(
        `${color}${installed} ${dep.padEnd(28)}${colors.reset} ` +
        `${info.size.padEnd(15)} ${info.recommendation}`
      );
      
      totalHeavyDeps++;
    }
  });
  
  if (totalHeavyDeps === 0) {
    console.log(`${colors.green}No se detectaron dependencias pesadas conocidas${colors.reset}`);
  }
  
  console.log('');
}

/**
 * Verifica la configuración de Next.js
 */
function verifyNextConfig() {
  console.log(`\n${colors.bright}${colors.cyan}⚙️  Verificando configuración de Next.js...${colors.reset}\n`);
  
  const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf-8');
  
  const checks = [
    {
      name: 'Bundle Analyzer',
      pattern: /withBundleAnalyzer/,
      status: nextConfigContent.match(/withBundleAnalyzer/) ? 'OK' : 'FALTA',
      recommendation: 'Permite analizar el tamaño del bundle',
    },
    {
      name: 'optimizePackageImports',
      pattern: /optimizePackageImports:/,
      status: nextConfigContent.match(/optimizePackageImports:/) ? 'OK' : 'FALTA',
      recommendation: 'Mejora tree-shaking de librerías grandes',
    },
    {
      name: 'modularizeImports',
      pattern: /modularizeImports:/,
      status: nextConfigContent.match(/modularizeImports:/) ? 'OK' : 'FALTA',
      recommendation: 'Permite importaciones modulares para tree-shaking',
    },
    {
      name: 'transpilePackages',
      pattern: /transpilePackages:/,
      status: nextConfigContent.match(/transpilePackages:/) ? 'OK' : 'FALTA',
      recommendation: 'Transpila paquetes específicos para mejor compatibilidad',
    },
    {
      name: 'removeConsole (producción)',
      pattern: /removeConsole:/,
      status: nextConfigContent.match(/removeConsole:/) ? 'OK' : 'FALTA',
      recommendation: 'Elimina console.log en producción',
    },
  ];
  
  console.log(`${'Configuración'.padEnd(30)} ${'Estado'.padEnd(10)} Descripción`);
  console.log('─'.repeat(80));
  
  checks.forEach(check => {
    const statusColor = check.status === 'OK' ? colors.green : colors.red;
    const icon = check.status === 'OK' ? '✓' : '✗';
    
    console.log(
      `${statusColor}${icon} ${check.name.padEnd(28)}${colors.reset} ` +
      `${check.status.padEnd(10)} ${check.recommendation}`
    );
  });
  
  console.log('');
}

/**
 * Busca componentes que usan librerías pesadas sin dynamic import
 */
function findHeavyComponentsWithoutDynamicImport() {
  console.log(`\n${colors.bright}${colors.cyan}🔍 Buscando componentes pesados sin dynamic import...${colors.reset}\n`);
  
  const srcPath = path.join(__dirname, '..', 'src');
  const issues = [];
  
  // Función recursiva para buscar archivos
  function searchFiles(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Ignorar node_modules y .next
        if (!file.startsWith('.') && file !== 'node_modules') {
          searchFiles(filePath);
        }
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Buscar importaciones de recharts sin dynamic
        if (content.includes('from \'recharts\'') || content.includes('from "recharts"')) {
          // Verificar si es un componente de página (puede necesitar dynamic import)
          if (filePath.includes('/app/') && !filePath.includes('/components/')) {
            issues.push({
              file: filePath.replace(srcPath, 'src'),
              library: 'recharts',
              severity: 'warning',
              message: 'Página importa recharts directamente - considerar dynamic import',
            });
          }
        }
        
        // Buscar importaciones de jspdf sin dynamic
        if (content.includes('from \'jspdf\'') || content.includes('from "jspdf"')) {
          if (!content.includes('dynamic(')) {
            issues.push({
              file: filePath.replace(srcPath, 'src'),
              library: 'jspdf',
              severity: 'warning',
              message: 'Importa jspdf sin dynamic import - debería ser lazy loaded',
            });
          }
        }
        
        // Buscar importaciones de html2canvas sin dynamic
        if (content.includes('from \'html2canvas\'') || content.includes('from "html2canvas"')) {
          if (!content.includes('dynamic(')) {
            issues.push({
              file: filePath.replace(srcPath, 'src'),
              library: 'html2canvas',
              severity: 'warning',
              message: 'Importa html2canvas sin dynamic import - debería ser lazy loaded',
            });
          }
        }
      }
    });
  }
  
  try {
    searchFiles(srcPath);
  } catch (error) {
    console.error(`${colors.red}Error buscando archivos: ${error.message}${colors.reset}`);
  }
  
  if (issues.length === 0) {
    console.log(`${colors.green}✓ No se encontraron problemas${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Se encontraron ${issues.length} posibles optimizaciones:${colors.reset}\n`);
    
    issues.forEach((issue, index) => {
      const severityColor = issue.severity === 'error' ? colors.red : colors.yellow;
      console.log(`${severityColor}${index + 1}. ${issue.file}${colors.reset}`);
      console.log(`   Librería: ${issue.library}`);
      console.log(`   ${issue.message}\n`);
    });
  }
}

/**
 * Genera recomendaciones finales
 */
function generateRecommendations() {
  console.log(`\n${colors.bright}${colors.cyan}💡 Recomendaciones de Optimización${colors.reset}\n`);
  
  const recommendations = [
    {
      priority: 'Alta',
      title: 'Usar dynamic imports para componentes pesados',
      description: 'Componentes que usan recharts, jspdf, html2canvas deben cargarse con dynamic()',
      example: 'const Chart = dynamic(() => import(\'./Chart\'), { ssr: false })',
    },
    {
      priority: 'Alta',
      title: 'Configurar modularizeImports',
      description: 'Permite importar solo los iconos/funciones necesarias de librerías grandes',
      example: 'modularizeImports: { \'lucide-react\': { transform: \'lucide-react/dist/esm/icons/{{member}}\' } }',
    },
    {
      priority: 'Media',
      title: 'Usar Suspense para lazy loading',
      description: 'Componentes below-the-fold deben cargarse con Suspense',
      example: '<Suspense fallback={<Loading />}><HeavyComponent /></Suspense>',
    },
    {
      priority: 'Media',
      title: 'Incrementar timeouts en desarrollo',
      description: 'Timeouts de 60s en desarrollo previenen errores durante compilaciones lentas',
      example: 'timeout: process.env.NODE_ENV === \'development\' ? 60000 : 30000',
    },
    {
      priority: 'Baja',
      title: 'Analizar bundle regularmente',
      description: 'Ejecutar ANALYZE=true npm run build periódicamente para detectar regresiones',
      example: 'ANALYZE=true npm run build',
    },
  ];
  
  recommendations.forEach((rec, index) => {
    const priorityColor = 
      rec.priority === 'Alta' ? colors.red :
      rec.priority === 'Media' ? colors.yellow :
      colors.green;
    
    console.log(`${colors.bright}${index + 1}. ${rec.title}${colors.reset}`);
    console.log(`   ${priorityColor}Prioridad: ${rec.priority}${colors.reset}`);
    console.log(`   ${rec.description}`);
    console.log(`   ${colors.cyan}Ejemplo: ${rec.example}${colors.reset}\n`);
  });
}

/**
 * Función principal
 */
function main() {
  console.log(`${colors.bright}${colors.magenta}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}        ANÁLISIS DE BUNDLE - NEXT.JS${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}═══════════════════════════════════════════════════${colors.reset}`);
  
  analyzePackageJson();
  verifyNextConfig();
  findHeavyComponentsWithoutDynamicImport();
  generateRecommendations();
  
  console.log(`${colors.bright}${colors.cyan}Análisis completado${colors.reset}\n`);
  console.log(`${colors.cyan}Para ver el análisis visual del bundle, ejecuta:${colors.reset}`);
  console.log(`${colors.bright}  ANALYZE=true npm run build${colors.reset}\n`);
}

// Ejecutar
main();
