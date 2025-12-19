/**
 * Script de Generación de Localidades Españolas (INE)
 * 
 * Este script descarga y procesa datos oficiales del Instituto Nacional de Estadística (INE)
 * para generar un archivo JSON optimizado con provincias, municipios y códigos postales de España.
 * 
 * Uso:
 *   npx tsx scripts/generate-spain-locations.ts [opciones]
 * 
 * Opciones:
 *   --minify          Minificar el archivo JSON de salida (sin espacios ni saltos de línea)
 *   --output <path>   Ruta del archivo de salida (por defecto: public/data/spain-locations.json)
 *   --help            Mostrar ayuda
 * 
 * Requisitos: 2.1, 2.5
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TIPOS Y CONSTANTES
// ============================================================================

interface CommandLineArgs {
  minify: boolean;
  output: string;
  help: boolean;
}

interface GeneratorResult {
  success: boolean;
  provincesCount: number;
  municipalitiesCount: number;
  fileSize: number;
  errors: string[];
}

/**
 * Información de un código postal
 */
interface PostalCodeInfo {
  provinceCode: string;
  municipalityCode: string;
  municipalityName: string;
}

/**
 * Mapa de códigos postales
 * Clave: código postal (ej: "28001")
 * Valor: información del código postal
 */
type PostalCodeMap = Map<string, PostalCodeInfo>;

/**
 * Información de un municipio procesado
 */
interface ProcessedMunicipality {
  code: string;
  name: string;
  provinceCode: string;
  postalCodes: string[];
  isCapital: boolean;
}

/**
 * Información de una provincia procesada
 */
interface ProcessedProvince {
  code: string;
  name: string;
  autonomousCommunity: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  municipalities: ProcessedMunicipality[];
}

/**
 * Metadatos de una provincia
 */
