#!/usr/bin/env node

/**
 * Índice de herramientas de migración
 * Proporciona acceso fácil a todas las herramientas disponibles
 */

const DuplicationAnalyzer = require('./analyze-duplications');
const StructureAnalyzer = require('./generate-structure-report');
const GitBackupUtility = require('./git-backup-utility');
const MigrationPreparation = require('./prepare-migration');

module.exports = {
  DuplicationAnalyzer,
  StructureAnalyzer,
  GitBackupUtility,
  MigrationPreparation
};

// CLI interactivo
if (require.main === module) {
  console.log('\n🛠️  Herramientas de Migración - TechNovaStore\n');
  console.log('Herramientas disponibles:\n');
  console.log('1. Preparación completa (recomendado)');
  console.log('   node scripts/migration/prepare-migration.js\n');
  console.log('2. Análisis de duplicaciones');
  console.log('   node scripts/migration/analyze-duplications.js\n');
  console.log('3. Reporte de estructura');
  console.log('   node scripts/migration/generate-structure-report.js\n');
  console.log('4. Utilidad de backup Git');
  console.log('   node scripts/migration/git-backup-utility.js [comando]\n');
  console.log('Comandos de backup disponibles:');
  console.log('   - create-backup: Crear backup completo');
  console.log('   - create-checkpoint "mensaje": Crear checkpoint');
  console.log('   - list-checkpoints: Listar checkpoints');
  console.log('   - verify: Verificar integridad\n');
  console.log('📖 Para más información, consulta: scripts/migration/README.md\n');
}
