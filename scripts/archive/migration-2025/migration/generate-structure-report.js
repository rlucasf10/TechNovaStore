#!/usr/bin/env node

/**
 * Script para generar reporte de la estructura actual del proyecto
 * Documenta la organización de carpetas, servicios y archivos principales
 * 
 * Uso: node scripts/migration/generate-structure-report.js
 */

const fs = require('fs');
const path = require('path');

// Configuración
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'CURRENT_STRUCTURE.md');

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
  'test-results',
  '.swc'
];

// Extensiones de archivos importantes
const IMPORTANT_FILES = [
  'package.json',
  'tsconfig.json',
  'Dockerfile',
  'docker-compose.yml',
  '.env',
  'README.md'
];

class StructureAnalyzer {
  constructor() {
    this.structure = {
      services: [],
      infrastructure: [],
      shared: [],
      docs: [],
      scripts: [],
      rootFiles: []
    };
    this.stats = {
      totalDirs: 0,
      totalFiles: 0,
      services: 0,
      dockerfiles: 0,
      packageJsons: 0
    };
  }

  /**
   * Verifica si un directorio es un microservicio
   */
  isService(dirPath) {
    const packageJsonPath = path.join(dirPath, 'package.json');
    const dockerfilePath = path.join(dirPath, 'Dockerfile');
    
    return fs.existsSync(packageJsonPath) || fs.existsSync(dockerfilePath);
  }

