#!/usr/bin/env node

/**
 * Script para detectar imports que pueden ser optimizados
 * 
 * Uso:
 *   node scripts/optimize-imports.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

/**
 * Obtiene todos los archivos TypeScript/JavaScript del proyecto
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Analiza imports en un archivo
 */
function analyzeImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  // Detectar imports de librerías completas que deberían ser específicos
  const optimizableImports = [
    {
      pattern: /import\s+\*\s+as\s+\w+\s+from\s+['"]lodash['"]/g,
      message: 'Importar lodash completo. Usa imports específicos: import debounce from "lodash/debounce"',
      library: 'lodash'
    },
    {
      pattern: /import\s+\{\s*[^}]+\s*\}\s+from\s+['"]lucide-react['"]/g,
      message: 'Importar múltiples iconos de lucide-react. Considera si todos son necesarios.',
      library: 'lucide-react'
    },
    {
      pattern: /import\s+\*\s+as\s+\w+\s+from\s+['"]date-fns['"]/g,
      message: 'Importar date-fns completo. Usa imports específicos: import { format } from "date-fns"',
      library: 'date-fns'
    },
    {
      pattern: /import\s+\{\s*[^}]{100,}\s*\}\s+from/g,
      message: 'Import muy largo (>100 caracteres). Considera dividir o revisar si todos son necesarios.',
      library: 'general'
    },
  ];
  
  optimizableImports.forEach(({ pattern, message, library }) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        issues.push({
          file: path.relative(process.cwd(), filePath),
          library,
          message,
          import: match.substring(0, 80) + (match.length > 80 ? '...' : '')
        });
      });
    }
  });
  
  // Detectar imports duplicados
  const importLines = content.match(/^import\s+.+$/gm) || [];
  const importMap = new Map();
  
  importLines.forEach(line => {
    const match = line.match(/from\s+['"]([^'"]+)['"]/);
    if (match) {
      const source = match[1];
      if (importMap.has(source)) {
        importMap.get(source).push(line);
      } else {
        importMap.set(source, [line]);
      }
    }
  });
  
  importMap.forEach((lines, source) => {
    if (lines.length > 1) {
      issues.push({
        file: path.relative(process.cwd(), filePath),
        library: source,
        message: `Imports duplicados de "${source}". Considera consolidarlos en una sola línea.`,
        import: lines.join('\n')
      });
    }
  });
  
  return issues;
}

/**
 * Analiza todos los archivos
 */
function analyzeAllFiles() {
  console.log('\n🔍 Analizando imports del proyecto...\n');
  
  const files = getAllFiles(SRC_DIR);
  const allIssues = [];
  
  files.forEach(file => {
    const issues = analyzeImports(file);
    allIssues.push(...issues);
  });
  
  return allIssues;
}

/**
 * Agrupa issues por tipo
 */
function groupIssues(issues) {
  const grouped = {
    lodash: [],
    'lucide-react': [],
    'date-fns': [],
    duplicates: [],
    long: [],
    other: []
  };
  
  issues.forEach(issue => {
    if (issue.message.includes('duplicados')) {
      grouped.duplicates.push(issue);
    } else if (issue.message.includes('muy largo')) {
      grouped.long.push(issue);
    } else if (issue.library === 'lodash') {
      grouped.lodash.push(issue);
    } else if (issue.library === 'lucide-react') {
      grouped['lucide-react'].push(issue);
    } else if (issue.library === 'date-fns') {
      grouped['date-fns'].push(issue);
    } else {
      grouped.other.push(issue);
    }
  });
  
  return grouped;
}

/**
 * Imprime el reporte
 */
function printReport() {
  console.log('═'.repeat(80));
  console.log('🎯 Análisis de Optimización de Imports - TechNovaStore Frontend');
  console.log('═'.repeat(80));
  
  const issues = analyzeAllFiles();
  const grouped = groupIssues(issues);
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Total de oportunidades de optimización: ${issues.length}`);
  
  if (issues.length === 0) {
    console.log(`\n✅ No se encontraron imports que necesiten optimización.`);
    console.log('═'.repeat(80));
    console.log('✨ Análisis completado\n');
    return;
  }
  
  // Imports duplicados
  if (grouped.duplicates.length > 0) {
    console.log(`\n🔄 Imports Duplicados (${grouped.duplicates.length}):\n`);
    grouped.duplicates.slice(0, 5).forEach(issue => {
      console.log(`   📄 ${issue.file}`);
      console.log(`      ${issue.message}`);
      console.log('');
    });
    if (grouped.duplicates.length > 5) {
      console.log(`   ... y ${grouped.duplicates.length - 5} más\n`);
    }
  }
  
  // Imports largos
  if (grouped.long.length > 0) {
    console.log(`\n📏 Imports Largos (${grouped.long.length}):\n`);
    grouped.long.slice(0, 5).forEach(issue => {
      console.log(`   📄 ${issue.file}`);
      console.log(`      ${issue.message}`);
      console.log('');
    });
    if (grouped.long.length > 5) {
      console.log(`   ... y ${grouped.long.length - 5} más\n`);
    }
  }
  
  // Lodash
  if (grouped.lodash.length > 0) {
    console.log(`\n📦 Lodash (${grouped.lodash.length}):\n`);
    grouped.lodash.forEach(issue => {
      console.log(`   📄 ${issue.file}`);
      console.log(`      ${issue.message}`);
      console.log('');
    });
  }
  
  // Date-fns
  if (grouped['date-fns'].length > 0) {
    console.log(`\n📅 Date-fns (${grouped['date-fns'].length}):\n`);
    grouped['date-fns'].forEach(issue => {
      console.log(`   📄 ${issue.file}`);
      console.log(`      ${issue.message}`);
      console.log('');
    });
  }
  
  // Lucide React
  if (grouped['lucide-react'].length > 0) {
    console.log(`\n🎨 Lucide React (${grouped['lucide-react'].length}):\n`);
    grouped['lucide-react'].slice(0, 5).forEach(issue => {
      console.log(`   📄 ${issue.file}`);
      console.log(`      ${issue.message}`);
      console.log('');
    });
    if (grouped['lucide-react'].length > 5) {
      console.log(`   ... y ${grouped['lucide-react'].length - 5} más\n`);
    }
  }
  
  console.log('\n💡 Recomendaciones:\n');
  console.log('   1. Consolida imports duplicados en una sola línea');
  console.log('   2. Usa imports específicos en lugar de importar librerías completas');
  console.log('   3. Revisa si todos los imports largos son realmente necesarios');
  console.log('   4. Considera usar dynamic imports para componentes pesados');
  
  console.log('\n═'.repeat(80));
  console.log('✨ Análisis completado\n');
}

// Ejecutar el análisis
try {
  printReport();
} catch (error) {
  console.error('❌ Error al analizar imports:', error.message);
  console.error(error.stack);
  process.exit(1);
}