interface ProvinceMetadata {
  code: string;
  name: string;
  autonomousCommunity: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

/**
 * Datos procesados listos para generar el JSON
 */
interface ProcessedData {
  provinces: ProcessedProvince[];
  totalMunicipalities: number;
}

// Colores ANSI para logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Colores de texto
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Colores de fondo
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

// ============================================================================
// METADATOS DE PROVINCIAS
// ============================================================================

/**
 * Mapa completo de las 50 provincias españolas con sus metadatos
 * 
 * Incluye:
 * - Código INE oficial
 * - Nombre de la provincia
 * - Comunidad autónoma a la que pertenece
 * - Coordenadas aproximadas del centro de la provincia
 * 
 * Requisitos: 7.1, 7.2, 7.3
 */
const PROVINCE_METADATA: ProvinceMetadata[] = [
  // Andalucía
  { code: '04', name: 'Almería', autonomousCommunity: 'Andalucía', coordinates: { lat: 36.8381, lng: -2.4597 } },
  { code: '11', name: 'Cádiz', autonomousCommunity: 'Andalucía', coordinates: { lat: 36.5271, lng: -6.2886 } },
  { code: '14', name: 'Córdoba', autonomousCommunity: 'Andalucía', coordinates: { lat: 37.8882, lng: -4.7794 } },
  { code: '18', name: 'Granada', autonomousCommunity: 'Andalucía', coordinates: { lat: 37.1773, lng: -3.5986 } },
  { code: '21', name: 'Huelva', autonomousCommunity: 'Andalucía', coordinates: { lat: 37.2614, lng: -6.9447 } },
  { code: '23', name: 'Jaén', autonomousCommunity: 'Andalucía', coordinates: { lat: 37.7796, lng: -3.7849 } },
  { code: '29', name: 'Málaga', autonomousCommunity: 'Andalucía', coordinates: { lat: 36.7213, lng: -4.4214 } },
  { code: '41', name: 'Sevilla', autonomousCommunity: 'Andalucía', coordinates: { lat: 37.3891, lng: -5.9845 } },
  
  // Aragón
  { code: '22', name: 'Huesca', autonomousCommunity: 'Aragón', coordinates: { lat: 42.1401, lng: -0.4080 } },
  { code: '44', name: 'Teruel', autonomousCommunity: 'Aragón', coordinates: { lat: 40.3456, lng: -1.1065 } },
  { code: '50', name: 'Zaragoza', autonomousCommunity: 'Aragón', coordinates: { lat: 41.6488, lng: -0.8891 } },
  
  // Asturias
  { code: '33', name: 'Asturias', autonomousCommunity: 'Principado de Asturias', coordinates: { lat: 43.3614, lng: -5.8593 } },
  
  // Islas Baleares
  { code: '07', name: 'Illes Balears', autonomousCommunity: 'Illes Balears', coordinates: { lat: 39.5696, lng: 2.6502 } },
  
  // Canarias
  { code: '35', name: 'Las Palmas', autonomousCommunity: 'Canarias', coordinates: { lat: 28.1248, lng: -15.4300 } },
  { code: '38', name: 'Santa Cruz de Tenerife', autonomousCommunity: 'Canarias', coordinates: { lat: 28.4636, lng: -16.2518 } },
  
  // Cantabria
  { code: '39', name: 'Cantabria', autonomousCommunity: 'Cantabria', coordinates: { lat: 43.1828, lng: -3.9878 } },
  
  // Castilla y León
  { code: '05', name: 'Ávila', autonomousCommunity: 'Castilla y León', coordinates: { lat: 40.6570, lng: -4.6813 } },
  { code: '09', name: 'Burgos', autonomousCommunity: 'Castilla y León', coordinates: { lat: 42.3439, lng: -3.6969 } },
  { code: '24', name: 'León', autonomousCommunity: 'Castilla y León', coordinates: { lat: 42.5987, lng: -5.5671 } },
  { code: '34', name: 'Palencia', autonomousCommunity: 'Castilla y León', coordinates: { lat: 42.0096, lng: -4.5288 } },
  { code: '37', name: 'Salamanca', autonomousCommunity: 'Castilla y León', coordinates: { lat: 40.9701, lng: -5.6635 } },
  { code: '40', name: 'Segovia', autonomousCommunity: 'Castilla y León', coordinates: { lat: 41.0000, lng: -4.1167 } },
  { code: '42', name: 'Soria', autonomousCommunity: 'Castilla y León', coordinates: { lat: 41.7665, lng: -2.4790 } },
  { code: '47', name: 'Valladolid', autonomousCommunity: 'Castilla y León', coordinates: { lat: 41.6523, lng: -4.7245 } },
  { code: '49', name: 'Zamora', autonomousCommunity: 'Castilla y León', coordinates: { lat: 41.5034, lng: -5.7467 } },
  
  // Castilla-La Mancha
  { code: '02', name: 'Albacete', autonomousCommunity: 'Castilla-La Mancha', coordinates: { lat: 38.9943, lng: -1.8585 } },
  { code: '13', name: 'Ciudad Real', autonomousCommunity: 'Castilla-La Mancha', coordinates: { lat: 38.9848, lng: -3.9273 } },
  { code: '16', name: 'Cuenca', autonomousCommunity: 'Castilla-La Mancha', coordinates: { lat: 40.0704, lng: -2.1374 } },
  { code: '19', name: 'Guadalajara', autonomousCommunity: 'Castilla-La Mancha', coordinates: { lat: 40.6318, lng: -3.1679 } },
  { code: '45', name: 'Toledo', autonomousCommunity: 'Castilla-La Mancha', coordinates: { lat: 39.8628, lng: -4.0273 } },
  
  // Cataluña
  { code: '08', name: 'Barcelona', autonomousCommunity: 'Catalunya', coordinates: { lat: 41.3851, lng: 2.1734 } },
  { code: '17', name: 'Girona', autonomousCommunity: 'Catalunya', coordinates: { lat: 41.9794, lng: 2.8214 } },
  { code: '25', name: 'Lleida', autonomousCommunity: 'Catalunya', coordinates: { lat: 41.6176, lng: 0.6200 } },
  { code: '43', name: 'Tarragona', autonomousCommunity: 'Catalunya', coordinates: { lat: 41.1189, lng: 1.2445 } },
  
  // Comunidad Valenciana
  { code: '03', name: 'Alicante/Alacant', autonomousCommunity: 'Comunitat Valenciana', coordinates: { lat: 38.3452, lng: -0.4810 } },
  { code: '12', name: 'Castellón/Castelló', autonomousCommunity: 'Comunitat Valenciana', coordinates: { lat: 39.9864, lng: -0.0513 } },
  { code: '46', name: 'Valencia/València', autonomousCommunity: 'Comunitat Valenciana', coordinates: { lat: 39.4699, lng: -0.3763 } },
  
  // Extremadura
  { code: '06', name: 'Badajoz', autonomousCommunity: 'Extremadura', coordinates: { lat: 38.8794, lng: -6.9707 } },
  { code: '10', name: 'Cáceres', autonomousCommunity: 'Extremadura', coordinates: { lat: 39.4753, lng: -6.3724 } },
  
  // Galicia
  { code: '15', name: 'A Coruña', autonomousCommunity: 'Galicia', coordinates: { lat: 43.3623, lng: -8.4115 } },
  { code: '27', name: 'Lugo', autonomousCommunity: 'Galicia', coordinates: { lat: 43.0097, lng: -7.5567 } },
  { code: '32', name: 'Ourense', autonomousCommunity: 'Galicia', coordinates: { lat: 42.3406, lng: -7.8644 } },
  { code: '36', name: 'Pontevedra', autonomousCommunity: 'Galicia', coordinates: { lat: 42.4296, lng: -8.6446 } },
  
  // La Rioja
  { code: '26', name: 'La Rioja', autonomousCommunity: 'La Rioja', coordinates: { lat: 42.2871, lng: -2.5396 } },
  
  // Comunidad de Madrid
  { code: '28', name: 'Madrid', autonomousCommunity: 'Comunidad de Madrid', coordinates: { lat: 40.4168, lng: -3.7038 } },
  
  // Región de Murcia
  { code: '30', name: 'Murcia', autonomousCommunity: 'Región de Murcia', coordinates: { lat: 37.9922, lng: -1.1307 } },
  
  // Comunidad Foral de Navarra
  { code: '31', name: 'Navarra', autonomousCommunity: 'Comunidad Foral de Navarra', coordinates: { lat: 42.6954, lng: -1.6761 } },
  
  // País Vasco
  { code: '01', name: 'Araba/Álava', autonomousCommunity: 'País Vasco', coordinates: { lat: 42.8467, lng: -2.6716 } },
  { code: '20', name: 'Gipuzkoa', autonomousCommunity: 'País Vasco', coordinates: { lat: 43.1829, lng: -2.0150 } },
  { code: '48', name: 'Bizkaia', autonomousCommunity: 'País Vasco', coordinates: { lat: 43.2630, lng: -2.9350 } },
  
  // Ceuta y Melilla
  { code: '51', name: 'Ceuta', autonomousCommunity: 'Ceuta', coordinates: { lat: 35.8894, lng: -5.3213 } },
  { code: '52', name: 'Melilla', autonomousCommunity: 'Melilla', coordinates: { lat: 35.2923, lng: -2.9381 } },
];

/**
 * Mapa de códigos de municipio que son capitales de provincia
 * 
 * Este conjunto contiene los códigos INE de los municipios que son capitales de provincia.
 * Se usa para marcar el campo isCapital en los municipios.
 * 
 * Requisito: 7.3
 */
const CAPITAL_MUNICIPALITY_CODES = new Set<string>([
  '01059', // Vitoria-Gasteiz (Araba/Álava)
  '02003', // Albacete
  '03014', // Alicante/Alacant
  '04013', // Almería
  '05019', // Ávila
  '06015', // Badajoz
  '07040', // Palma
  '08019', // Barcelona
  '09059', // Burgos
  '10037', // Cáceres
  '11012', // Cádiz
  '12040', // Castellón de la Plana/Castelló de la Plana
  '13034', // Ciudad Real
  '14021', // Córdoba
  '15030', // A Coruña
  '16078', // Cuenca
  '17079', // Girona
  '18087', // Granada
  '19130', // Guadalajara
  '20069', // Donostia/San Sebastián (Gipuzkoa)
  '21041', // Huelva
  '22125', // Huesca
  '23050', // Jaén
  '24089', // León
  '25120', // Lleida
  '26089', // Logroño (La Rioja)
  '27028', // Lugo
  '28079', // Madrid
  '29067', // Málaga
  '30030', // Murcia
  '31201', // Pamplona/Iruña (Navarra)
  '32054', // Ourense
  '33044', // Oviedo (Asturias)
  '34120', // Palencia
  '35016', // Las Palmas de Gran Canaria
  '36038', // Pontevedra
  '37274', // Salamanca
  '38038', // Santa Cruz de Tenerife
  '39075', // Santander (Cantabria)
  '40194', // Segovia
  '41091', // Sevilla
  '42173', // Soria
  '43148', // Tarragona
  '44216', // Teruel
  '45168', // Toledo
  '46250', // Valencia/València
  '47186', // Valladolid
  '48020', // Bilbao (Bizkaia)
  '49275', // Zamora
  '50297', // Zaragoza
  '51001', // Ceuta
  '52001', // Melilla
]);

// ============================================================================
// UTILIDADES DE LOGGING
// ============================================================================

/**
 * Logger con colores para diferentes tipos de mensajes
 */
class Logger {
  /**
   * Mensaje de éxito (verde)
   */
  static success(message: string): void {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
  }

