#!/usr/bin/env node

/**
 * Script para medir tiempos de compilación de Next.js
 * 
 * Este script mide el tiempo que tarda en compilar diferentes páginas
 * y verifica que estén dentro de los límites establecidos:
 * - Página principal: < 30 segundos
 * - Páginas de autenticación: < 10 segundos
 * 
 * Uso:
 *   node scripts/measure-compilation.js
 */

const { spawn } = require('child_process');
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
};

// Límites de tiempo (en segundos)
const TIME_LIMITS = {
  '/': 30, // Página principal
  '/login': 10, // Página de login
  '/register': 10, // Página de registro
  '/productos': 20, // Página de productos
  '/dashboard/admin': 25, // Dashboard de admin
};

// Resultados de compilación
const results = [];

/**
 * Mide el tiempo de compilación de una página
 */
async function measurePageCompilation(url) {
  console.log(`\n${colors.cyan}📊 Midiendo compilación de: ${url}${colors.reset}`);
  
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    // Hacer request a la página para forzar compilación
    const curl = spawn('curl', [
      '-s',
      '-o', '/dev/null',
      '-w', '%{http_code}',
      `http://localhost:3000${url}`
    ]);
    
    let output = '';
    
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.on('close', (code) => {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; // en segundos
      
      const statusCode = parseInt(output.trim());
      const success = statusCode >= 200 && statusCode < 400;
      
      const limit = TIME_LIMITS[url] || 30;
      const withinLimit = duration < limit;
      
      const result = {
        url,
        duration,
        limit,
        withinLimit,
        success,
        statusCode,
      };
      
      results.push(result);
      
      // Mostrar resultado
      const statusIcon = success ? '✓' : '✗';
      const statusColor = success ? colors.green : colors.red;
      
      const timeIcon = withinLimit ? '✓' : '⚠';
      const timeColor = withinLimit ? colors.green : colors.yellow;
      
      console.log(`  ${statusColor}${statusIcon} Status: ${statusCode}${colors.reset}`);
      console.log(`  ${timeColor}${timeIcon} Tiempo: ${duration.toFixed(2)}s (límite: ${limit}s)${colors.reset}`);
      
      resolve(result);
    });
    
    curl.on('error', (error) => {
      console.error(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
      reject(error);
    });
  });
}

/**
 * Genera reporte de resultados
 */
function generateReport() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}           REPORTE DE COMPILACIÓN${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  // Tabla de resultados
  console.log(`${colors.bright}Página                    Tiempo      Límite    Estado${colors.reset}`);
  console.log('─────────────────────────────────────────────────────────');
  
  let allPassed = true;
  
  results.forEach(result => {
    const timeColor = result.withinLimit ? colors.green : colors.yellow;
    const statusIcon = result.withinLimit ? '✓' : '⚠';
    
    const urlPadded = result.url.padEnd(25);
    const timePadded = `${result.duration.toFixed(2)}s`.padEnd(12);
    const limitPadded = `${result.limit}s`.padEnd(10);
    
    console.log(
      `${urlPadded}${timeColor}${timePadded}${colors.reset}${limitPadded}${timeColor}${statusIcon}${colors.reset}`
    );
    
    if (!result.withinLimit) {
      allPassed = false;
    }
  });
  
  console.log('─────────────────────────────────────────────────────────');
  
  // Estadísticas
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  const avgTime = totalTime / results.length;
  const slowest = results.reduce((max, r) => r.duration > max.duration ? r : max);
  const fastest = results.reduce((min, r) => r.duration < min.duration ? r : min);
  
  console.log(`\n${colors.bright}Estadísticas:${colors.reset}`);
  console.log(`  Tiempo total: ${totalTime.toFixed(2)}s`);
  console.log(`  Tiempo promedio: ${avgTime.toFixed(2)}s`);
  console.log(`  Más rápida: ${fastest.url} (${fastest.duration.toFixed(2)}s)`);
  console.log(`  Más lenta: ${slowest.url} (${slowest.duration.toFixed(2)}s)`);
  
  // Resultado final
  console.log(`\n${colors.bright}Resultado:${colors.reset}`);
  if (allPassed) {
    console.log(`${colors.green}✓ Todas las páginas se compilaron dentro del límite${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Algunas páginas excedieron el límite de tiempo${colors.reset}`);
    console.log(`${colors.yellow}  Considera optimizar las páginas lentas${colors.reset}`);
  }
  
  console.log('');
  
  return allPassed;
}

/**
 * Función principal
 */
async function main() {
  console.log(`${colors.bright}${colors.cyan}Iniciando medición de tiempos de compilación...${colors.reset}`);
  console.log(`${colors.cyan}Asegúrate de que el servidor de desarrollo esté corriendo en http://localhost:3000${colors.reset}`);
  
  // Esperar un momento para que el usuario pueda leer
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Medir cada página
  for (const url of Object.keys(TIME_LIMITS)) {
    try {
      await measurePageCompilation(url);
      // Esperar un poco entre mediciones para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`${colors.red}Error midiendo ${url}: ${error.message}${colors.reset}`);
    }
  }
  
  // Generar reporte
  const allPassed = generateReport();
  
  // Exit code
  process.exit(allPassed ? 0 : 1);
}

// Ejecutar
main().catch(error => {
  console.error(`${colors.red}Error fatal: ${error.message}${colors.reset}`);
  process.exit(1);
});
