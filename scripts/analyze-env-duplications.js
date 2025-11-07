/**
 * Script de Análisis de Duplicaciones de Archivos .env
 * 
 * Este script identifica:
 * - Todos los archivos .env en el proyecto
 * - Variables duplicadas entre archivos
 * - Archivos con contenido similar
 * - Recomendaciones de consolidación
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Busca todos los archivos .env en el proyecto
 */
function findEnvFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Ignorar node_modules, .next, dist, etc.
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', 'dist', 'coverage', '.git'].includes(file)) {
        findEnvFiles(filePath, fileList);
      }
    } else if (file.startsWith('.env')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Parsea un archivo .env y extrae las variables
 */
function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const variables = {};
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Ignorar comentarios y líneas vacías
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    
    // Extraer variable=valor
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=/);
    if (match) {
      const varName = match[1];
      const value = trimmed.substring(varName.length + 1);
      variables[varName] = {
        value: value,
        line: index + 1
      };
    }
  });
  
  return variables;
}

/**
 * Agrupa archivos por tipo
 */
function categorizeEnvFiles(files) {
  const categories = {
    root: [],
    services: [],
    aiServices: [],
    automation: [],
    frontend: [],
    apiGateway: []
  };
  
  files.forEach(file => {
    const normalized = file.replace(/\\/g, '/');
    
    if (normalized.match(/^\.env/)) {
      categories.root.push(file);
    } else if (normalized.includes('services/')) {
      categories.services.push(file);
    } else if (normalized.includes('ai-services/')) {
      categories.aiServices.push(file);
    } else if (normalized.includes('automation/')) {
      categories.automation.push(file);
    } else if (normalized.includes('frontend/')) {
      categories.frontend.push(file);
    } else if (normalized.includes('api-gateway/')) {
      categories.apiGateway.push(file);
    }
  });
  
  return categories;
}

/**
 * Encuentra variables duplicadas entre archivos
 */
function findDuplicateVariables(envFiles) {
  const variableMap = {};
  
  envFiles.forEach(file => {
    const variables = parseEnvFile(file);
    
    Object.keys(variables).forEach(varName => {
      if (!variableMap[varName]) {
        variableMap[varName] = [];
      }
      
      variableMap[varName].push({
        file: file,
        value: variables[varName].value,
        line: variables[varName].line
      });
    });
  });
  
  // Filtrar solo las variables que aparecen en múltiples archivos
  const duplicates = {};
  Object.keys(variableMap).forEach(varName => {
    if (variableMap[varName].length > 1) {
      duplicates[varName] = variableMap[varName];
    }
  });
  
  return duplicates;
}

/**
 * Calcula similitud entre dos archivos basado en variables compartidas
 */
function calculateSimilarity(file1Vars, file2Vars) {
  const vars1 = Object.keys(file1Vars);
  const vars2 = Object.keys(file2Vars);
  
  const intersection = vars1.filter(v => vars2.includes(v));
  const union = [...new Set([...vars1, ...vars2])];
  
  return {
    similarity: (intersection.length / union.length) * 100,
    sharedVars: intersection.length,
    totalVars: union.length,
    sharedVarNames: intersection
  };
}

/**
 * Encuentra archivos similares
 */
function findSimilarFiles(envFiles) {
  const similarities = [];
  const parsedFiles = {};
  
  // Parsear todos los archivos
  envFiles.forEach(file => {
    parsedFiles[file] = parseEnvFile(file);
  });
  
  // Comparar cada par de archivos
  for (let i = 0; i < envFiles.length; i++) {
    for (let j = i + 1; j < envFiles.length; j++) {
      const file1 = envFiles[i];
      const file2 = envFiles[j];
      
      const similarity = calculateSimilarity(
        parsedFiles[file1],
        parsedFiles[file2]
      );
      
      if (similarity.similarity > 20) { // Solo mostrar si hay más de 20% de similitud
        similarities.push({
          file1,
          file2,
          ...similarity
        });
      }
    }
  }
  
  // Ordenar por similitud descendente
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  return similarities;
}

