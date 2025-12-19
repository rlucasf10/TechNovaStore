/**
 * Script para convertir datos de Geonames a formato CSV para códigos postales de España
 * 
 * Formato de entrada (Geonames ES.txt - separado por tabs):
 * country_code, postal_code, place_name, admin_name1, admin_code1, admin_name2, admin_code2, admin_name3, admin_code3, latitude, longitude, accuracy
 * 
 * Formato de salida (spain-postal-codes.csv):
 * postal_code, province_code, municipality_code, municipality_name
 */

const fs = require('fs');
const path = require('path');

// Rutas de archivos
const INPUT_FILE = path.join(__dirname, '../data/geonames/ES.txt');
const OUTPUT_FILE = path.join(__dirname, '../data/spain-postal-codes.csv');

// Mapa de códigos de provincia (admin_code2) a códigos INE de 2 dígitos
// Basado en los códigos oficiales del INE
const PROVINCE_CODE_MAP = {
  'AL': '04', // Almería
  'CA': '11', // Cádiz
  'CO': '14', // Córdoba
  'GR': '18', // Granada
  'H': '21',  // Huelva
  'J': '23',  // Jaén
  'MA': '29', // Málaga
  'SE': '41', // Sevilla
  'HU': '22', // Huesca
  'TE': '44', // Teruel
  'Z': '50',  // Zaragoza
  'O': '33',  // Asturias
  'PM': '07', // Baleares
  'GC': '35', // Las Palmas
  'TF': '38', // Santa Cruz de Tenerife
  'S': '39',  // Cantabria
  'AV': '05', // Ávila
  'BU': '09', // Burgos
  'LE': '24', // León
  'P': '34',  // Palencia
  'SA': '37', // Salamanca
  'SG': '40', // Segovia
  'SO': '42', // Soria
  'VA': '47', // Valladolid
  'ZA': '49', // Zamora
  'AB': '02', // Albacete
  'CR': '13', // Ciudad Real
  'CU': '16', // Cuenca
  'GU': '19', // Guadalajara
  'TO': '45', // Toledo
  'BA': '06', // Badajoz
  'CC': '10', // Cáceres
  'C': '15',  // A Coruña
  'LU': '27', // Lugo
  'OR': '32', // Ourense
  'PO': '36', // Pontevedra
  'M': '28',  // Madrid
  'MU': '30', // Murcia
  'NA': '31', // Navarra
  'VI': '01', // Álava
  'SS': '20', // Gipuzkoa
  'BI': '48', // Bizkaia
  'LO': '26', // La Rioja
  'A': '03',  // Alicante
  'CS': '12', // Castellón
  'V': '46',  // Valencia
  'B': '08',  // Barcelona
  'GI': '17', // Girona
  'L': '25',  // Lleida
  'T': '43',  // Tarragona
  'CE': '51', // Ceuta
  'ML': '52'  // Melilla
};

console.log('🚀 Iniciando conversión de datos de Geonames...\n');

try {
  // Leer archivo de entrada
  console.log(`📖 Leyendo archivo: ${INPUT_FILE}`);
  const inputData = fs.readFileSync(INPUT_FILE, 'utf-8');
  const lines = inputData.trim().split('\n');
  
  console.log(`✅ Leídas ${lines.length} líneas\n`);
  
  // Procesar líneas
  const records = [];
  const seenCombinations = new Set(); // Para evitar duplicados
  let skippedLines = 0;
  
  console.log('🔄 Procesando registros...');
  
  for (const line of lines) {
    const fields = line.split('\t');
    
    if (fields.length < 9) {
      skippedLines++;
      continue;
    }
    
    const [
      countryCode,
      postalCode,
      placeName,
      adminName1,
      adminCode1,
      adminName2,
      adminCode2,
      adminName3,
      adminCode3
    ] = fields;
    
    // Obtener código de provincia
    const provinceCode = PROVINCE_CODE_MAP[adminCode2];
    
    if (!provinceCode) {
      skippedLines++;
      continue;
    }
    
    // Generar código de municipio (provincia + código de municipio)
    // Usamos adminCode3 si existe (código oficial del municipio), sino generamos uno basado en el código postal
    const municipalityCode = adminCode3 && adminCode3.trim() !== '' 
      ? adminCode3 
      : `${provinceCode}${postalCode.substring(2, 5)}`;
    
    // Función auxiliar para normalizar texto (quitar acentos y convertir a minúsculas)
    const normalize = (str) => {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };
    
    // Determinar el nombre del municipio
    let municipalityName;
    
    if (adminName3 && adminName3.trim() !== '') {
      // Si existe adminName3 (nombre del municipio), usarlo
      municipalityName = adminName3;
    } else if (normalize(placeName) !== normalize(adminName2)) {
      // Si no hay adminName3 pero placeName es diferente de la provincia (comparación sin acentos), usar placeName
      municipalityName = placeName;
    } else {
      // Si placeName es igual a la provincia (sin acentos), es un código postal especial
      // Usar el código postal como identificador con el nombre de la provincia (con acentos)
      municipalityName = `${adminName2} (CP ${postalCode})`;
    }
    
    // Limpiar espacios múltiples del nombre
    municipalityName = municipalityName.replace(/\s+/g, ' ').trim();
    
    // Crear combinación única para evitar duplicados
    const combination = `${postalCode}-${provinceCode}-${municipalityCode}`;
    
    if (!seenCombinations.has(combination)) {
      seenCombinations.add(combination);
      
      records.push({
        postal_code: postalCode,
        province_code: provinceCode,
        municipality_code: municipalityCode,
        municipality_name: municipalityName
      });
    }
  }
  
  console.log(`✅ Procesados ${records.length} registros únicos`);
  console.log(`⚠️  Omitidas ${skippedLines} líneas (sin código de provincia válido)\n`);
  
  // Ordenar por código postal
  records.sort((a, b) => a.postal_code.localeCompare(b.postal_code));
  
  // Generar CSV
  console.log('📝 Generando archivo CSV...');
  
  const csvLines = [
    'postal_code,province_code,municipality_code,municipality_name',
    ...records.map(r => {
      // Si el nombre contiene comas, envolverlo en comillas
      const name = r.municipality_name.replace(/"/g, '""');
      const needsQuotes = name.includes(',');
      const formattedName = needsQuotes ? `"${name}"` : name;
      return `${r.postal_code},${r.province_code},${r.municipality_code},${formattedName}`;
    })
  ];
  
  const csvContent = csvLines.join('\n');
  
  // Escribir archivo de salida
  fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf-8');
  
  console.log(`✅ Archivo generado: ${OUTPUT_FILE}`);
  console.log(`📊 Total de registros: ${records.length}`);
  
  // Estadísticas
  const uniqueProvinces = new Set(records.map(r => r.province_code)).size;
  const uniqueMunicipalities = new Set(records.map(r => r.municipality_code)).size;
  const uniquePostalCodes = new Set(records.map(r => r.postal_code)).size;
  
  console.log(`\n📈 Estadísticas:`);
  console.log(`   - Provincias únicas: ${uniqueProvinces}`);
  console.log(`   - Municipios únicos: ${uniqueMunicipalities}`);
  console.log(`   - Códigos postales únicos: ${uniquePostalCodes}`);
  
  // Tamaño del archivo
  const stats = fs.statSync(OUTPUT_FILE);
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  console.log(`   - Tamaño del archivo: ${fileSizeKB} KB`);
  
  console.log('\n✨ ¡Conversión completada exitosamente!');
  
} catch (error) {
  console.error('❌ Error durante la conversión:', error.message);
  process.exit(1);
}
