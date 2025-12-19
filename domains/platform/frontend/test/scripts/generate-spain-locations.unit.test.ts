/**
 * Tests unitarios para el script de generación de localidades españolas
 * 
 * Estos tests verifican el comportamiento de las funciones individuales del script:
 * - loadPostalCodes() con CSV válido
 * - loadPostalCodes() con CSV con errores
 * - processData() con datos de ejemplo
 * - generateJSON() con minificación
 * - Verificar que el archivo generado cumple con el schema
 * 
 * Requisitos: 2.2, 2.4
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  loadPostalCodes,
  processData,
  generateJSON,
  PostalCodeMap,
  ProcessedData,
  GeneratorResult,
} from '../../scripts/generate-spain-locations';

describe('Script de Generación - Tests Unitarios', () => {
  // Directorio temporal para tests
  const testDataDir = path.join(__dirname, 'test-data');
  const testOutputDir = path.join(__dirname, 'test-output');

  beforeAll(() => {
    // Crear directorios de test si no existen
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Limpiar directorios de test
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('loadPostalCodes() con CSV válido', () => {
    let validCsvPath: string;

    beforeEach(() => {
      // Crear CSV válido de prueba
      validCsvPath = path.join(testDataDir, 'valid-postal-codes.csv');
      const csvContent = `postal_code,province_code,municipality_code,municipality_name
28001,28,28079,Madrid
28002,28,28079,Madrid
28003,28,28079,Madrid
08001,08,08019,Barcelona
08002,08,08019,Barcelona
41001,41,41091,Sevilla
29001,29,29067,Málaga`;

      fs.writeFileSync(validCsvPath, csvContent, 'utf-8');
    });

    afterEach(() => {
      // Limpiar archivo de prueba
      if (fs.existsSync(validCsvPath)) {
        fs.unlinkSync(validCsvPath);
      }
    });

    it('debe cargar correctamente códigos postales desde un CSV válido', async () => {
      // Modificar temporalmente la ruta del CSV en el módulo
      const originalCsvPath = path.join(__dirname, '..', '..', 'data', 'spain-postal-codes.csv');
      
      // Copiar el CSV de prueba a la ubicación esperada
      const targetDir = path.join(__dirname, '..', '..', 'data');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const backupPath = originalCsvPath + '.backup';
      let hadOriginal = false;
      
      if (fs.existsSync(originalCsvPath)) {
        fs.copyFileSync(originalCsvPath, backupPath);
        hadOriginal = true;
      }
      
      fs.copyFileSync(validCsvPath, originalCsvPath);

      try {
        const postalCodeMap = await loadPostalCodes();

        // Verificar que se cargaron los códigos postales
        expect(postalCodeMap.size).toBe(7);

        // Verificar que los códigos postales están en el mapa
        expect(postalCodeMap.has('28001')).toBe(true);
        expect(postalCodeMap.has('28002')).toBe(true);
        expect(postalCodeMap.has('08001')).toBe(true);

        // Verificar la estructura de los datos
        const madrid28001 = postalCodeMap.get('28001');
        expect(madrid28001).toBeDefined();
        expect(madrid28001?.provinceCode).toBe('28');
        expect(madrid28001?.municipalityCode).toBe('28079');
        expect(madrid28001?.municipalityName).toBe('Madrid');
      } finally {
        // Restaurar el archivo original
        if (hadOriginal) {
          fs.copyFileSync(backupPath, originalCsvPath);
          fs.unlinkSync(backupPath);
        } else {
          fs.unlinkSync(originalCsvPath);
        }
      }
    });

    it('debe retornar un Map con la estructura correcta', async () => {
      const originalCsvPath = path.join(__dirname, '..', '..', 'data', 'spain-postal-codes.csv');
      const targetDir = path.join(__dirname, '..', '..', 'data');
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const backupPath = originalCsvPath + '.backup';
      let hadOriginal = false;
      
      if (fs.existsSync(originalCsvPath)) {
        fs.copyFileSync(originalCsvPath, backupPath);
        hadOriginal = true;
      }
      
      fs.copyFileSync(validCsvPath, originalCsvPath);

      try {
        const postalCodeMap = await loadPostalCodes();

        // Verificar que es un Map
        expect(postalCodeMap instanceof Map).toBe(true);

        // Verificar que cada entrada tiene la estructura correcta
        for (const [postalCode, info] of postalCodeMap.entries()) {
          expect(typeof postalCode).toBe('string');
          expect(postalCode).toMatch(/^\d{5}$/);
          
          expect(info).toHaveProperty('provinceCode');
          expect(info).toHaveProperty('municipalityCode');
          expect(info).toHaveProperty('municipalityName');
          
          expect(typeof info.provinceCode).toBe('string');
          expect(typeof info.municipalityCode).toBe('string');
          expect(typeof info.municipalityName).toBe('string');
        }
      } finally {
        if (hadOriginal) {
          fs.copyFileSync(backupPath, originalCsvPath);
          fs.unlinkSync(backupPath);
        } else {
          fs.unlinkSync(originalCsvPath);
        }
      }
    });
  });

  describe('loadPostalCodes() con CSV con errores', () => {
    it('debe manejar líneas con formato incorrecto sin fallar', async () => {
      // Crear CSV con errores
      const invalidCsvPath = path.join(testDataDir, 'invalid-postal-codes.csv');
      const csvContent = `postal_code,province_code,municipality_code,municipality_name
28001,28,28079,Madrid
INVALID,28,28079,Madrid
28003,28,28079,Madrid
08001,08,08019
08002,08,08019,Barcelona`;

      fs.writeFileSync(invalidCsvPath, csvContent, 'utf-8');

      const originalCsvPath = path.join(__dirname, '..', '..', 'data', 'spain-postal-codes.csv');
      const targetDir = path.join(__dirname, '..', '..', 'data');
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const backupPath = originalCsvPath + '.backup';
      let hadOriginal = false;
      
      if (fs.existsSync(originalCsvPath)) {
        fs.copyFileSync(originalCsvPath, backupPath);
        hadOriginal = true;
      }
      
      fs.copyFileSync(invalidCsvPath, originalCsvPath);

      try {
        const postalCodeMap = await loadPostalCodes();

        // Debe cargar solo los registros válidos
        expect(postalCodeMap.size).toBe(3); // 28001, 28003, 08002

        // Verificar que los registros válidos están presentes
        expect(postalCodeMap.has('28001')).toBe(true);
        expect(postalCodeMap.has('28003')).toBe(true);
        expect(postalCodeMap.has('08002')).toBe(true);

        // Verificar que los registros inválidos no están presentes
        expect(postalCodeMap.has('INVALID')).toBe(false);
        expect(postalCodeMap.has('08001')).toBe(false); // Falta municipality_name
      } finally {
        if (hadOriginal) {
          fs.copyFileSync(backupPath, originalCsvPath);
          fs.unlinkSync(backupPath);
        } else {
          fs.unlinkSync(originalCsvPath);
        }
        
        if (fs.existsSync(invalidCsvPath)) {
          fs.unlinkSync(invalidCsvPath);
        }
      }
    });

    it('debe lanzar error si el archivo CSV no existe', async () => {
      // Eliminar temporalmente el archivo CSV
      const originalCsvPath = path.join(__dirname, '..', '..', 'data', 'spain-postal-codes.csv');
      const backupPath = originalCsvPath + '.backup';
      let hadOriginal = false;
      
      if (fs.existsSync(originalCsvPath)) {
        fs.copyFileSync(originalCsvPath, backupPath);
        fs.unlinkSync(originalCsvPath);
        hadOriginal = true;
      }

      try {
        await expect(loadPostalCodes()).rejects.toThrow('Archivo de códigos postales no encontrado');
      } finally {
        if (hadOriginal) {
          fs.copyFileSync(backupPath, originalCsvPath);
          fs.unlinkSync(backupPath);
        }
      }
    });

    it('debe lanzar error si el archivo CSV está vacío', async () => {
      const emptyCsvPath = path.join(testDataDir, 'empty-postal-codes.csv');
      fs.writeFileSync(emptyCsvPath, '', 'utf-8');

      const originalCsvPath = path.join(__dirname, '..', '..', 'data', 'spain-postal-codes.csv');
      const targetDir = path.join(__dirname, '..', '..', 'data');
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const backupPath = originalCsvPath + '.backup';
      let hadOriginal = false;
      
      if (fs.existsSync(originalCsvPath)) {
        fs.copyFileSync(originalCsvPath, backupPath);
        hadOriginal = true;
      }
      
      fs.copyFileSync(emptyCsvPath, originalCsvPath);

      try {
        await expect(loadPostalCodes()).rejects.toThrow('El archivo CSV está vacío');
      } finally {
        if (hadOriginal) {
          fs.copyFileSync(backupPath, originalCsvPath);
          fs.unlinkSync(backupPath);
        } else {
          fs.unlinkSync(originalCsvPath);
        }
        
        if (fs.existsSync(emptyCsvPath)) {
          fs.unlinkSync(emptyCsvPath);
        }
      }
    });

    it('debe lanzar error si los encabezados del CSV son incorrectos', async () => {
      const wrongHeadersCsvPath = path.join(testDataDir, 'wrong-headers-postal-codes.csv');
      const csvContent = `codigo_postal,provincia,municipio,nombre
28001,28,28079,Madrid`;

      fs.writeFileSync(wrongHeadersCsvPath, csvContent, 'utf-8');

      const originalCsvPath = path.join(__dirname, '..', '..', 'data', 'spain-postal-codes.csv');
      const targetDir = path.join(__dirname, '..', '..', 'data');
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const backupPath = originalCsvPath + '.backup';
      let hadOriginal = false;
      
      if (fs.existsSync(originalCsvPath)) {
        fs.copyFileSync(originalCsvPath, backupPath);
        hadOriginal = true;
      }
      
      fs.copyFileSync(wrongHeadersCsvPath, originalCsvPath);

      try {
        await expect(loadPostalCodes()).rejects.toThrow('Encabezados del CSV inválidos');
      } finally {
        if (hadOriginal) {
          fs.copyFileSync(backupPath, originalCsvPath);
          fs.unlinkSync(backupPath);
        } else {
          fs.unlinkSync(originalCsvPath);
        }
        
        if (fs.existsSync(wrongHeadersCsvPath)) {
          fs.unlinkSync(wrongHeadersCsvPath);
        }
      }
    });
  });

  describe('processData() con datos de ejemplo', () => {
    it('debe agrupar municipios por provincia correctamente', () => {
      // Crear datos de ejemplo
      const postalCodeMap: PostalCodeMap = new Map([
        ['28001', { provinceCode: '28', municipalityCode: '28079', municipalityName: 'Madrid' }],
        ['28002', { provinceCode: '28', municipalityCode: '28079', municipalityName: 'Madrid' }],
        ['28100', { provinceCode: '28', municipalityCode: '28006', municipalityName: 'Alcobendas' }],
        ['08001', { provinceCode: '08', municipalityCode: '08019', municipalityName: 'Barcelona' }],
        ['08002', { provinceCode: '08', municipalityCode: '08019', municipalityName: 'Barcelona' }],
      ]);

      const result = processData(postalCodeMap);

      // Verificar que se agruparon correctamente
      expect(result.provinces.length).toBeGreaterThan(0);
      expect(result.totalMunicipalities).toBeGreaterThan(0);

      // Buscar provincia de Madrid
      const madridProvince = result.provinces.find(p => p.code === '28');
      expect(madridProvince).toBeDefined();
      expect(madridProvince?.municipalities.length).toBe(2); // Madrid y Alcobendas

      // Buscar provincia de Barcelona
      const barcelonaProvince = result.provinces.find(p => p.code === '08');
      expect(barcelonaProvince).toBeDefined();
      expect(barcelonaProvince?.municipalities.length).toBe(1); // Barcelona
    });

    it('debe eliminar duplicados de municipios', () => {
      const postalCodeMap: PostalCodeMap = new Map([
        ['28001', { provinceCode: '28', municipalityCode: '28079', municipalityName: 'Madrid' }],
        ['28002', { provinceCode: '28', municipalityCode: '28079', municipalityName: 'Madrid' }],
        ['28003', { provinceCode: '28', municipalityCode: '28079', municipalityName: 'Madrid' }],
      ]);

      const result = processData(postalCodeMap);

      const madridProvince = result.provinces.find(p => p.code === '28');
      expect(madridProvince).toBeDefined();
      expect(madridProvince?.municipalities.length).toBe(1); // Solo un municipio Madrid

      // Verificar que tiene múltiples códigos postales
      const madridMunicipality = madridProvince?.municipalities[0];
      expect(madridMunicipality?.postalCodes.length).toBe(3);
      expect(madridMunicipality?.postalCodes).toContain('28001');
      expect(madridMunicipality?.postalCodes).toContain('28002');
      expect(madridMunicipality?.postalCodes).toContain('28003');
    });

    it('debe agregar metadatos a provincias (coordenadas, comunidad autónoma)', () => {
      const postalCodeMap: PostalCodeMap = new Map([
        ['28001', { provinceCode: '28', municipalityCode: '28079', municipalityName: 'Madrid' }],
      ]);

      const result = processData(postalCodeMap);

      const madridProvince = result.provinces.find(p => p.code === '28');
      expect(madridProvince).toBeDefined();
      
      // Verificar metadatos
      expect(madridProvince?.name).toBe('Madrid');
      expect(madridProvince?.autonomousCommunity).toBe('Comunidad de Madrid');
      expect(madridProvince?.coordinates).toBeDefined();
      expect(madridProvince?.coordinates.lat).toBe(40.4168);
      expect(madridProvince?.coordinates.lng).toBe(-3.7038);
    });

    it('debe marcar capitales de provincia correctamente', () => {
      const postalCodeMap: PostalCodeMap = new Map([
        ['28001', { provinceCode: '28', municipalityCode: '28079', municipalityName: 'Madrid' }],
        ['28100', { provinceCode: '28', municipalityCode: '28006', municipalityName: 'Alcobendas' }],
      ]);

      const result = processData(postalCodeMap);

      const madridProvince = result.provinces.find(p => p.code === '28');
      expect(madridProvince).toBeDefined();

      // Madrid (28079) debe ser capital
      const madridMunicipality = madridProvince?.municipalities.find(m => m.code === '28079');
      expect(madridMunicipality?.isCapital).toBe(true);

      // Alcobendas (28006) no debe ser capital
      const alcobendasMunicipality = madridProvince?.municipalities.find(m => m.code === '28006');
      expect(alcobendasMunicipality?.isCapital).toBe(false);
    });

    it('debe ordenar provincias alfabéticamente', () => {
      const postalCodeMap: PostalCodeMap = new Map([
        ['50001', { provinceCode: '50', municipalityCode: '50297', municipalityName: 'Zaragoza' }],
        ['02001', { provinceCode: '02', municipalityCode: '02003', municipalityName: 'Albacete' }],
        ['28001', { provinceCode: '28', municipalityCode: '28079', municipalityName: 'Madrid' }],
      ]);

      const result = processData(postalCodeMap);

      // Verificar orden alfabético
      expect(result.provinces.length).toBe(3);
      expect(result.provinces[0].name).toBe('Albacete');
      expect(result.provinces[1].name).toBe('Madrid');
      expect(result.provinces[2].name).toBe('Zaragoza');
    });

    it('debe ordenar municipios alfabéticamente dentro de cada provincia', () => {
      const postalCodeMap: PostalCodeMap = new Map([
        ['28001', { provinceCode: '28', municipalityCode: '28079', municipalityName: 'Madrid' }],
        ['28300', { provinceCode: '28', municipalityCode: '28005', municipalityName: 'Aranjuez' }],
        ['28100', { provinceCode: '28', municipalityCode: '28006', municipalityName: 'Alcobendas' }],
      ]);

      const result = processData(postalCodeMap);

      const madridProvince = result.provinces.find(p => p.code === '28');
      expect(madridProvince).toBeDefined();
      expect(madridProvince?.municipalities.length).toBe(3);

      // Verificar orden alfabético
      expect(madridProvince?.municipalities[0].name).toBe('Alcobendas');
      expect(madridProvince?.municipalities[1].name).toBe('Aranjuez');
      expect(madridProvince?.municipalities[2].name).toBe('Madrid (Capital)');
    });
  });

  describe('generateJSON() con minificación', () => {
    it('debe generar archivo JSON con estructura correcta', () => {
      const processedData: ProcessedData = {
        provinces: [
          {
            code: '28',
            name: 'Madrid',
            autonomousCommunity: 'Comunidad de Madrid',
            coordinates: { lat: 40.4168, lng: -3.7038 },
            municipalities: [
              {
                code: '28079',
                name: 'Madrid',
                provinceCode: '28',
                postalCodes: ['28001', '28002'],
                isCapital: true,
              },
            ],
          },
        ],
        totalMunicipalities: 1,
      };

      const outputPath = path.join(testOutputDir, 'test-output.json');
      const result = generateJSON(processedData, outputPath, false);

      expect(result.success).toBe(true);
      expect(result.provincesCount).toBe(1);
      expect(result.municipalitiesCount).toBe(1);
      expect(result.fileSize).toBeGreaterThan(0);

      // Verificar que el archivo existe
      expect(fs.existsSync(outputPath)).toBe(true);

      // Verificar contenido del archivo
      const content = fs.readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);

      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('generatedAt');
      expect(data).toHaveProperty('source');
      expect(data).toHaveProperty('provinces');
      expect(data).toHaveProperty('municipalities');
    });

    it('debe minificar el archivo JSON cuando se solicita', () => {
      const processedData: ProcessedData = {
        provinces: [
          {
            code: '28',
            name: 'Madrid',
            autonomousCommunity: 'Comunidad de Madrid',
            coordinates: { lat: 40.4168, lng: -3.7038 },
            municipalities: [
              {
                code: '28079',
                name: 'Madrid',
                provinceCode: '28',
                postalCodes: ['28001'],
                isCapital: true,
              },
            ],
          },
        ],
        totalMunicipalities: 1,
      };

      const outputPath = path.join(testOutputDir, 'test-minified.json');
      const result = generateJSON(processedData, outputPath, true);

      expect(result.success).toBe(true);

      // Verificar que el archivo está minificado
      const content = fs.readFileSync(outputPath, 'utf-8');
      
      // No debe contener saltos de línea ni espacios dobles
      expect(content).not.toMatch(/\n/);
      expect(content).not.toMatch(/\r/);
      expect(content).not.toMatch(/  /);
    });

    it('debe incluir metadatos en el archivo generado', () => {
      const processedData: ProcessedData = {
        provinces: [
          {
            code: '28',
            name: 'Madrid',
            autonomousCommunity: 'Comunidad de Madrid',
            coordinates: { lat: 40.4168, lng: -3.7038 },
            municipalities: [],
          },
        ],
        totalMunicipalities: 0,
      };

      const outputPath = path.join(testOutputDir, 'test-metadata.json');
      generateJSON(processedData, outputPath, false);

      const content = fs.readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.version).toBeDefined();
      expect(data.generatedAt).toBeDefined();
      expect(data.source).toBe('INE - Instituto Nacional de Estadística');
      
      // Verificar formato de fecha ISO
      expect(() => new Date(data.generatedAt)).not.toThrow();
    });

    it('debe crear el directorio de salida si no existe', () => {
      const processedData: ProcessedData = {
        provinces: [],
        totalMunicipalities: 0,
      };

      const newDir = path.join(testOutputDir, 'new-dir', 'nested');
      const outputPath = path.join(newDir, 'test.json');
      
      // Asegurarse de que el directorio no existe
      if (fs.existsSync(newDir)) {
        fs.rmSync(newDir, { recursive: true, force: true });
      }

      const result = generateJSON(processedData, outputPath, false);

      expect(result.success).toBe(true);
      expect(fs.existsSync(newDir)).toBe(true);
      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });

  describe('Verificar que el archivo generado cumple con el schema', () => {
    it('debe cumplir con el schema SpainLocationsData', () => {
      const processedData: ProcessedData = {
        provinces: [
          {
            code: '28',
            name: 'Madrid',
            autonomousCommunity: 'Comunidad de Madrid',
            coordinates: { lat: 40.4168, lng: -3.7038 },
            municipalities: [
              {
                code: '28079',
                name: 'Madrid',
                provinceCode: '28',
                postalCodes: ['28001', '28002'],
                isCapital: true,
              },
            ],
          },
        ],
        totalMunicipalities: 1,
      };

      const outputPath = path.join(testOutputDir, 'test-schema.json');
      generateJSON(processedData, outputPath, false);

      const content = fs.readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);

      // Verificar schema completo
      expect(data).toMatchObject({
        version: expect.any(String),
        generatedAt: expect.any(String),
        source: expect.any(String),
        provinces: expect.arrayContaining([
          expect.objectContaining({
            code: expect.any(String),
            name: expect.any(String),
            autonomousCommunity: expect.any(String),
            coordinates: expect.objectContaining({
              lat: expect.any(Number),
              lng: expect.any(Number),
            }),
          }),
        ]),
        municipalities: expect.arrayContaining([
          expect.objectContaining({
            code: expect.any(String),
            name: expect.any(String),
            provinceCode: expect.any(String),
            postalCodes: expect.any(Array),
            isCapital: expect.any(Boolean),
          }),
        ]),
      });
    });

    it('cada provincia debe tener todos los campos requeridos', () => {
      const processedData: ProcessedData = {
        provinces: [
          {
            code: '28',
            name: 'Madrid',
            autonomousCommunity: 'Comunidad de Madrid',
            coordinates: { lat: 40.4168, lng: -3.7038 },
            municipalities: [],
          },
          {
            code: '08',
            name: 'Barcelona',
            autonomousCommunity: 'Catalunya',
            coordinates: { lat: 41.3851, lng: 2.1734 },
            municipalities: [],
          },
        ],
        totalMunicipalities: 0,
      };

      const outputPath = path.join(testOutputDir, 'test-provinces-schema.json');
      generateJSON(processedData, outputPath, false);

      const content = fs.readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);

      data.provinces.forEach((province: any) => {
        expect(province).toHaveProperty('code');
        expect(province).toHaveProperty('name');
        expect(province).toHaveProperty('autonomousCommunity');
        expect(province).toHaveProperty('coordinates');
        expect(province.coordinates).toHaveProperty('lat');
        expect(province.coordinates).toHaveProperty('lng');
        
        expect(typeof province.code).toBe('string');
        expect(typeof province.name).toBe('string');
        expect(typeof province.autonomousCommunity).toBe('string');
        expect(typeof province.coordinates.lat).toBe('number');
        expect(typeof province.coordinates.lng).toBe('number');
      });
    });

    it('cada municipio debe tener todos los campos requeridos', () => {
      const processedData: ProcessedData = {
        provinces: [
          {
            code: '28',
            name: 'Madrid',
            autonomousCommunity: 'Comunidad de Madrid',
            coordinates: { lat: 40.4168, lng: -3.7038 },
            municipalities: [
              {
                code: '28079',
                name: 'Madrid',
                provinceCode: '28',
                postalCodes: ['28001', '28002'],
                isCapital: true,
              },
              {
                code: '28006',
                name: 'Alcobendas',
                provinceCode: '28',
                postalCodes: ['28100'],
                isCapital: false,
              },
            ],
          },
        ],
        totalMunicipalities: 2,
      };

      const outputPath = path.join(testOutputDir, 'test-municipalities-schema.json');
      generateJSON(processedData, outputPath, false);

      const content = fs.readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(content);

      data.municipalities.forEach((municipality: any) => {
        expect(municipality).toHaveProperty('code');
        expect(municipality).toHaveProperty('name');
        expect(municipality).toHaveProperty('provinceCode');
        expect(municipality).toHaveProperty('postalCodes');
        expect(municipality).toHaveProperty('isCapital');
        
        expect(typeof municipality.code).toBe('string');
        expect(typeof municipality.name).toBe('string');
        expect(typeof municipality.provinceCode).toBe('string');
        expect(Array.isArray(municipality.postalCodes)).toBe(true);
        expect(typeof municipality.isCapital).toBe('boolean');
        
        // Verificar que los códigos postales tienen formato válido
        municipality.postalCodes.forEach((postalCode: string) => {
          expect(postalCode).toMatch(/^\d{5}$/);
        });
      });
    });
  });
});