  /**
   * Mensaje de error (rojo)
   */
  static error(message: string): void {
    console.error(`${colors.red}❌ ${message}${colors.reset}`);
  }

  /**
   * Mensaje de advertencia (amarillo)
   */
  static warning(message: string): void {
    console.warn(`${colors.yellow}⚠️  ${message}${colors.reset}`);
  }

  /**
   * Mensaje informativo (azul)
   */
  static info(message: string): void {
    console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
  }

  /**
   * Mensaje de progreso (cyan)
   */
  static progress(message: string): void {
    console.log(`${colors.cyan}⏳ ${message}${colors.reset}`);
  }

  /**
   * Título de sección (magenta, negrita)
   */
  static section(message: string): void {
    console.log(`\n${colors.magenta}${colors.bright}${message}${colors.reset}`);
  }

  /**
   * Mensaje simple sin formato
   */
  static log(message: string): void {
    console.log(message);
  }

  /**
   * Línea en blanco
   */
  static blank(): void {
    console.log('');
  }
}



// ============================================================================
// PARSEO DE ARGUMENTOS DE LÍNEA DE COMANDOS
// ============================================================================

/**
 * Parsear argumentos de línea de comandos
 */
function parseCommandLineArgs(): CommandLineArgs {
  const args = process.argv.slice(2);
  const parsedArgs: CommandLineArgs = {
    minify: false,
    output: path.join(__dirname, '..', 'public', 'data', 'spain-locations.json'),
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--minify':
        parsedArgs.minify = true;
        break;

      case '--output':
        if (i + 1 < args.length) {
          parsedArgs.output = args[i + 1];
          i++; // Saltar el siguiente argumento
        } else {
          Logger.error('La opción --output requiere un valor');
          process.exit(1);
        }
        break;

      case '--help':
      case '-h':
        parsedArgs.help = true;
        break;

      default:
        Logger.warning(`Argumento desconocido: ${arg}`);
        break;
    }
  }

