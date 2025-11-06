#!/usr/bin/env node

/**
 * Utilidad para crear backups de Git durante la migración
 * Crea tags y commits de checkpoint para facilitar rollback
 * 
 * Uso: 
 *   node scripts/migration/git-backup-utility.js create-backup
 *   node scripts/migration/git-backup-utility.js create-checkpoint "Phase 1 complete"
 *   node scripts/migration/git-backup-utility.js list-checkpoints
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const BACKUP_LOG = path.join(PROJECT_ROOT, 'MIGRATION_CHECKPOINTS.md');

class GitBackupUtility {
  constructor() {
    this.checkpoints = [];
  }

  /**
   * Ejecuta un comando de Git
   */
  execGit(command) {
    try {
      const result = execSync(command, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return { success: true, output: result.trim() };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        output: error.stdout ? error.stdout.trim() : ''
      };
    }
  }

  /**
   * Verifica si estamos en un repositorio Git
   */
  isGitRepo() {
    const result = this.execGit('git rev-parse --is-inside-work-tree');
    return result.success && result.output === 'true';
  }

  /**
   * Obtiene el estado actual de Git
   */
  getGitStatus() {
    const result = this.execGit('git status --porcelain');
    return result.success ? result.output : '';
  }

  /**
   * Obtiene el hash del commit actual
   */
  getCurrentCommit() {
    const result = this.execGit('git rev-parse HEAD');
    return result.success ? result.output : null;
  }

  /**
   * Obtiene el branch actual
   */
  getCurrentBranch() {
    const result = this.execGit('git rev-parse --abbrev-ref HEAD');
    return result.success ? result.output : null;
  }

  /**
   * Verifica si hay cambios sin commitear
   */
  hasUncommittedChanges() {
    const status = this.getGitStatus();
    return status.length > 0;
  }

  /**
   * Crea un backup completo del proyecto
   */
  createBackup() {
    console.log('🔒 Creando backup completo del proyecto...\n');

    // Verificar que estamos en un repo Git
    if (!this.isGitRepo()) {
      console.error('❌ Error: No estamos en un repositorio Git');
      return false;
    }

    // Verificar cambios sin commitear
    if (this.hasUncommittedChanges()) {
      console.warn('⚠️  Advertencia: Hay cambios sin commitear');
      console.log('   Considera hacer commit antes de crear el backup\n');
    }

    const currentCommit = this.getCurrentCommit();
    const currentBranch = this.getCurrentBranch();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tagName = `pre-migration-backup-${timestamp}`;

    console.log(`📍 Branch actual: ${currentBranch}`);
    console.log(`📍 Commit actual: ${currentCommit}\n`);

    // Crear tag
    const tagResult = this.execGit(`git tag -a ${tagName} -m "Backup completo antes de migración a Screaming Architecture"`);
    
    if (!tagResult.success) {
      console.error(`❌ Error creando tag: ${tagResult.error}`);
      return false;
    }

    console.log(`✅ Tag creado: ${tagName}`);

    // Guardar información del backup
    const backupInfo = {
      tag: tagName,
      commit: currentCommit,
      branch: currentBranch,
      date: new Date().toISOString(),
      type: 'full-backup'
    };

    this.saveCheckpoint(backupInfo);

    console.log(`\n📝 Información del backup guardada en: ${BACKUP_LOG}`);
    console.log(`\n💡 Para restaurar este backup:`);
    console.log(`   git reset --hard ${tagName}`);
    console.log(`   git clean -fd\n`);

    return true;
  }

  /**
   * Crea un checkpoint de fase
   */
  createCheckpoint(message, phaseId = null) {
    console.log(`🔖 Creando checkpoint: "${message}"\n`);

    // Verificar que estamos en un repo Git
    if (!this.isGitRepo()) {
      console.error('❌ Error: No estamos en un repositorio Git');
      return false;
    }

    // Verificar que no hay cambios sin commitear
    if (this.hasUncommittedChanges()) {
      console.log('📝 Hay cambios sin commitear. Creando commit...\n');
      
      // Agregar todos los cambios
      const addResult = this.execGit('git add -A');
      if (!addResult.success) {
        console.error(`❌ Error agregando cambios: ${addResult.error}`);
        return false;
      }

      // Crear commit
      const commitMessage = message || 'Migration checkpoint';
      const commitResult = this.execGit(`git commit -m "${commitMessage}"`);
      if (!commitResult.success) {
        console.error(`❌ Error creando commit: ${commitResult.error}`);
        return false;
      }

      console.log(`✅ Commit creado: ${commitMessage}\n`);
    }

    const currentCommit = this.getCurrentCommit();
    const currentBranch = this.getCurrentBranch();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tagName = phaseId 
      ? `phase-${phaseId}-complete`
      : `checkpoint-${timestamp}`;

    // Crear tag
    const tagResult = this.execGit(`git tag -a ${tagName} -m "${message}"`);
    
    if (!tagResult.success) {
      console.error(`❌ Error creando tag: ${tagResult.error}`);
      return false;
    }

    console.log(`✅ Tag creado: ${tagName}`);
    console.log(`📍 Commit: ${currentCommit}\n`);

    // Guardar información del checkpoint
    const checkpointInfo = {
      tag: tagName,
      commit: currentCommit,
      branch: currentBranch,
      date: new Date().toISOString(),
      message: message,
      phase: phaseId,
      type: 'checkpoint'
    };

    this.saveCheckpoint(checkpointInfo);

    console.log(`💡 Para restaurar este checkpoint:`);
    console.log(`   git reset --hard ${tagName}\n`);

    return true;
  }

  /**
   * Guarda información del checkpoint en el log
   */
  saveCheckpoint(info) {
    this.checkpoints.push(info);

    let log = '';

    // Si el archivo existe, leerlo
    if (fs.existsSync(BACKUP_LOG)) {
      log = fs.readFileSync(BACKUP_LOG, 'utf8');
      
      // Extraer checkpoints existentes
      const existingMatch = log.match(/## Checkpoints Creados\n\n([\s\S]*?)(\n## |$)/);
      if (existingMatch) {
        // Parsear checkpoints existentes (simplificado)
        this.checkpoints = [info]; // Por ahora solo agregamos el nuevo
      }
    } else {
      // Crear archivo nuevo
      log = `# Checkpoints de Migración - TechNovaStore\n\n`;
      log += `Este archivo registra todos los checkpoints y backups creados durante la migración.\n\n`;
    }

    // Agregar nuevo checkpoint al log
    const checkpointEntry = `### ${info.type === 'full-backup' ? '🔒 Backup Completo' : '🔖 Checkpoint'}: ${info.tag}\n\n`;
    const entry = checkpointEntry +
      `- **Fecha**: ${new Date(info.date).toLocaleString('es-ES')}\n` +
      `- **Commit**: \`${info.commit}\`\n` +
      `- **Branch**: \`${info.branch}\`\n` +
      (info.message ? `- **Mensaje**: ${info.message}\n` : '') +
      (info.phase ? `- **Fase**: ${info.phase}\n` : '') +
      `- **Restaurar**: \`git reset --hard ${info.tag}\`\n\n`;

    // Insertar al inicio de la sección de checkpoints
    if (log.includes('## Checkpoints Creados')) {
      log = log.replace(
        /## Checkpoints Creados\n\n/,
        `## Checkpoints Creados\n\n${entry}`
      );
    } else {
      log += `## Checkpoints Creados\n\n${entry}`;
    }

    fs.writeFileSync(BACKUP_LOG, log, 'utf8');
  }

  /**
   * Lista todos los checkpoints
   */
  listCheckpoints() {
    console.log('📋 Listando checkpoints de migración...\n');

    // Obtener todos los tags relacionados con migración
    const tagsResult = this.execGit('git tag -l "*migration*" "*phase*" "*checkpoint*"');
    
    if (!tagsResult.success) {
      console.error('❌ Error listando tags');
      return;
    }

    const tags = tagsResult.output.split('\n').filter(t => t.trim());

    if (tags.length === 0) {
      console.log('ℹ️  No se encontraron checkpoints de migración\n');
      return;
    }

    console.log(`Se encontraron ${tags.length} checkpoints:\n`);

    for (const tag of tags) {
      // Obtener información del tag
      const infoResult = this.execGit(`git show ${tag} --format="%H|%ai|%s" --no-patch`);
      
      if (infoResult.success) {
        const [commit, date, message] = infoResult.output.split('|');
        console.log(`🔖 ${tag}`);
        console.log(`   Commit: ${commit.substring(0, 8)}`);
        console.log(`   Fecha: ${new Date(date).toLocaleString('es-ES')}`);
        console.log(`   Mensaje: ${message}`);
        console.log(`   Restaurar: git reset --hard ${tag}\n`);
      }
    }
  }

  /**
   * Verifica la integridad del repositorio
   */
  verifyIntegrity() {
    console.log('🔍 Verificando integridad del repositorio...\n');

    // Verificar que estamos en un repo Git
    if (!this.isGitRepo()) {
      console.error('❌ No estamos en un repositorio Git');
      return false;
    }

    // Verificar estado
    const status = this.getGitStatus();
    console.log(`📊 Estado del repositorio:`);
    
    if (status.length === 0) {
      console.log('   ✅ No hay cambios sin commitear\n');
    } else {
      console.log('   ⚠️  Hay cambios sin commitear:');
      console.log(status.split('\n').map(line => `      ${line}`).join('\n'));
      console.log('');
    }

    // Verificar branch
    const branch = this.getCurrentBranch();
    console.log(`📍 Branch actual: ${branch}`);

    // Verificar commit
    const commit = this.getCurrentCommit();
    console.log(`📍 Commit actual: ${commit}\n`);

    // Verificar tags de migración
    const tagsResult = this.execGit('git tag -l "*migration*" "*phase*"');
    const tags = tagsResult.success ? tagsResult.output.split('\n').filter(t => t.trim()) : [];
    console.log(`🔖 Checkpoints de migración: ${tags.length}\n`);

    return true;
  }
}

// CLI
if (require.main === module) {
  const utility = new GitBackupUtility();
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'create-backup':
      utility.createBackup();
      break;

    case 'create-checkpoint':
      if (!arg) {
        console.error('❌ Error: Debes proporcionar un mensaje para el checkpoint');
        console.log('Uso: node git-backup-utility.js create-checkpoint "mensaje"');
        process.exit(1);
      }
      utility.createCheckpoint(arg);
      break;

    case 'list-checkpoints':
    case 'list':
      utility.listCheckpoints();
      break;

    case 'verify':
      utility.verifyIntegrity();
      break;

    default:
      console.log('Utilidad de Backup de Git para Migración\n');
      console.log('Uso:');
      console.log('  node git-backup-utility.js create-backup');
      console.log('  node git-backup-utility.js create-checkpoint "mensaje"');
      console.log('  node git-backup-utility.js list-checkpoints');
      console.log('  node git-backup-utility.js verify\n');
      break;
  }
}

module.exports = GitBackupUtility;
