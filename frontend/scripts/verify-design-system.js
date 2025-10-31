/**
 * Script de Verificación del Sistema de Diseño
 * 
 * Este script verifica que todos los archivos del sistema de diseño
 * estén presentes y correctamente configurados.
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'tailwind.config.js',
  'src/styles/variables.css',
  'src/styles/DESIGN_SYSTEM.md',
  'src/styles/README.md',
  'src/styles/examples.tsx',
  'src/lib/theme.config.ts',
  'src/lib/theme.ts',
  'src/app/globals.css',
];

const REQUIRED_VARIABLES = [
  '--color-primary-500',
  '--color-accent-500',
  '--color-gray-900',
  '--color-success',
  '--font-sans',
  '--text-base',
  '--space-4',
  '--radius-md',
  '--shadow-md',
  '--transition-base',
];

console.log('🔍 Verificando Sistema de Diseño...\n');

let allFilesExist = true;
let allVariablesExist = true;

// Verificar archivos
console.log('📁 Verificando archivos requeridos:');
REQUIRED_FILES.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NO ENCONTRADO`);
    allFilesExist = false;
  }
});

// Verificar variables CSS
console.log('\n🎨 Verificando variables CSS:');
const variablesPath = path.join(__dirname, '..', 'src/styles/variables.css');
if (fs.existsSync(variablesPath)) {
  const variablesContent = fs.readFileSync(variablesPath, 'utf8');
  
  REQUIRED_VARIABLES.forEach(variable => {
    const exists = variablesContent.includes(variable);
    
    if (exists) {
      console.log(`  ✅ ${variable}`);
    } else {
      console.log(`  ❌ ${variable} - NO ENCONTRADA`);
      allVariablesExist = false;
    }
  });
} else {
  console.log('  ❌ No se pudo leer variables.css');
  allVariablesExist = false;
}

// Verificar configuración de Tailwind
console.log('\n⚙️  Verificando configuración de Tailwind:');
const tailwindPath = path.join(__dirname, '..', 'tailwind.config.js');
if (fs.existsSync(tailwindPath)) {
  const tailwindContent = fs.readFileSync(tailwindPath, 'utf8');
  
  const checks = [
    { name: 'darkMode configurado', pattern: /darkMode:\s*['"]class['"]/ },
    { name: 'Colores primarios', pattern: /primary:\s*{/ },
    { name: 'Colores de acento', pattern: /accent:\s*{/ },
    { name: 'Breakpoints', pattern: /screens:\s*{/ },
    { name: 'Animaciones', pattern: /animation:\s*{/ },
  ];
  
  checks.forEach(check => {
    const exists = check.pattern.test(tailwindContent);
    
    if (exists) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name} - NO CONFIGURADO`);
    }
  });
} else {
  console.log('  ❌ No se pudo leer tailwind.config.js');
}

// Verificar theme.config.ts
console.log('\n📦 Verificando theme.config.ts:');
const themeConfigPath = path.join(__dirname, '..', 'src/lib/theme.config.ts');
if (fs.existsSync(themeConfigPath)) {
  const themeConfigContent = fs.readFileSync(themeConfigPath, 'utf8');
  
  const checks = [
    { name: 'themeConfig exportado', pattern: /export const themeConfig/ },
    { name: 'isDarkMode helper', pattern: /export const isDarkMode/ },
    { name: 'toggleDarkMode helper', pattern: /export const toggleDarkMode/ },
    { name: 'initializeTheme helper', pattern: /export const initializeTheme/ },
    { name: 'Tipos TypeScript', pattern: /export type ThemeConfig/ },
  ];
  
  checks.forEach(check => {
    const exists = check.pattern.test(themeConfigContent);
    
    if (exists) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name} - NO ENCONTRADO`);
    }
  });
} else {
  console.log('  ❌ No se pudo leer theme.config.ts');
}

// Resumen final
console.log('\n' + '='.repeat(50));
if (allFilesExist && allVariablesExist) {
  console.log('✅ Sistema de Diseño configurado correctamente');
  console.log('\n📚 Documentación disponible en:');
  console.log('   - src/styles/DESIGN_SYSTEM.md');
  console.log('   - src/styles/README.md');
  console.log('\n💡 Ejemplos de uso en:');
  console.log('   - src/styles/examples.tsx');
  console.log('\n🎨 Configuración del tema en:');
  console.log('   - src/lib/theme.config.ts');
  console.log('   - src/lib/theme.ts');
  process.exit(0);
} else {
  console.log('❌ Hay problemas con el Sistema de Diseño');
  console.log('\nPor favor, revisa los archivos marcados con ❌');
  process.exit(1);
}