  return parsedArgs;
}

/**
 * Mostrar ayuda del script
 */
function showHelp(): void {
  Logger.section('Script de Generación de Localidades Españolas (INE)');
  Logger.blank();
  Logger.log('Uso:');
  Logger.log('  npx tsx scripts/generate-spain-locations.ts [opciones]');
  Logger.blank();
  Logger.log('Opciones:');
  Logger.log('  --minify          Minificar el archivo JSON de salida (sin espacios ni saltos de línea)');
  Logger.log('  --output <path>   Ruta del archivo de salida (por defecto: public/data/spain-locations.json)');
  Logger.log('  --help, -h        Mostrar esta ayuda');
  Logger.blank();
  Logger.log('Ejemplos:');
  Logger.log('  npx tsx scripts/generate-spain-locations.ts');
  Logger.log('  npx tsx scripts/generate-spain-locations.ts --minify');
  Logger.log('  npx tsx scripts/generate-spain-locations.ts --output ./custom-path.json --minify');
  Logger.blank();
}

// ============================================================================
// CARGA DE CÓDIGOS POSTALES
// ============================================================================

/**
 * Cargar códigos postales desde el archivo CSV
 * 
 * Lee el archivo CSV de códigos postales y crea un mapa que asocia cada código postal
 * con su información de provincia y municipio.
 * 
 * @returns Mapa de códigos postales con su información
 * @throws Error si el archivo no existe o no se puede leer
 * 
 * Requisitos: 2.2, 2.4
 */
