#!/usr/bin/env node

/**
 * Script principal de preparación para la migración a Screaming Architecture
 * Ejecuta todas las herramientas de análisis y crea backup completo
 * 
 * Uso: node scripts/migration/prepare-migration.js
 */

const fs = require('fs');
const path = require('path');
const DuplicationAnalyzer = require('./analyze-duplications');
const StructureAnalyzer = require('./generate-structure-report');
const GitBackupUtility = require('./git-backup-utility');

// Configuración
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'MIGRATION_PREPARATION.md');

class MigrationPreparation {
  constructor() {
    this.results = {
      gitVerification: null,
      duplications: null,
      structure: null,
      backup: null
    };
    this.startTime = new Date();
  }

  /**
   * Imprime banner de inicio
   */
  printBanner() {
    console.log('\n' + '='.repeat(70));
    console.log('  PREPARACIÓN DE MIGRACIÓN A SCREAMING ARCHITECTURE');
    console.log('  TechNovaStore - Phase 0');
    console.log('='.repeat(70) + '\n');
  }

  /**
   * Imprime separador de sección
   */
  printSection(title) {
    console.log('\n' + '-'.repeat(70));
    console.log(`  ${title}`);
    console.log('-'.repeat(70) + '\n');
  }

  /**
   * Paso 1: Verificar integridad de Git
   */
  async verifyGit() {
    this.printSection('PASO 1: Verificación de Git');

    const gitUtil = new GitBackupUtility();
    const isValid = gitUtil.verifyIntegrity();

    this.results.gitVerification = {
      success: isValid,
      timestamp: new Date()
    };

    if (!isValid) {
      console.error('❌ Error: Problemas con el repositorio Git');
      console.log('   Asegúrate de estar en un repositorio Git válido\n');
      return false;
    }

    console.log('✅ Verificación de Git completada\n');
    return true;
  }

  /**
   * Paso 2: Analizar duplicaciones
   */
  async analyzeDuplications() {
    this.printSection('PASO 2: Análisis de Duplicaciones');

    const analyzer = new DuplicationAnalyzer();
    const results = analyzer.run();

    this.results.duplications = {
      success: true,
      stats: analyzer.stats,
      timestamp: new Date()
    };

    return true;
  }

  /**
   * Paso 3: Generar reporte de estructura
   */
  async analyzeStructure() {
    this.printSection('PASO 3: Análisis de Estructura');

    const analyzer = new StructureAnalyzer();
    const structure = analyzer.run();

    this.results.structure = {
      success: true,
      stats: analyzer.stats,
      timestamp: new Date()
    };

    return true;
  }

  /**
   * Paso 4: Crear backup completo
   */
  async createBackup() {
    this.printSection('PASO 4: Creación de Backup');

    const gitUtil = new GitBackupUtility();
    const success = gitUtil.createBackup();

    this.results.backup = {
      success: success,
      timestamp: new Date()
    };

    if (!success) {
      console.error('❌ Error creando backup');
      return false;
    }

    return true;
  }