/**
 * Genera reporte de análisis
 */
function generateReport(envFiles, categories, duplicates, similarities) {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  ANÁLISIS DE DUPLICACIONES DE ARCHIVOS .env${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  // 1. Resumen de archivos encontrados
  console.log(`${colors.bright}${colors.blue}1. ARCHIVOS .env ENCONTRADOS (${envFiles.length} total)${colors.reset}\n`);
  
  Object.keys(categories).forEach(category => {
    if (categories[category].length > 0) {
      console.log(`${colors.yellow}${category.toUpperCase()}:${colors.reset}`);
      categories[category].forEach(file => {
        const relativePath = file.replace(/\\/g, '/');
        console.log(`  - ${relativePath}`);
      });
      console.log('');
    }
  });
  
  // 2. Variables duplicadas
  console.log(`${colors.bright}${colors.blue}2. VARIABLES DUPLICADAS (${Object.keys(duplicates).length} variables)${colors.reset}\n`);
  
  const sortedDuplicates = Object.keys(duplicates).sort((a, b) => 
    duplicates[b].length - duplicates[a].length
  );
  
  sortedDuplicates.slice(0, 20).forEach(varName => {
    const occurrences = duplicates[varName];
    console.log(`${colors.yellow}${varName}${colors.reset} (${occurrences.length} archivos):`);
    
    occurrences.forEach(occ => {
      const relativePath = occ.file.replace(/\\/g, '/');
      const valuePreview = occ.value.length > 50 
        ? occ.value.substring(0, 50) + '...' 
        : occ.value;
      console.log(`  - ${relativePath}:${occ.line}`);
      console.log(`    ${colors.cyan}${valuePreview}${colors.reset}`);
    });
    console.log('');
  });
  
  if (sortedDuplicates.length > 20) {
    console.log(`${colors.magenta}... y ${sortedDuplicates.length - 20} variables más${colors.reset}\n`);
  }
  
  // 3. Archivos similares
  console.log(`${colors.bright}${colors.blue}3. ARCHIVOS SIMILARES (Top 10)${colors.reset}\n`);
  
  similarities.slice(0, 10).forEach((sim, index) => {
    const file1 = sim.file1.replace(/\\/g, '/');
    const file2 = sim.file2.replace(/\\/g, '/');
    
    console.log(`${colors.yellow}${index + 1}. Similitud: ${sim.similarity.toFixed(1)}%${colors.reset}`);
    console.log(`   ${file1}`);
    console.log(`   ${file2}`);
    console.log(`   ${colors.cyan}Variables compartidas: ${sim.sharedVars}/${sim.totalVars}${colors.reset}`);
    console.log('');
  });
  
  // 4. Estadísticas generales
  console.log(`${colors.bright}${colors.blue}4. ESTADÍSTICAS GENERALES${colors.reset}\n`);
  
  const totalVars = Object.keys(duplicates).reduce((sum, varName) => 
    sum + duplicates[varName].length, 0
  );
  
  console.log(`  Total de archivos .env: ${colors.green}${envFiles.length}${colors.reset}`);
  console.log(`  Variables únicas duplicadas: ${colors.yellow}${Object.keys(duplicates).length}${colors.reset}`);
  console.log(`  Total de ocurrencias duplicadas: ${colors.red}${totalVars}${colors.reset}`);
  console.log(`  Pares de archivos similares (>20%): ${colors.yellow}${similarities.length}${colors.reset}`);
  
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
}

/**
 * Genera reporte en formato Markdown
 */
function generateMarkdownReport(envFiles, categories, duplicates, similarities) {
  let markdown = '# Reporte de Análisis de Duplicaciones de Archivos .env\n\n';
  markdown += `**Fecha de análisis:** ${new Date().toLocaleString('es-ES')}\n\n`;
  markdown += '---\n\n';
  
  // 1. Resumen ejecutivo
  markdown += '## 1. Resumen Ejecutivo\n\n';
  markdown += `- **Total de archivos .env encontrados:** ${envFiles.length}\n`;
  markdown += `- **Variables únicas duplicadas:** ${Object.keys(duplicates).length}\n`;
  markdown += `- **Pares de archivos similares (>20%):** ${similarities.length}\n\n`;
  
  // 2. Archivos encontrados por categoría
  markdown += '## 2. Archivos .env Encontrados\n\n';
  
  Object.keys(categories).forEach(category => {
    if (categories[category].length > 0) {
      markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      categories[category].forEach(file => {
        const relativePath = file.replace(/\\/g, '/');
        markdown += `- \`${relativePath}\`\n`;
      });
      markdown += '\n';
    }
  });
  
  // 3. Variables más duplicadas
  markdown += '## 3. Variables Más Duplicadas (Top 30)\n\n';
  markdown += '| Variable | Archivos | Ubicaciones |\n';
  markdown += '|----------|----------|-------------|\n';
  
  const sortedDuplicates = Object.keys(duplicates).sort((a, b) => 
    duplicates[b].length - duplicates[a].length
  );
  
  sortedDuplicates.slice(0, 30).forEach(varName => {
    const occurrences = duplicates[varName];
    const locations = occurrences.map(occ => {
      const relativePath = occ.file.replace(/\\/g, '/');
      return `\`${relativePath}\``;
    }).join('<br>');
    
    markdown += `| \`${varName}\` | ${occurrences.length} | ${locations} |\n`;
  });
  
  markdown += '\n';
  
  // 4. Archivos similares
  markdown += '## 4. Archivos Similares (Top 15)\n\n';
  markdown += '| # | Archivo 1 | Archivo 2 | Similitud | Variables Compartidas |\n';
  markdown += '|---|-----------|-----------|-----------|----------------------|\n';
  
  similarities.slice(0, 15).forEach((sim, index) => {
    const file1 = sim.file1.replace(/\\/g, '/');
    const file2 = sim.file2.replace(/\\/g, '/');
    
    markdown += `| ${index + 1} | \`${file1}\` | \`${file2}\` | ${sim.similarity.toFixed(1)}% | ${sim.sharedVars}/${sim.totalVars} |\n`;
  });
  
  markdown += '\n';
  
  // 5. Variables por categoría
  markdown += '## 5. Análisis de Variables por Categoría\n\n';
  
  const varCategories = {
    database: ['MONGO', 'POSTGRES', 'REDIS', 'DATABASE', 'DB_'],
    security: ['JWT', 'SECRET', 'PASSWORD', 'CSRF', 'SSL', 'HTTPS'],
    api: ['API_', '_URL', '_ENDPOINT'],
    email: ['SMTP', 'EMAIL', 'MAIL'],
    oauth: ['GOOGLE', 'GITHUB', 'OAUTH'],
    logging: ['LOG_', 'ELASTICSEARCH', 'KIBANA'],
    monitoring: ['GRAFANA', 'PROMETHEUS', 'ALERT'],
    external: ['AMAZON', 'ALIEXPRESS', 'EBAY', 'BANGGOOD', 'NEWEGG']
  };
  
  Object.keys(varCategories).forEach(category => {
    const patterns = varCategories[category];
    const matchingVars = Object.keys(duplicates).filter(varName =>
      patterns.some(pattern => varName.includes(pattern))
    );
    
    if (matchingVars.length > 0) {
      markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      markdown += `Variables duplicadas: ${matchingVars.length}\n\n`;
      
      matchingVars.forEach(varName => {
        markdown += `- \`${varName}\` (${duplicates[varName].length} archivos)\n`;
      });
      
      markdown += '\n';
    }
  });
  
  // 6. Recomendaciones
  markdown += '## 6. Recomendaciones de Consolidación\n\n';
  
  markdown += '### Archivos de la Raíz\n\n';
  markdown += 'Los archivos en la raíz del proyecto tienen mucha duplicación:\n\n';
  markdown += '- **`.env.docker`**: Usado activamente en desarrollo con Docker\n';
  markdown += '- **`.env.docker.example`**: Template para Docker (mantener)\n';
  markdown += '- **`.env.example`**: Template general (consolidar con .env.docker.example)\n';
  markdown += '- **`.env.logging.example`**: Configuración específica de logging (mantener separado)\n';
  markdown += '- **`.env.prod.example`**: Template para producción (mantener)\n';
  markdown += '- **`.env.staging.example`**: Template para staging (mantener)\n\n';
  
  markdown += '**Acción recomendada:**\n';
  markdown += '1. Consolidar `.env.example` y `.env.docker.example` en un solo archivo\n';
  markdown += '2. Mantener archivos específicos por entorno (prod, staging, logging)\n\n';
  
  markdown += '### Archivos de Servicios\n\n';
  markdown += 'Cada microservicio tiene su propio `.env.example` con configuraciones específicas.\n\n';
  markdown += '**Variables comunes que se repiten:**\n';
  markdown += '- `NODE_ENV`, `PORT`, `LOG_LEVEL`\n';
  markdown += '- Configuración de bases de datos (MONGODB_URI, POSTGRES_*, REDIS_*)\n';
  markdown += '- URLs de otros servicios\n\n';
  
  markdown += '**Acción recomendada:**\n';
  markdown += '1. Crear archivo `.env.shared.example` con variables comunes\n';
  markdown += '2. Mantener solo variables específicas en cada servicio\n';
  markdown += '3. Documentar en README cómo combinar archivos\n\n';
  
  markdown += '### Frontend\n\n';
  markdown += '- **`frontend/.env.local`**: Usado en desarrollo (contiene valores reales)\n';
  markdown += '- **`frontend/.env.local.example`**: Template con documentación extensa\n\n';
  
  markdown += '**Acción recomendada:**\n';
  markdown += '1. Mantener `.env.local.example` como template documentado\n';
  markdown += '2. Asegurar que `.env.local` esté en `.gitignore`\n';
  markdown += '3. Eliminar valores reales de `.env.local` si está en el repositorio\n\n';
  
  markdown += '---\n\n';
  markdown += '*Reporte generado automáticamente por `scripts/analyze-env-duplications.js`*\n';
  
  return markdown;
}

// Ejecutar análisis
try {
  console.log(`${colors.cyan}Buscando archivos .env...${colors.reset}`);
  const envFiles = findEnvFiles('.');
  
  console.log(`${colors.green}✓ Encontrados ${envFiles.length} archivos${colors.reset}`);
  
  console.log(`${colors.cyan}Categorizando archivos...${colors.reset}`);
  const categories = categorizeEnvFiles(envFiles);
  
  console.log(`${colors.cyan}Analizando variables duplicadas...${colors.reset}`);
  const duplicates = findDuplicateVariables(envFiles);
  
  console.log(`${colors.cyan}Calculando similitudes entre archivos...${colors.reset}`);
  const similarities = findSimilarFiles(envFiles);
  
  // Generar reporte en consola
  generateReport(envFiles, categories, duplicates, similarities);
  
  // Generar reporte en Markdown
  console.log(`${colors.cyan}Generando reporte en Markdown...${colors.reset}`);
  const markdownReport = generateMarkdownReport(envFiles, categories, duplicates, similarities);
  
  const reportPath = 'ENV_DUPLICATION_REPORT.md';
  fs.writeFileSync(reportPath, markdownReport);
  
  console.log(`${colors.green}✓ Reporte guardado en: ${reportPath}${colors.reset}\n`);
  
} catch (error) {
  console.error(`${colors.red}Error durante el análisis:${colors.reset}`, error);
  process.exit(1);
}