async function loadPostalCodes(): Promise<PostalCodeMap> {
  const csvFilePath = path.join(__dirname, '..', 'data', 'spain-postal-codes.csv');
  const errors: string[] = [];
  const postalCodeMap: PostalCodeMap = new Map();

  Logger.progress('Cargando códigos postales desde CSV...');

  // Verificar que el archivo existe
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`Archivo de códigos postales no encontrado: ${csvFilePath}`);
  }

  try {
    // Leer el archivo CSV
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n');

    // Validar que el archivo no está vacío
    if (lines.length < 2) {
      throw new Error('El archivo CSV está vacío o solo contiene encabezados');
    }

    // Parsear encabezados (primera línea)
    const headers = lines[0].trim().split(',');
    const expectedHeaders = ['postal_code', 'province_code', 'municipality_code', 'municipality_name'];

    // Validar encabezados
    if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
      throw new Error(
        `Encabezados del CSV inválidos. Esperados: ${expectedHeaders.join(', ')}. Encontrados: ${headers.join(', ')}`
      );
    }

    // Parsear cada línea (saltando la primera que son los encabezados)
    let validRecords = 0;
    let invalidRecords = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // Saltar líneas vacías
      if (!line) {
        continue;
      }

      try {
        // Parsear la línea con soporte para comillas
        const values: string[] = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentValue);
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        // Agregar el último valor
        values.push(currentValue);

        // Validar que tiene el número correcto de columnas
        if (values.length !== 4) {
          errors.push(`Línea ${i + 1}: Número incorrecto de columnas (esperadas: 4, encontradas: ${values.length})`);
          invalidRecords++;
          continue;
        }

        const [postalCode, provinceCode, municipalityCode, municipalityName] = values;

        // Validar formato de código postal (5 dígitos)
        if (!/^\d{5}$/.test(postalCode)) {
          errors.push(`Línea ${i + 1}: Código postal inválido "${postalCode}" (debe ser 5 dígitos)`);
          invalidRecords++;
          continue;
        }

        // Validar que province_code no está vacío
        if (!provinceCode || provinceCode.trim() === '') {
          errors.push(`Línea ${i + 1}: Código de provincia vacío para código postal "${postalCode}"`);
          invalidRecords++;
          continue;
        }

        // Validar que municipality_code no está vacío
        if (!municipalityCode || municipalityCode.trim() === '') {
          errors.push(`Línea ${i + 1}: Código de municipio vacío para código postal "${postalCode}"`);
          invalidRecords++;
          continue;
        }

        // Validar que municipality_name no está vacío
        if (!municipalityName || municipalityName.trim() === '') {
          errors.push(`Línea ${i + 1}: Nombre de municipio vacío para código postal "${postalCode}"`);
          invalidRecords++;
          continue;
        }

        // Agregar al mapa
        postalCodeMap.set(postalCode, {
          provinceCode: provinceCode.trim(),
          municipalityCode: municipalityCode.trim(),
          municipalityName: municipalityName.trim(),
        });

        validRecords++;
      } catch (error) {
        // Registrar error de parsing sin detener el proceso
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Línea ${i + 1}: Error al parsear - ${errorMessage}`);
        invalidRecords++;
      }
    }

    // Mostrar resumen de carga
    Logger.success(`Códigos postales cargados: ${validRecords}`);

    if (invalidRecords > 0) {
      Logger.warning(`Registros inválidos encontrados: ${invalidRecords}`);
      
      // Mostrar los primeros 10 errores
      if (errors.length > 0) {
        Logger.warning('Primeros errores encontrados:');
        errors.slice(0, 10).forEach((error, index) => {
          Logger.log(`   ${index + 1}. ${error}`);
        });
        
        if (errors.length > 10) {
          Logger.log(`   ... y ${errors.length - 10} errores más`);
        }
      }
    }

    // Validar que se cargaron códigos postales
    if (postalCodeMap.size === 0) {
      throw new Error('No se pudo cargar ningún código postal válido del archivo CSV');
    }

    return postalCodeMap;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error al cargar códigos postales: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// PROCESAMIENTO DE DATOS
// ============================================================================

/**
 * Procesar datos de códigos postales y agrupar por provincia
 * 
 * Esta función toma el mapa de códigos postales y:
 * 1. Agrupa municipios por provincia
 * 2. Elimina duplicados de municipios
 * 3. Agrega múltiples códigos postales a municipios grandes
 * 4. Agrega metadatos de provincias (coordenadas, comunidad autónoma)
 * 5. Marca capitales de provincia
 * 6. Ordena provincias alfabéticamente
 * 7. Ordena municipios alfabéticamente dentro de cada provincia
 * 8. Valida que todas las 50 provincias estén presentes
 * 
 * @param postalCodeMap Mapa de códigos postales cargado desde el CSV
 * @returns Datos procesados y organizados por provincia
 * 
 * Requisitos: 2.2, 7.1, 7.2, 7.3, 7.4
 */
function processData(postalCodeMap: PostalCodeMap): ProcessedData {
  Logger.progress('Procesando datos y agrupando por provincia...');

  // Crear mapa de metadatos de provincias para acceso rápido
  const provinceMetadataMap = new Map<string, ProvinceMetadata>();
  for (const metadata of PROVINCE_METADATA) {
    provinceMetadataMap.set(metadata.code, metadata);
  }

  // Mapa temporal para agrupar municipios por provincia
  // Clave: código de provincia
  // Valor: Mapa de municipios (clave: código de municipio, valor: municipio)
  const provinceMap = new Map<string, Map<string, ProcessedMunicipality>>();

  // Paso 1: Agrupar municipios por provincia y agregar códigos postales
  for (const [postalCode, info] of Array.from(postalCodeMap.entries())) {
    const { provinceCode, municipalityCode, municipalityName } = info;

    // Obtener o crear el mapa de municipios para esta provincia
    if (!provinceMap.has(provinceCode)) {
      provinceMap.set(provinceCode, new Map());
    }

    const municipalitiesMap = provinceMap.get(provinceCode)!;

    // Obtener o crear el municipio
    if (!municipalitiesMap.has(municipalityCode)) {
      // Determinar si es capital de provincia
      const isCapital = CAPITAL_MUNICIPALITY_CODES.has(municipalityCode);
      
      // Agregar "(Capital)" al nombre si es capital de provincia
      const displayName = isCapital ? `${municipalityName} (Capital)` : municipalityName;

      municipalitiesMap.set(municipalityCode, {
        code: municipalityCode,
        name: displayName,
        provinceCode: provinceCode,
        postalCodes: [],
        isCapital,
      });
    }

    const municipality = municipalitiesMap.get(municipalityCode)!;

    // Agregar el código postal si no existe ya (eliminar duplicados)
    if (!municipality.postalCodes.includes(postalCode)) {
      municipality.postalCodes.push(postalCode);
    }
  }

  Logger.success(`Provincias encontradas en datos: ${provinceMap.size}`);

  // Paso 2: Validar que todas las 50 provincias estén presentes
  const missingProvinces: string[] = [];
  for (const metadata of PROVINCE_METADATA) {
    if (!provinceMap.has(metadata.code)) {
      missingProvinces.push(`${metadata.name} (${metadata.code})`);
    }
  }

  if (missingProvinces.length > 0) {
    Logger.warning(`Provincias sin datos de códigos postales: ${missingProvinces.length}`);
    Logger.log(`   Provincias faltantes: ${missingProvinces.join(', ')}`);
  }

  // Validar que tenemos exactamente 52 provincias en los metadatos (50 provincias + Ceuta + Melilla)
  if (PROVINCE_METADATA.length !== 52) {
    Logger.warning(`Se esperaban 52 provincias en metadatos, pero se encontraron ${PROVINCE_METADATA.length}`);
  } else {
    Logger.success('✓ Todas las 52 provincias españolas están definidas en metadatos (50 provincias + Ceuta + Melilla)');
  }

  // Paso 3: Convertir a array y agregar metadatos de provincias
  const provinces: ProcessedProvince[] = [];

  for (const [provinceCode, municipalitiesMap] of Array.from(provinceMap.entries())) {
    // Obtener metadatos de la provincia
    const metadata = provinceMetadataMap.get(provinceCode);
    
    if (!metadata) {
      Logger.warning(`No se encontraron metadatos para la provincia ${provinceCode}`);
      continue;
    }

    // Convertir municipios a array
    const municipalities: ProcessedMunicipality[] = Array.from(municipalitiesMap.values());

    // Ordenar códigos postales dentro de cada municipio
    municipalities.forEach((municipality: ProcessedMunicipality) => {
      municipality.postalCodes.sort((a, b) => a.localeCompare(b));
    });

    // Ordenar municipios alfabéticamente por nombre
    municipalities.sort((a: ProcessedMunicipality, b: ProcessedMunicipality) => 
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    provinces.push({
      code: provinceCode,
      name: metadata.name,
      autonomousCommunity: metadata.autonomousCommunity,
      coordinates: metadata.coordinates,
      municipalities,
    });
  }

  // Ordenar provincias alfabéticamente por nombre
  provinces.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

  // Calcular total de municipios
  const totalMunicipalities = provinces.reduce(
    (total, province) => total + province.municipalities.length,
    0
  );

  Logger.success(`Municipios procesados: ${totalMunicipalities}`);

  // Mostrar estadísticas de municipios con múltiples códigos postales
  let municipalitiesWithMultiplePostalCodes = 0;
  let maxPostalCodes = 0;
  let municipalityWithMostPostalCodes = '';

  for (const province of provinces) {
    for (const municipality of province.municipalities) {
      if (municipality.postalCodes.length > 1) {
        municipalitiesWithMultiplePostalCodes++;
      }
      if (municipality.postalCodes.length > maxPostalCodes) {
        maxPostalCodes = municipality.postalCodes.length;
        municipalityWithMostPostalCodes = municipality.name;
      }
    }
  }

  Logger.info(`Municipios con múltiples códigos postales: ${municipalitiesWithMultiplePostalCodes}`);
  Logger.info(`Municipio con más códigos postales: ${municipalityWithMostPostalCodes} (${maxPostalCodes} códigos)`);

  // Mostrar estadísticas de capitales de provincia
  let capitalCount = 0;
  const capitals: string[] = [];
  for (const province of provinces) {
    for (const municipality of province.municipalities) {
      if (municipality.isCapital) {
        capitalCount++;
        capitals.push(`${municipality.name} (${municipality.code})`);
      }
    }
  }
  Logger.info(`Capitales de provincia identificadas: ${capitalCount}`);
  if (capitals.length > 0) {
    Logger.log(`   Capitales: ${capitals.join(', ')}`);
  }

  return {
    provinces,
    totalMunicipalities,
  };
}

// ============================================================================
// GENERACIÓN DEL ARCHIVO JSON
// ============================================================================

/**
 * Estructura del archivo JSON de salida
 */
interface SpainLocationsData {
  version: string;
  generatedAt: string;
  source: string;
  provinces: Array<{
    code: string;
    name: string;
    autonomousCommunity: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  }>;
  municipalities: Array<{
    code: string;
    name: string;
    provinceCode: string;
    postalCodes: string[];
    isCapital: boolean;
  }>;
}

/**
 * Generar archivo JSON con los datos de localidades
 * 
 * Esta función toma los datos procesados y:
 * 1. Serializa los datos en formato JSON
 * 2. Agrega metadatos (version, generatedAt, source)
 * 3. Aplica minificación si se solicita (sin espacios ni saltos de línea)
 * 4. Escribe el archivo en la ruta especificada
 * 5. Calcula y muestra el tamaño del archivo generado
 * 6. Valida que el tamaño sea menor a 500KB
 * 
 * @param data Datos procesados de provincias y municipios
 * @param outputPath Ruta donde se guardará el archivo JSON
 * @param minify Si se debe minificar el JSON (sin espacios)
 * @returns Resultado de la generación con estadísticas
 * 
 * Requisitos: 2.2, 2.3, 5.1, 5.4, 7.5
 */
function generateJSON(
  data: ProcessedData,
  outputPath: string,
  minify: boolean
): GeneratorResult {
  Logger.progress('Generando archivo JSON...');

  const errors: string[] = [];

  try {
    // Paso 1: Crear estructura de datos para el JSON
    const jsonData: SpainLocationsData = {
      version: '2025.1',
      generatedAt: new Date().toISOString(),
      source: 'INE - Instituto Nacional de Estadística',
      provinces: [],
      municipalities: [],
    };

    // Paso 2: Agregar provincias (sin municipios anidados para reducir tamaño)
    for (const province of data.provinces) {
      jsonData.provinces.push({
        code: province.code,
        name: province.name,
        autonomousCommunity: province.autonomousCommunity,
        coordinates: province.coordinates,
      });

      // Agregar municipios de esta provincia
      for (const municipality of province.municipalities) {
        jsonData.municipalities.push({
          code: municipality.code,
          name: municipality.name,
          provinceCode: municipality.provinceCode,
          postalCodes: municipality.postalCodes,
          isCapital: municipality.isCapital,
        });
      }
    }

    // Paso 3: Serializar a JSON
    const jsonString = minify
      ? JSON.stringify(jsonData) // Sin espacios ni saltos de línea
      : JSON.stringify(jsonData, null, 2); // Con formato legible

    // Paso 4: Crear directorio de salida si no existe
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      Logger.info(`Creando directorio: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Paso 5: Escribir archivo
    fs.writeFileSync(outputPath, jsonString, 'utf-8');

    // Paso 6: Calcular tamaño del archivo
    const stats = fs.statSync(outputPath);
    const fileSizeBytes = stats.size;
    const fileSizeKB = fileSizeBytes / 1024;

    Logger.success(`Archivo generado: ${outputPath}`);
    Logger.info(`Tamaño del archivo: ${fileSizeKB.toFixed(2)} KB (${fileSizeBytes} bytes)`);

    // Paso 7: Validar que el tamaño sea menor a 500KB
    const MAX_FILE_SIZE_KB = 500;
    if (fileSizeKB > MAX_FILE_SIZE_KB) {
      const warning = `⚠️  El archivo excede el tamaño máximo recomendado de ${MAX_FILE_SIZE_KB} KB`;
      Logger.warning(warning);
      errors.push(warning);
    } else {
      Logger.success(`✓ El archivo cumple con el límite de tamaño (< ${MAX_FILE_SIZE_KB} KB)`);
    }

    // Paso 8: Mostrar estadísticas adicionales
    Logger.blank();
    Logger.info('Estadísticas del archivo generado:');
    Logger.log(`   - Versión: ${jsonData.version}`);
    Logger.log(`   - Fecha de generación: ${jsonData.generatedAt}`);
    Logger.log(`   - Fuente: ${jsonData.source}`);
    Logger.log(`   - Provincias: ${jsonData.provinces.length}`);
    Logger.log(`   - Municipios: ${jsonData.municipalities.length}`);
    Logger.log(`   - Minificado: ${minify ? 'Sí' : 'No'}`);

    // Calcular códigos postales totales
    const totalPostalCodes = jsonData.municipalities.reduce(
      (total, municipality) => total + municipality.postalCodes.length,
      0
    );
    Logger.log(`   - Códigos postales: ${totalPostalCodes}`);

    // Validar minificación si se solicitó
    if (minify) {
      // Verificar que no hay espacios innecesarios ni saltos de línea
      const hasUnnecessaryWhitespace = /\n|\r|  /.test(jsonString);
      if (hasUnnecessaryWhitespace) {
        const warning = 'El archivo minificado contiene espacios innecesarios o saltos de línea';
        Logger.warning(warning);
        errors.push(warning);
      } else {
        Logger.success('✓ El archivo está correctamente minificado');
      }
    }

    return {
      success: true,
      provincesCount: jsonData.provinces.length,
      municipalitiesCount: jsonData.municipalities.length,
      fileSize: fileSizeBytes,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`Error al generar archivo JSON: ${errorMessage}`);

    return {
      success: false,
      provincesCount: 0,
      municipalitiesCount: 0,
      fileSize: 0,
      errors,
    };
  }
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