  /**
   * Obtiene información de un servicio
   */
  getServiceInfo(dirPath, relativePath) {
    const info = {
      name: path.basename(dirPath),
      path: relativePath,
      hasPackageJson: false,
      hasDockerfile: false,
      hasSrc: false,
      hasTests: false,
      hasReadme: false,
      type: 'unknown'
    };

    // Verificar archivos importantes
    if (fs.existsSync(path.join(dirPath, 'package.json'))) {
      info.hasPackageJson = true;
      this.stats.packageJsons++;
      
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(dirPath, 'package.json'), 'utf8'));
        info.packageName = pkg.name;
        info.version = pkg.version;
      } catch (error) {
        // Ignorar errores de parsing
      }
    }

    if (fs.existsSync(path.join(dirPath, 'Dockerfile'))) {
      info.hasDockerfile = true;
      this.stats.dockerfiles++;
    }

    if (fs.existsSync(path.join(dirPath, 'src'))) {
      info.hasSrc = true;
    }

    if (fs.existsSync(path.join(dirPath, 'tests')) || fs.existsSync(path.join(dirPath, 'test'))) {
      info.hasTests = true;
    }

    if (fs.existsSync(path.join(dirPath, 'README.md'))) {
      info.hasReadme = true;
    }

    // Determinar tipo de servicio
    if (relativePath.includes('ai-services')) {
      info.type = 'ai-service';
    } else if (relativePath.includes('automation')) {
      info.type = 'automation';
    } else if (relativePath.includes('services')) {
      info.type = 'backend-service';
    } else if (relativePath.includes('frontend')) {
      info.type = 'frontend';
    } else if (relativePath.includes('api-gateway')) {
      info.type = 'gateway';
    }

    return info;
  }

  /**
   * Escanea un directorio y clasifica su contenido
   */
  scanDirectory(dir, relativePath = '', depth = 0) {
    if (depth > 4) return; // Limitar profundidad

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          // Ignorar directorios específicos
          if (IGNORE_DIRS.includes(entry.name)) {
            continue;
          }

          this.stats.totalDirs++;

          // Verificar si es un servicio
          if (this.isService(fullPath)) {
            const serviceInfo = this.getServiceInfo(fullPath, relPath);
            this.structure.services.push(serviceInfo);
            this.stats.services++;
            continue; // No escanear dentro de servicios
          }

          // Clasificar directorios especiales
          if (depth === 0) {
            if (entry.name === 'infrastructure') {
              this.structure.infrastructure.push(relPath);
            } else if (entry.name === 'shared') {
              this.structure.shared.push(relPath);
            } else if (entry.name === 'docs') {
              this.structure.docs.push(relPath);
            } else if (entry.name === 'scripts') {
              this.structure.scripts.push(relPath);
            }
          }

          // Continuar escaneando
          this.scanDirectory(fullPath, relPath, depth + 1);
        } else {
          this.stats.totalFiles++;

          // Archivos en la raíz
          if (depth === 0) {
            this.structure.rootFiles.push(entry.name);
          }
        }
      }
    } catch (error) {
      console.error(`Error escaneando ${dir}:`, error.message);
    }
  }

  /**
   * Genera el árbol de estructura
   */
  generateTree(dir, prefix = '', depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return '';

    let tree = '';
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
        .filter(entry => !IGNORE_DIRS.includes(entry.name))
        .sort((a, b) => {
          // Directorios primero
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });

      entries.forEach((entry, index) => {
        const isLast = index === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const extension = isLast ? '    ' : '│   ';

        tree += `${prefix}${connector}${entry.name}`;

        if (entry.isDirectory()) {
          tree += '/\n';
          
          // No expandir servicios completos
          const fullPath = path.join(dir, entry.name);
          if (!this.isService(fullPath)) {
            tree += this.generateTree(
              fullPath,
              prefix + extension,
              depth + 1,
              maxDepth
            );
          }
        } else {
          tree += '\n';
        }
      });
    } catch (error) {
      // Ignorar errores
    }

    return tree;
  }

  /**
   * Genera el reporte en formato Markdown
   */
  generateReport() {
    let report = `# Estructura Actual del Proyecto - TechNovaStore\n\n`;
    report += `**Fecha**: ${new Date().toLocaleString('es-ES')}\n\n`;
    report += `## Resumen Ejecutivo\n\n`;
    report += `- **Total de directorios**: ${this.stats.totalDirs}\n`;
    report += `- **Total de archivos**: ${this.stats.totalFiles}\n`;
    report += `- **Microservicios identificados**: ${this.stats.services}\n`;
    report += `- **Archivos Dockerfile**: ${this.stats.dockerfiles}\n`;
    report += `- **Archivos package.json**: ${this.stats.packageJsons}\n`;
    report += `- **Archivos en raíz**: ${this.structure.rootFiles.length}\n\n`;

    // Árbol de estructura
    report += `## Árbol de Estructura (Nivel Superior)\n\n`;
    report += `\`\`\`\n`;
    report += `TechNovaStore/\n`;
    report += this.generateTree(PROJECT_ROOT, '', 0, 2);
    report += `\`\`\`\n\n`;

    // Microservicios
    report += `## Microservicios Identificados (${this.stats.services})\n\n`;
    
    const servicesByType = {
      'backend-service': [],
      'ai-service': [],
      'automation': [],
      'gateway': [],
      'frontend': [],
      'unknown': []
    };

    this.structure.services.forEach(service => {
      servicesByType[service.type].push(service);
    });

    // Backend Services
    if (servicesByType['backend-service'].length > 0) {
      report += `### Backend Services (${servicesByType['backend-service'].length})\n\n`;
      report += `| Servicio | Ruta | Package.json | Dockerfile | Src | Tests |\n`;
      report += `|----------|------|--------------|------------|-----|-------|\n`;
      servicesByType['backend-service'].forEach(service => {
        report += `| ${service.name} | \`${service.path}\` | ${service.hasPackageJson ? '✅' : '❌'} | ${service.hasDockerfile ? '✅' : '❌'} | ${service.hasSrc ? '✅' : '❌'} | ${service.hasTests ? '✅' : '❌'} |\n`;
      });
      report += `\n`;
    }

    // AI Services
    if (servicesByType['ai-service'].length > 0) {
      report += `### AI Services (${servicesByType['ai-service'].length})\n\n`;
      report += `| Servicio | Ruta | Package.json | Dockerfile | Src | Tests |\n`;
      report += `|----------|------|--------------|------------|-----|-------|\n`;
      servicesByType['ai-service'].forEach(service => {
        report += `| ${service.name} | \`${service.path}\` | ${service.hasPackageJson ? '✅' : '❌'} | ${service.hasDockerfile ? '✅' : '❌'} | ${service.hasSrc ? '✅' : '❌'} | ${service.hasTests ? '✅' : '❌'} |\n`;
      });
      report += `\n`;
    }

    // Automation Services
    if (servicesByType['automation'].length > 0) {
      report += `### Automation Services (${servicesByType['automation'].length})\n\n`;
      report += `| Servicio | Ruta | Package.json | Dockerfile | Src | Tests |\n`;
      report += `|----------|------|--------------|------------|-----|-------|\n`;
      servicesByType['automation'].forEach(service => {
        report += `| ${service.name} | \`${service.path}\` | ${service.hasPackageJson ? '✅' : '❌'} | ${service.hasDockerfile ? '✅' : '❌'} | ${service.hasSrc ? '✅' : '❌'} | ${service.hasTests ? '✅' : '❌'} |\n`;
      });
      report += `\n`;
    }

    // Gateway & Frontend
    if (servicesByType['gateway'].length > 0 || servicesByType['frontend'].length > 0) {
      report += `### Platform Services\n\n`;
      report += `| Servicio | Ruta | Package.json | Dockerfile | Src | Tests |\n`;
      report += `|----------|------|--------------|------------|-----|-------|\n`;
      [...servicesByType['gateway'], ...servicesByType['frontend']].forEach(service => {
        report += `| ${service.name} | \`${service.path}\` | ${service.hasPackageJson ? '✅' : '❌'} | ${service.hasDockerfile ? '✅' : '❌'} | ${service.hasSrc ? '✅' : '❌'} | ${service.hasTests ? '✅' : '❌'} |\n`;
      });
      report += `\n`;
    }

    // Archivos en raíz
    report += `## Archivos en Raíz del Proyecto (${this.structure.rootFiles.length})\n\n`;
    
    const filesByType = {
      config: [],
      docs: [],
      scripts: [],
      other: []
    };

    this.structure.rootFiles.forEach(file => {
      if (file.endsWith('.json') || file.endsWith('.yml') || file.endsWith('.yaml') || file.startsWith('.')) {
        filesByType.config.push(file);
      } else if (file.endsWith('.md')) {
        filesByType.docs.push(file);
      } else if (file.endsWith('.sh') || file.endsWith('.ps1') || file.endsWith('.bat')) {
        filesByType.scripts.push(file);
      } else {
        filesByType.other.push(file);
      }
    });

    if (filesByType.config.length > 0) {
      report += `### Archivos de Configuración (${filesByType.config.length})\n\n`;
      filesByType.config.forEach(file => {
        report += `- \`${file}\`\n`;
      });
      report += `\n`;
    }

    if (filesByType.docs.length > 0) {
      report += `### Documentación (${filesByType.docs.length})\n\n`;
      filesByType.docs.forEach(file => {
        report += `- \`${file}\`\n`;
      });
      report += `\n`;
    }

    if (filesByType.scripts.length > 0) {
      report += `### Scripts (${filesByType.scripts.length})\n\n`;
      filesByType.scripts.forEach(file => {
        report += `- \`${file}\`\n`;
      });
      report += `\n`;
    }

    if (filesByType.other.length > 0) {
      report += `### Otros (${filesByType.other.length})\n\n`;
      filesByType.other.forEach(file => {
        report += `- \`${file}\`\n`;
      });
      report += `\n`;
    }

    // Análisis de organización
    report += `## Análisis de Organización Actual\n\n`;
    report += `### Estructura Tecnología-Céntrica\n\n`;
    report += `La estructura actual está organizada por **tecnología** en lugar de **dominio de negocio**:\n\n`;
    report += `- ❌ \`services/\` - Agrupa por tipo técnico (microservicio)\n`;
    report += `- ❌ \`ai-services/\` - Separación artificial por tecnología (IA)\n`;
    report += `- ❌ \`automation/\` - Separación artificial por tipo de proceso\n`;
    report += `- ❌ Archivos dispersos en raíz (${this.structure.rootFiles.length} archivos)\n\n`;

    report += `### Problemas Identificados\n\n`;
    report += `1. **No es Screaming Architecture**: La estructura no comunica el dominio del negocio\n`;
    report += `2. **Archivos en raíz**: ${this.structure.rootFiles.length} archivos (objetivo: ≤5)\n`;
    report += `3. **Organización técnica**: Servicios agrupados por tecnología, no por dominio\n`;
    report += `4. **Difícil navegación**: No es claro qué hace el sistema al ver la estructura\n\n`;

    report += `### Recomendaciones\n\n`;
    report += `1. Reorganizar a estructura basada en dominios de negocio\n`;
    report += `2. Reducir archivos en raíz a máximo 5 archivos esenciales\n`;
    report += `3. Consolidar servicios por dominio (catalog, commerce, customer, support, platform)\n`;
    report += `4. Estandarizar estructura interna de microservicios\n\n`;

    return report;
  }

  /**
   * Ejecuta el análisis completo
   */
  run() {
    console.log('🔍 Analizando estructura del proyecto...\n');

    this.scanDirectory(PROJECT_ROOT);

    console.log(`📊 Estadísticas:`);
    console.log(`   - Directorios: ${this.stats.totalDirs}`);
    console.log(`   - Archivos: ${this.stats.totalFiles}`);
    console.log(`   - Microservicios: ${this.stats.services}`);
    console.log(`   - Archivos en raíz: ${this.structure.rootFiles.length}\n`);

    const report = this.generateReport();
    fs.writeFileSync(OUTPUT_FILE, report, 'utf8');

    console.log(`✅ Reporte generado: ${OUTPUT_FILE}\n`);

    return this.structure;
  }
}

// Ejecutar análisis
if (require.main === module) {
  const analyzer = new StructureAnalyzer();
  analyzer.run();
}

module.exports = StructureAnalyzer;
