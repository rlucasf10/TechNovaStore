#!/usr/bin/env node

/**
 * Script para actualizar logs de auditoría
 * Uso: node scripts/update-audit-logs.js [acción] [descripción]
 * 
 * Ejemplos:
 * node scripts/update-audit-logs.js "dependency" "Actualización de Express a v4.19.0"
 * node scripts/update-audit-logs.js "docker" "Optimización de Dockerfile para user-service"
 * node scripts/update-audit-logs.js "cleanup" "Eliminación de archivos temporales"
 */

const fs = require('fs');
const path = require('path');

// Configuración de rutas
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const AUDIT_LOG_PATH = path.join(LOGS_DIR, 'cleanup-audit-log.json');
const DETAILED_LOG_PATH = path.join(LOGS_DIR, 'detailed-changes-log.md');

// Categorías válidas
const VALID_CATEGORIES = [
  'duplication',
  'dependency', 
  'environment',
  'docker',
  'configuration',
  'cleanup',
  'security',
  'optimization'
];

/**
 * Función principal
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Uso: node scripts/update-audit-logs.js [categoría] [descripción]');
    console.log('Categorías válidas:', VALID_CATEGORIES.join(', '));
    process.exit(1);
  }

  const category = args[0].toLowerCase();
  const description = args.slice(1).join(' ');

  if (!VALID_CATEGORIES.includes(category)) {
    console.error(`Categoría inválida: ${category}`);
    console.log('Categorías válidas:', VALID_CATEGORIES.join(', '));
    process.exit(1);
  }

  try {
    updateAuditLog(category, description);
    updateDetailedLog(category, description);
    console.log(`✅ Logs actualizados exitosamente`);
    console.log(`   Categoría: ${category}`);
    console.log(`   Descripción: ${description}`);
  } catch (error) {
    console.error('❌ Error actualizando logs:', error.message);
    process.exit(1);
  }
}

/**
 * Actualizar el log de auditoría JSON
 */
function updateAuditLog(category, description) {
  let auditData;
  
  try {
    const auditContent = fs.readFileSync(AUDIT_LOG_PATH, 'utf8');
    auditData = JSON.parse(auditContent);
  } catch (error) {
    console.error('Error leyendo audit log:', error.message);
    throw error;
  }

  // Actualizar timestamp
  auditData.auditLog.lastUpdated = new Date().toISOString();
  
  // Incrementar contador total
  auditData.auditLog.totalChanges += 1;
  
  // Actualizar categoría específica
  if (auditData.auditLog.changeCategories[category]) {
    auditData.auditLog.changeCategories[category].totalChanges += 1;
  } else {
    auditData.auditLog.changeCategories[category] = {
      description: description,
      totalChanges: 1,
      impact: "Pendiente de evaluación"
    };
  }

  // Guardar archivo actualizado
  fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(auditData, null, 2));
}

/**
 * Actualizar el log detallado en Markdown
 */
function updateDetailedLog(category, description) {
  const timestamp = new Date().toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const logEntry = `
## Cambio Registrado - ${timestamp}

**Categoría:** ${category}  
**Descripción:** ${description}  
**Timestamp:** ${new Date().toISOString()}  
**Registrado por:** Script de actualización automática

---
`;

  // Leer archivo existente
  let existingContent = '';
  try {
    existingContent = fs.readFileSync(DETAILED_LOG_PATH, 'utf8');
  } catch (error) {
    console.warn('Archivo de log detallado no encontrado, creando nuevo...');
  }

  // Encontrar posición para insertar (después del resumen ejecutivo)
  const insertPosition = existingContent.indexOf('## Categoría 1:');
  
  if (insertPosition !== -1) {
    // Insertar antes de las categorías existentes
    const beforeCategories = existingContent.substring(0, insertPosition);
    const afterCategories = existingContent.substring(insertPosition);
    const updatedContent = beforeCategories + logEntry + afterCategories;
    
    fs.writeFileSync(DETAILED_LOG_PATH, updatedContent);
  } else {
    // Si no se encuentra la estructura, agregar al final
    const updatedContent = existingContent + logEntry;
    fs.writeFileSync(DETAILED_LOG_PATH, updatedContent);
  }
}

/**
 * Función para mostrar estadísticas actuales
 */
function showStats() {
  try {
    const auditContent = fs.readFileSync(AUDIT_LOG_PATH, 'utf8');
    const auditData = JSON.parse(auditContent);
    
    console.log('\n📊 Estadísticas Actuales de Auditoría:');
    console.log(`   Total de cambios: ${auditData.auditLog.totalChanges}`);
    console.log(`   Última actualización: ${auditData.auditLog.lastUpdated}`);
    console.log('\n   Cambios por categoría:');
    
    Object.entries(auditData.auditLog.changeCategories).forEach(([category, data]) => {
      console.log(`   - ${category}: ${data.totalChanges} cambios`);
    });
    
  } catch (error) {
    console.error('Error mostrando estadísticas:', error.message);
  }
}

// Verificar si se solicitan estadísticas
if (process.argv.includes('--stats') || process.argv.includes('-s')) {
  showStats();
  process.exit(0);
}

// Ejecutar función principal
main();