/**
 * Función principal del script
 */
async function main(): Promise<void> {
  try {
    // Parsear argumentos de línea de comandos
    const args = parseCommandLineArgs();

    // Mostrar ayuda si se solicita
    if (args.help) {
      showHelp();
      process.exit(0);
    }

    // Banner de inicio
    Logger.section('🚀 Generación de Localidades Españolas (INE)');
    Logger.blank();

    // Mostrar configuración
    Logger.info('Configuración:');
    Logger.log(`   - Minificar: ${args.minify ? 'Sí' : 'No'}`);
    Logger.log(`   - Archivo de salida: ${args.output}`);
    Logger.blank();

    // Cargar códigos postales desde CSV
    Logger.blank();
    Logger.section('📥 Cargando Datos');
    Logger.blank();

    const postalCodeMap = await loadPostalCodes();
    
    Logger.blank();
    Logger.info(`Total de códigos postales cargados: ${postalCodeMap.size}`);

    // Procesar datos y agrupar por provincia
    Logger.blank();
    Logger.section('⚙️  Procesando Datos');
    Logger.blank();

    const processedData = processData(postalCodeMap);

    // Generar archivo JSON
    Logger.blank();
    Logger.section('📝 Generando Archivo JSON');
    Logger.blank();

    const result = generateJSON(processedData, args.output, args.minify);

    // Mostrar resultado
    Logger.blank();
    Logger.section('📊 Resultado de la Generación');
    Logger.blank();

    if (result.success) {
      Logger.success('Generación completada exitosamente');
      Logger.log(`   - Provincias: ${result.provincesCount}`);
      Logger.log(`   - Municipios: ${result.municipalitiesCount}`);
      Logger.log(`   - Tamaño del archivo: ${(result.fileSize / 1024).toFixed(2)} KB`);
      
      if (result.errors.length > 0) {
        Logger.blank();
        Logger.warning(`Se encontraron ${result.errors.length} errores durante el procesamiento:`);
        result.errors.forEach((error, index) => {
          Logger.log(`   ${index + 1}. ${error}`);
        });
      }
      
      Logger.blank();
      Logger.success('✨ Proceso completado exitosamente!');
    } else {
      Logger.error('La generación falló');
      if (result.errors.length > 0) {
        Logger.blank();
        Logger.error('Errores encontrados:');
        result.errors.forEach((error, index) => {
          Logger.log(`   ${index + 1}. ${error}`);
        });
      }
      process.exit(1);
    }

  } catch (error) {
    Logger.blank();
    Logger.error('Error crítico durante la ejecución del script:');
    
    if (error instanceof Error) {
      Logger.log(`   Mensaje: ${error.message}`);
      if (error.stack) {
        Logger.log(`   Stack trace:`);
        Logger.log(error.stack);
      }
    } else {
      Logger.log(`   ${String(error)}`);
    }
    
    Logger.blank();
    process.exit(1);
  }
}

// ============================================================================
// EXPORTACIONES PARA TESTING
// ============================================================================

// Exportar funciones para testing
export {
  loadPostalCodes,
  processData,
  generateJSON,
};

// Exportar tipos para testing
export type {
  PostalCodeMap,
  ProcessedData,
  GeneratorResult,
};

// ============================================================================
// EJECUCIÓN DEL SCRIPT
// ============================================================================

// Ejecutar la función principal solo si se ejecuta directamente
if (require.main === module) {
  main();
}
