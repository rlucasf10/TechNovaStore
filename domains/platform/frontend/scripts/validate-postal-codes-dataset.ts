/**
 * Script para validar el dataset de códigos postales de España
 * 
 * Verifica que el dataset cumple con los requisitos:
 * - Al menos 8,000 municipios
 * - Exactamente 50 provincias
 * - Formato correcto del CSV
 * - Códigos postales válidos (5 dígitos)
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalRecords: number;
    uniqueMunicipalities: number;
    uniqueProvinces: number;
    uniquePostalCodes: number;
  };
}

function validateDataset(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      totalRecords: 0,
      uniqueMunicipalities: 0,
      uniqueProvinces: 0,
      uniquePostalCodes: 0,
    },
  };

  console.log('🔍 Validando dataset de códigos postales...\n');

  // Leer el archivo
  const filePath = path.join(__dirname, '..', 'data', 'spain-postal-codes.csv');
  
  if (!fs.existsSync(filePath)) {
    result.isValid = false;
    result.errors.push('El archivo spain-postal-codes.csv no existe');
    return result;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // Verificar header
  const header = lines[0];
  const expectedHeader = 'postal_code,province_code,municipality_code,municipality_name';
  
  if (header !== expectedHeader) {
    result.isValid = false;
    result.errors.push(`Header incorrecto. Esperado: "${expectedHeader}", Encontrado: "${header}"`);
  }

  // Procesar registros
  const municipalities = new Set<string>();
  const provinces = new Set<string>();
  const postalCodes = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');

    if (parts.length !== 4) {
      result.warnings.push(`Línea ${i + 1}: Formato incorrecto (${parts.length} columnas en lugar de 4)`);
      continue;
    }

    const [postalCode, provinceCode, municipalityCode, municipalityName] = parts;

    // Validar código postal (5 dígitos)
    if (!/^\d{5}$/.test(postalCode)) {
      result.warnings.push(`Línea ${i + 1}: Código postal inválido "${postalCode}"`);
    }

    // Validar código de provincia (2 dígitos)
    if (!/^\d{2}$/.test(provinceCode)) {
      result.warnings.push(`Línea ${i + 1}: Código de provincia inválido "${provinceCode}"`);
    }

    // Validar código de municipio (5 dígitos)
    if (!/^\d{5}$/.test(municipalityCode)) {
      result.warnings.push(`Línea ${i + 1}: Código de municipio inválido "${municipalityCode}"`);
    }

    // Validar nombre de municipio (no vacío)
    if (!municipalityName || municipalityName.trim() === '') {
      result.warnings.push(`Línea ${i + 1}: Nombre de municipio vacío`);
    }

    // Agregar a sets
    municipalities.add(municipalityCode);
    provinces.add(provinceCode);
    postalCodes.add(postalCode);
  }

  // Actualizar estadísticas
  result.stats.totalRecords = lines.length - 1; // Excluir header
  result.stats.uniqueMunicipalities = municipalities.size;
  result.stats.uniqueProvinces = provinces.size;
  result.stats.uniquePostalCodes = postalCodes.size;

  // Validaciones de requisitos
  if (result.stats.uniqueMunicipalities < 8000) {
    result.errors.push(
      `El dataset debe contener al menos 8,000 municipios únicos. ` +
      `Encontrados: ${result.stats.uniqueMunicipalities}`
    );
    result.isValid = false;
  }

  if (result.stats.uniqueProvinces !== 50) {
    result.errors.push(
      `El dataset debe contener exactamente 50 provincias. ` +
      `Encontradas: ${result.stats.uniqueProvinces}`
    );
    result.isValid = false;
  }

  return result;
}

// Ejecutar validación
try {
  const result = validateDataset();

  // Mostrar estadísticas
  console.log('📊 Estadísticas del dataset:');
  console.log(`   - Total de registros: ${result.stats.totalRecords}`);
  console.log(`   - Municipios únicos: ${result.stats.uniqueMunicipalities}`);
  console.log(`   - Provincias únicas: ${result.stats.uniqueProvinces}`);
  console.log(`   - Códigos postales únicos: ${result.stats.uniquePostalCodes}\n`);

  // Mostrar errores
  if (result.errors.length > 0) {
    console.log('❌ Errores encontrados:');
    result.errors.forEach(error => console.log(`   - ${error}`));
    console.log('');
  }

  // Mostrar advertencias
  if (result.warnings.length > 0) {
    console.log(`⚠️  Advertencias (${result.warnings.length}):`);
    result.warnings.slice(0, 10).forEach(warning => console.log(`   - ${warning}`));
    if (result.warnings.length > 10) {
      console.log(`   ... y ${result.warnings.length - 10} advertencias más`);
    }
    console.log('');
  }

  // Resultado final
  if (result.isValid) {
    console.log('✅ El dataset es válido y cumple con todos los requisitos!\n');
    process.exit(0);
  } else {
    console.log('❌ El dataset NO es válido. Por favor, corrija los errores.\n');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error al validar el dataset:', error);
  process.exit(1);
}
