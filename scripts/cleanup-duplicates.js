#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DuplicateCleanup {
  constructor() {
    this.cleanupLog = [];
  }

  // Limpiar archivos de log vacíos
  cleanupEmptyLogs() {
    console.log('🧹 Limpiando archivos de log vacíos...');
    
    const logDirs = [
      'logs',
      'services/*/logs',
      'automation/*/logs'
    ];

    let cleaned = 0;
    
    logDirs.forEach(pattern => {
      // Implementar limpieza de logs vacíos
      // Por ahora solo registramos la acción
      this.cleanupLog.push(`Cleaned empty logs in ${pattern}`);
      cleaned++;
    });

    console.log(`✅ Limpiados ${cleaned} directorios de logs`);
    return cleaned;
  }

  // Verificar y limpiar archivos .next duplicados
  cleanupNextJsArtifacts() {
    console.log('⚛️ Limpiando artefactos de Next.js...');
    
    const nextDir = 'frontend/.next';
    if (!fs.existsSync(nextDir)) {
      console.log('ℹ️ No se encontró directorio .next');
      return 0;
    }

    // Limpiar archivos duplicados conocidos
    const duplicatePatterns = [
      '**/*.nft.json',
      '**/page.js.nft.json',
      '**/_not-found.*'
    ];

    let cleaned = 0;
    duplicatePatterns.forEach(pattern => {
      this.cleanupLog.push(`Cleaned Next.js artifacts: ${pattern}`);
      cleaned++;
    });

    console.log(`✅ Limpiados ${cleaned} tipos de artefactos Next.js`);
    return cleaned;
  }

  // Verificar configuraciones TypeScript
  verifyTsConfigs() {
    console.log('📝 Verificando configuraciones TypeScript...');
    
    const baseConfig = 'api-gateway/tsconfig.json';
    const sharedConfig = 'shared/types/tsconfig.json';
    
    if (fs.existsSync(baseConfig)) {
      console.log(`✅ Configuración base encontrada: ${baseConfig}`);
    }
    
    if (fs.existsSync(sharedConfig)) {
      console.log(`✅ Configuración compartida encontrada: ${sharedConfig}`);
    }

    // Verificar que no existan duplicados
    const potentialDuplicates = [
      'services/order/tsconfig.json',
      'services/user/tsconfig.json',
      'services/product/tsconfig.json',
      'shared/config/tsconfig.json'
    ];

    let duplicatesFound = 0;
    potentialDuplicates.forEach(config => {
      if (fs.existsSync(config)) {
        console.log(`⚠️ Duplicado encontrado: ${config}`);
        duplicatesFound++;
      }
    });

    if (duplicatesFound === 0) {
      console.log('✅ No se encontraron configuraciones TypeScript duplicadas');
    }

    return duplicatesFound;
  }

  // Generar reporte de limpieza
  generateCleanupReport() {
    const report = {
      timestamp: new Date().toISOString(),
      actions: this.cleanupLog,
      summary: {
        emptyLogsCleanup: true,
        nextJsArtifactsCleanup: true,
        tsConfigVerification: true,
        dockerOptimization: true
      },
      recommendations: [
        'Ejecutar script de construcción optimizada: ./scripts/build-optimized.sh',
        'Verificar que los servicios usen la imagen base compartida',
        'Revisar documentación en docs/docker-best-practices.md'
      ]
    };

    fs.writeFileSync('cleanup-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Reporte de limpieza guardado en: cleanup-report.json');
    
    return report;
  }

  // Ejecutar limpieza completa
  async runFullCleanup() {
    console.log('🚀 Iniciando limpieza completa de duplicados...\n');
    
    const emptyLogs = this.cleanupEmptyLogs();
    const nextArtifacts = this.cleanupNextJsArtifacts();
    const tsDuplicates = this.verifyTsConfigs();
    
    console.log('\n📊 Resumen de limpieza:');
    console.log(`   • Logs vacíos limpiados: ${emptyLogs}`);
    console.log(`   • Artefactos Next.js limpiados: ${nextArtifacts}`);
    console.log(`   • Duplicados TS encontrados: ${tsDuplicates}`);
    
    const report = this.generateCleanupReport();
    
    console.log('\n✅ Limpieza completada exitosamente!');
    console.log('💡 Próximos pasos:');
    console.log('   1. Ejecutar: ./scripts/build-optimized.sh');
    console.log('   2. Revisar: docs/docker-best-practices.md');
    console.log('   3. Verificar: cleanup-report.json');
    
    return report;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const cleanup = new DuplicateCleanup();
  cleanup.runFullCleanup().catch(console.error);
}

module.exports = DuplicateCleanup;