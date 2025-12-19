#!/usr/bin/env node

/**
 * Script para detectar dependencias no utilizadas en el proyecto
 * 
 * Uso:
 *   node scripts/check-unused-deps.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const PACKAGE_JSON = path.join(__dirname, '..', 'package.json');

/**
 * Lee el package.json
 */
function readPackageJson() {
  const content = fs.readFileSync(PACKAGE_JSON, 'utf-8');
  return JSON.parse(content);
}

/**
 * Obtiene todos los archivos TypeScript/JavaScript del proyecto
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorar node_modules y .next
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
 * Extrae imports de un archivo
 */
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = new Set();
  
  // Regex para detectar imports
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    // Solo considerar imports de node_modules (no relativos)
    if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
      // Extraer el nombre del paquete (sin sub-paths)
      const packageName = importPath.startsWith('@') 
        ? importPath.split('/').slice(0, 2).join('/')
        : importPath.split('/')[0];
      imports.add(packageName);
    }
  }
  
  while ((match = requireRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
      const packageName = importPath.startsWith('@') 
        ? importPath.split('/').slice(0, 2).join('/')
        : importPath.split('/')[0];
      imports.add(packageName);
    }
  }
  
  return imports;
}

/**
 * Analiza el uso de dependencias
 */
function analyzeDependencies() {
  console.log('\n🔍 Analizando dependencias del proyecto...\n');
  
  const pkg = readPackageJson();
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies
  };
  
  const files = getAllFiles(SRC_DIR);
  const usedDeps = new Set();
  
  // Analizar todos los archivos
  files.forEach(file => {
    const imports = extractImports(file);
    imports.forEach(dep => usedDeps.add(dep));
  });
  
  // También revisar next.config.js
  const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const imports = extractImports(nextConfigPath);
    imports.forEach(dep => usedDeps.add(dep));
  }
  
  // Dependencias que siempre se consideran usadas (aunque no aparezcan en imports)
  const alwaysUsed = new Set([
    'next',
    'react',
    'react-dom',
    'typescript',
    'eslint',
    'prettier',
    'tailwindcss',
    'postcss',
    'autoprefixer',
    '@types/node',
    '@types/react',
    '@types/react-dom',
    'eslint-config-next',
    'eslint-config-prettier',
  ]);
  
  alwaysUsed.forEach(dep => usedDeps.add(dep));
  
  // Encontrar dependencias no utilizadas
  const unusedDeps = [];
  const usedDepsList = [];
  
  Object.keys(allDeps).forEach(dep => {
    if (usedDeps.has(dep)) {
      usedDepsList.push(dep);
    } else {
      unusedDeps.push(dep);
    }
  });
  
  return { unusedDeps, usedDepsList, totalDeps: Object.keys(allDeps).length };
}

/**
 * Imprime el reporte
 */
function printReport() {
  console.log('═'.repeat(80));
  console.log('📦 Análisis de Dependencias - TechNovaStore Frontend');
  console.log('═'.repeat(80));
  
  const { unusedDeps, usedDepsList, totalDeps } = analyzeDependencies();
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Total de dependencias:    ${totalDeps}`);
  console.log(`   Dependencias usadas:      ${usedDepsList.length}`);
  console.log(`   Dependencias sin usar:    ${unusedDeps.length}`);
  
  if (unusedDeps.length > 0) {
    console.log(`\n⚠️  Dependencias potencialmente no utilizadas:\n`);
    unusedDeps.forEach(dep => {
      console.log(`   - ${dep}`);
    });
    console.log(`\n💡 Nota: Verifica manualmente antes de eliminar. Algunas dependencias`);
    console.log(`   pueden ser usadas indirectamente o en configuraciones.`);
  } else {
    console.log(`\n✅ Todas las dependencias están siendo utilizadas.`);
  }
  
  console.log('\n═'.repeat(80));
  console.log('✨ Análisis completado\n');
}

// Ejecutar el análisis
try {
  printReport();
} catch (error) {
  console.error('❌ Error al analizar dependencias:', error.message);
  process.exit(1);
}
