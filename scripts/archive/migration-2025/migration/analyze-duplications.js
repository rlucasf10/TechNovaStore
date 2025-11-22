#!/usr/bin/env node

/**
 * Script para analizar duplicaciones en el proyecto TechNovaStore
 * Identifica archivos .env, configuraciones, documentación y archivos temporales duplicados
 * 
 * Uso: node scripts/migration/analyze-duplications.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuración
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'DUPLICATION_REPORT.md');

// Patrones a buscar
const PATTERNS = {
  envFiles: /\.env(\.[a-z]+)?(\.example)?$/i,
  configs: /(tsconfig|jest\.config|\.eslintrc|\.prettierrc|package)\.json$/i,
  docs: /README\.md$/i,
  temporary: /\.(backup|old|copy|tmp|bak)$|^test-|^verify-/i
};

// Directorios a ignorar
const IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  'out',
  'logs',
  'playwright-report',
  'test-results'
];

class DuplicationAnalyzer {
  constructor() {
    this.files = {
      envFiles: [],
      configs: [],
      docs: [],
      temporary: []
    };
    this.duplicateGroups = [];
    this.stats = {
      totalFiles: 0,
      duplicateFiles: 0,
      temporaryFiles: 0
    };
  }

  /**
   * Escanea recursivamente el directorio del proyecto
   */
  scanDirectory(dir, relativePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);

      // Ignorar directorios específicos
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.includes(entry.name)) {
          this.scanDirectory(fullPath, relPath);
        }
        continue;
      }

      // Clasificar archivos
      this.stats.totalFiles++;

      if (PATTERNS.envFiles.test(entry.name)) {
        this.files.envFiles.push(relPath);
      }
      if (PATTERNS.configs.test(entry.name)) {
        this.files.configs.push(relPath);
      }
      if (PATTERNS.docs.test(entry.name)) {
        this.files.docs.push(relPath);
      }
      if (PATTERNS.temporary.test(entry.name)) {
        this.files.temporary.push(relPath);
        this.stats.temporaryFiles++;
      }
    }
  }

  /**
   * Calcula el hash MD5 de un archivo
   */
  getFileHash(filePath) {
    try {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, filePath), 'utf8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * Encuentra grupos de archivos duplicados por contenido
   */
  findDuplicatesByContent(files) {
    const hashMap = new Map();

    for (const file of files) {
      const hash = this.getFileHash(file);
      if (!hash) continue;

      if (!hashMap.has(hash)) {
        hashMap.set(hash, []);
      }
      hashMap.get(hash).push(file);
    }

    // Filtrar solo grupos con más de un archivo
    const duplicates = [];
    for (const [hash, fileList] of hashMap.entries()) {
      if (fileList.length > 1) {
        duplicates.push({
          hash,
          files: fileList,
          count: fileList.length
        });
        this.stats.duplicateFiles += fileList.length;
      }
    }

    return duplicates;
  }

  /**
   * Encuentra archivos similares por nombre
   */
  findSimilarByName(files) {
    const groups = new Map();

    for (const file of files) {
      const basename = path.basename(file).toLowerCase();
      const key = basename.replace(/\.(example|local|prod|dev|staging|test)/, '');

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(file);
    }

    const similar = [];
    for (const [key, fileList] of groups.entries()) {
      if (fileList.length > 1) {
        similar.push({
          baseName: key,
          files: fileList,
          count: fileList.length
        });
      }
    }

    return similar;
  }

  /**
   * Analiza todas las duplicaciones
   */
  analyze() {
    console.log('🔍 Analizando duplicaciones en el proyecto...\n');

    // Escanear proyecto
    this.scanDirectory(PROJECT_ROOT);

    console.log(`📊 Archivos escaneados: ${this.stats.totalFiles}`);
    console.log(`📄 Archivos .env encontrados: ${this.files.envFiles.length}`);
    console.log(`⚙️  Archivos de configuración: ${this.files.configs.length}`);
    console.log(`📖 Archivos README: ${this.files.docs.length}`);
    console.log(`🗑️  Archivos temporales: ${this.files.temporary.length}\n`);

    // Analizar duplicaciones
    const results = {
      envDuplicates: this.findDuplicatesByContent(this.files.envFiles),
      envSimilar: this.findSimilarByName(this.files.envFiles),
      configDuplicates: this.findDuplicatesByContent(this.files.configs),
      configSimilar: this.findSimilarByName(this.files.configs),
      docDuplicates: this.findDuplicatesByContent(this.files.docs),
      temporaryFiles: this.files.temporary
    };

    return results;
  }

  /**
   * Genera reporte en formato Markdown
   */
  generateReport(results) {
    let report = `# Reporte de Duplicaciones - TechNovaStore\n\n`;
    report += `**Fecha**: ${new Date().toLocaleString('es-ES')}\n\n`;
    report += `## Resumen Ejecutivo\n\n`;
    report += `- **Total de archivos escaneados**: ${this.stats.totalFiles}\n`;
    report += `- **Archivos duplicados**: ${this.stats.duplicateFiles}\n`;
    report += `- **Archivos temporales**: ${this.stats.temporaryFiles}\n\n`;

    // Archivos .env duplicados
    report += `## 1. Archivos .env Duplicados\n\n`;
    if (results.envDuplicates.length > 0) {
      report += `Se encontraron **${results.envDuplicates.length} grupos** de archivos .env con contenido idéntico:\n\n`;
      results.envDuplicates.forEach((group, idx) => {
        report += `### Grupo ${idx + 1} (${group.count} archivos)\n\n`;
        group.files.forEach(file => {
          report += `- \`${file}\`\n`;
        });
        report += `\n**Recomendación**: Consolidar en un solo archivo y eliminar duplicados.\n\n`;
      });
    } else {
      report += `✅ No se encontraron archivos .env con contenido idéntico.\n\n`;
    }

    // Archivos .env similares
    if (results.envSimilar.length > 0) {
      report += `### Archivos .env Similares por Nombre\n\n`;
      results.envSimilar.forEach(group => {
        report += `**${group.baseName}** (${group.count} variantes):\n`;
        group.files.forEach(file => {
          report += `- \`${file}\`\n`;
        });
        report += `\n`;
      });
    }

    // Configuraciones duplicadas
    report += `## 2. Archivos de Configuración Duplicados\n\n`;
    if (results.configDuplicates.length > 0) {
      report += `Se encontraron **${results.configDuplicates.length} grupos** de configuraciones con contenido idéntico:\n\n`;
      results.configDuplicates.forEach((group, idx) => {
        report += `### Grupo ${idx + 1} (${group.count} archivos)\n\n`;
        group.files.forEach(file => {
          report += `- \`${file}\`\n`;
        });
        report += `\n**Recomendación**: Crear configuración base y extenderla en servicios.\n\n`;
      });
    } else {
      report += `✅ No se encontraron configuraciones con contenido idéntico.\n\n`;
    }

    // Configuraciones similares
    if (results.configSimilar.length > 0) {
      report += `### Configuraciones Similares por Nombre\n\n`;
      results.configSimilar.forEach(group => {
        report += `**${group.baseName}** (${group.count} variantes):\n`;
        group.files.forEach(file => {
          report += `- \`${file}\`\n`;
        });
        report += `\n`;
      });
    }

    // Documentación duplicada
    report += `## 3. Documentación Duplicada\n\n`;
    if (results.docDuplicates.length > 0) {
      report += `Se encontraron **${results.docDuplicates.length} grupos** de documentos con contenido idéntico:\n\n`;
      results.docDuplicates.forEach((group, idx) => {
        report += `### Grupo ${idx + 1} (${group.count} archivos)\n\n`;
        group.files.forEach(file => {
          report += `- \`${file}\`\n`;
        });
        report += `\n**Recomendación**: Consolidar en ubicación centralizada.\n\n`;
      });
    } else {
      report += `✅ No se encontraron documentos con contenido idéntico.\n\n`;
    }

    // Archivos temporales
    report += `## 4. Archivos Temporales y Obsoletos\n\n`;
    if (results.temporaryFiles.length > 0) {
      report += `Se encontraron **${results.temporaryFiles.length} archivos** temporales u obsoletos:\n\n`;
      results.temporaryFiles.forEach(file => {
        report += `- \`${file}\`\n`;
      });
      report += `\n**Recomendación**: Revisar y eliminar archivos innecesarios.\n\n`;
    } else {
      report += `✅ No se encontraron archivos temporales.\n\n`;
    }

    // Plan de acción
    report += `## Plan de Acción\n\n`;
    report += `### Prioridad Alta\n\n`;
    if (results.envDuplicates.length > 0) {
      report += `1. ⚠️ Consolidar archivos .env duplicados (${results.envDuplicates.length} grupos)\n`;
    }
    if (results.configDuplicates.length > 0) {
      report += `2. ⚠️ Consolidar configuraciones duplicadas (${results.configDuplicates.length} grupos)\n`;
    }
    if (results.temporaryFiles.length > 0) {
      report += `3. 🗑️ Eliminar archivos temporales (${results.temporaryFiles.length} archivos)\n`;
    }
    report += `\n### Prioridad Media\n\n`;
    if (results.docDuplicates.length > 0) {
      report += `1. 📖 Consolidar documentación duplicada (${results.docDuplicates.length} grupos)\n`;
    }
    report += `2. 📝 Revisar archivos similares por nombre y consolidar si es necesario\n`;
    report += `\n`;

    return report;
  }

  /**
   * Ejecuta el análisis completo y guarda el reporte
   */
  run() {
    const results = this.analyze();
    const report = this.generateReport(results);

    // Guardar reporte
    fs.writeFileSync(OUTPUT_FILE, report, 'utf8');

    console.log(`✅ Reporte generado: ${OUTPUT_FILE}\n`);
    console.log('📊 Resumen:');
    console.log(`   - Archivos duplicados: ${this.stats.duplicateFiles}`);
    console.log(`   - Archivos temporales: ${this.stats.temporaryFiles}`);

    return results;
  }
}

// Ejecutar análisis
if (require.main === module) {
  const analyzer = new DuplicationAnalyzer();
  analyzer.run();
}

module.exports = DuplicationAnalyzer;