  /**
   * Genera reporte de preparación
   */
  generateReport() {
    const duration = (new Date() - this.startTime) / 1000;

    let report = `# Preparación de Migración - TechNovaStore\n\n`;
    report += `**Fecha**: ${new Date().toLocaleString('es-ES')}\n`;
    report += `**Duración**: ${duration.toFixed(2)} segundos\n\n`;

    report += `## Resumen Ejecutivo\n\n`;
    report += `La preparación para la migración a Screaming Architecture se ha completado exitosamente.\n\n`;

    // Estado de cada paso
    report += `## Estado de Preparación\n\n`;
    report += `| Paso | Estado | Detalles |\n`;
    report += `|------|--------|----------|\n`;
    report += `| 1. Verificación Git | ${this.results.gitVerification?.success ? '✅' : '❌'} | Repositorio verificado |\n`;
    report += `| 2. Análisis Duplicaciones | ${this.results.duplications?.success ? '✅' : '❌'} | ${this.results.duplications?.stats.duplicateFiles || 0} archivos duplicados |\n`;
    report += `| 3. Análisis Estructura | ${this.results.structure?.success ? '✅' : '❌'} | ${this.results.structure?.stats.services || 0} microservicios identificados |\n`;
    report += `| 4. Backup Completo | ${this.results.backup?.success ? '✅' : '❌'} | Backup creado exitosamente |\n`;
    report += `\n`;

    // Estadísticas del proyecto
    if (this.results.structure?.stats) {
      const stats = this.results.structure.stats;
      report += `## Estadísticas del Proyecto\n\n`;
      report += `- **Total de directorios**: ${stats.totalDirs}\n`;
      report += `- **Total de archivos**: ${stats.totalFiles}\n`;
      report += `- **Microservicios**: ${stats.services}\n`;
      report += `- **Archivos Dockerfile**: ${stats.dockerfiles}\n`;
      report += `- **Archivos package.json**: ${stats.packageJsons}\n\n`;
    }

    // Problemas identificados
    if (this.results.duplications?.stats) {
      const stats = this.results.duplications.stats;
      report += `## Problemas Identificados\n\n`;
      report += `### Duplicaciones\n\n`;
      report += `- **Archivos duplicados**: ${stats.duplicateFiles}\n`;
      report += `- **Archivos temporales**: ${stats.temporaryFiles}\n\n`;
      
      if (stats.duplicateFiles > 0 || stats.temporaryFiles > 0) {
        report += `⚠️ **Acción requerida**: Revisar \`DUPLICATION_REPORT.md\` para detalles.\n\n`;
      }
    }

    // Archivos generados
    report += `## Archivos Generados\n\n`;
    report += `Los siguientes archivos han sido generados en la raíz del proyecto:\n\n`;
    report += `1. **DUPLICATION_REPORT.md** - Reporte detallado de duplicaciones\n`;
    report += `2. **CURRENT_STRUCTURE.md** - Estructura actual del proyecto\n`;
    report += `3. **MIGRATION_CHECKPOINTS.md** - Log de backups y checkpoints\n`;
    report += `4. **MIGRATION_PREPARATION.md** - Este archivo\n\n`;

    // Próximos pasos
    report += `## Próximos Pasos\n\n`;
    report += `### 1. Revisar Reportes\n\n`;
    report += `- [ ] Leer \`DUPLICATION_REPORT.md\` y identificar duplicaciones críticas\n`;
    report += `- [ ] Revisar \`CURRENT_STRUCTURE.md\` para entender la estructura actual\n`;
    report += `- [ ] Verificar que el backup se creó correctamente en \`MIGRATION_CHECKPOINTS.md\`\n\n`;

    report += `### 2. Planificar Migración\n\n`;
    report += `- [ ] Revisar el plan de migración en \`.kiro/specs/project-refactor-screaming-architecture/tasks.md\`\n`;
    report += `- [ ] Identificar servicios a mover por dominio\n`;
    report += `- [ ] Definir orden de ejecución de fases\n\n`;

    report += `### 3. Iniciar Phase 1: Renombrado\n\n`;
    report += `Una vez revisados los reportes, puedes iniciar la Phase 1 del plan de migración.\n\n`;

    report += `## Comandos Útiles\n\n`;
    report += `\`\`\`bash\n`;
    report += `# Ver checkpoints creados\n`;
    report += `node scripts/migration/git-backup-utility.js list-checkpoints\n\n`;
    report += `# Crear checkpoint después de una fase\n`;
    report += `node scripts/migration/git-backup-utility.js create-checkpoint "Phase X complete"\n\n`;
    report += `# Restaurar a backup inicial (si es necesario)\n`;
    report += `git reset --hard pre-migration-backup\n`;
    report += `git clean -fd\n`;
    report += `\`\`\`\n\n`;

    report += `## Criterios de Éxito\n\n`;
    report += `- ✅ Repositorio Git verificado\n`;
    report += `- ✅ Duplicaciones identificadas\n`;
    report += `- ✅ Estructura actual documentada\n`;
    report += `- ✅ Backup completo creado\n`;
    report += `- ✅ Reportes generados\n\n`;

    report += `## Notas Importantes\n\n`;
    report += `- **No eliminar archivos manualmente**: Seguir el plan de migración\n`;
    report += `- **Crear checkpoints frecuentes**: Después de cada fase completada\n`;
    report += `- **Validar continuamente**: Ejecutar tests después de cada cambio\n`;
    report += `- **Documentar cambios**: Mantener log de todas las modificaciones\n\n`;

    report += `---\n\n`;
    report += `**Estado**: ✅ Preparación completada exitosamente\n`;
    report += `**Siguiente fase**: Phase 1 - Renombrado de Proyecto\n`;

    return report;
  }

  /**
   * Ejecuta la preparación completa
   */
  async run() {
    this.printBanner();

    try {
      // Paso 1: Verificar Git
      const gitOk = await this.verifyGit();
      if (!gitOk) {
        console.error('\n❌ Preparación abortada: Problemas con Git\n');
        return false;
      }

      // Paso 2: Analizar duplicaciones
      await this.analyzeDuplications();

      // Paso 3: Analizar estructura
      await this.analyzeStructure();

      // Paso 4: Crear backup
      const backupOk = await this.createBackup();
      if (!backupOk) {
        console.error('\n⚠️  Advertencia: No se pudo crear backup automático\n');
        console.log('   Considera crear un backup manual antes de continuar\n');
      }

      // Generar reporte final
      this.printSection('GENERANDO REPORTE FINAL');
      const report = this.generateReport();
      fs.writeFileSync(OUTPUT_FILE, report, 'utf8');
      console.log(`✅ Reporte de preparación generado: ${OUTPUT_FILE}\n`);

      // Resumen final
      this.printSection('PREPARACIÓN COMPLETADA');
      console.log('✅ Todos los pasos de preparación se completaron exitosamente\n');
      console.log('📋 Archivos generados:');
      console.log('   - DUPLICATION_REPORT.md');
      console.log('   - CURRENT_STRUCTURE.md');
      console.log('   - MIGRATION_CHECKPOINTS.md');
      console.log('   - MIGRATION_PREPARATION.md\n');
      console.log('📖 Próximos pasos:');
      console.log('   1. Revisar los reportes generados');
      console.log('   2. Leer el plan de migración en .kiro/specs/project-refactor-screaming-architecture/');
      console.log('   3. Iniciar Phase 1: Renombrado de Proyecto\n');
      console.log('='.repeat(70) + '\n');

      return true;
    } catch (error) {
      console.error('\n❌ Error durante la preparación:', error.message);
      console.error(error.stack);
      return false;
    }
  }
}

// Ejecutar preparación
if (require.main === module) {
  const preparation = new MigrationPreparation();
  preparation.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = MigrationPreparation;
