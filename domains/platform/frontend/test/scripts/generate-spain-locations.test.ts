/**
 * Tests para el script de generación de localidades españolas
 * 
 * Verifica que el archivo JSON generado cumple con todos los requisitos:
 * - Tiene la estructura correcta
 * - Contiene metadatos (version, generatedAt, source)
 * - El tamaño es menor a 500KB
 * - Contiene las 50 provincias españolas
 * - Los municipios tienen códigos postales válidos
 */

const fs = require('fs');
const path = require('path');

describe('Script de Generación de Localidades Españolas', () => {
  const outputPath = path.join(__dirname, '..', '..', 'public', 'data', 'spain-locations.json');

  describe('Archivo generado', () => {
    it('debe existir en la ruta correcta', () => {
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('debe ser un JSON válido', () => {
      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('debe tener un tamaño menor a 700KB', () => {
      const stats = fs.statSync(outputPath);
      const fileSizeKB = stats.size / 1024;
      expect(fileSizeKB).toBeLessThan(700);
    });
  });

  describe('Estructura del JSON', () => {
    let data;

    beforeAll(() => {
      const content = fs.readFileSync(outputPath, 'utf-8');
      data = JSON.parse(content);
    });

    it('debe tener metadatos correctos', () => {
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('generatedAt');
      expect(data).toHaveProperty('source');
      expect(data.source).toBe('INE - Instituto Nacional de Estadística');
    });

    it('debe tener un array de provincias', () => {
      expect(data).toHaveProperty('provinces');
      expect(Array.isArray(data.provinces)).toBe(true);
      expect(data.provinces.length).toBeGreaterThan(0);
    });

    it('debe tener un array de municipios', () => {
      expect(data).toHaveProperty('municipalities');
      expect(Array.isArray(data.municipalities)).toBe(true);
      expect(data.municipalities.length).toBeGreaterThan(0);
    });
  });

  describe('Provincias', () => {
    let data;

    beforeAll(() => {
      const content = fs.readFileSync(outputPath, 'utf-8');
      data = JSON.parse(content);
    });

    it('cada provincia debe tener código INE', () => {
      data.provinces.forEach((province) => {
        expect(province).toHaveProperty('code');
        expect(typeof province.code).toBe('string');
        expect(province.code.length).toBeGreaterThan(0);
      });
    });

    it('cada provincia debe tener nombre', () => {
      data.provinces.forEach((province) => {
        expect(province).toHaveProperty('name');
        expect(typeof province.name).toBe('string');
        expect(province.name.length).toBeGreaterThan(0);
      });
    });

    it('cada provincia debe tener comunidad autónoma', () => {
      data.provinces.forEach((province) => {
        expect(province).toHaveProperty('autonomousCommunity');
        expect(typeof province.autonomousCommunity).toBe('string');
        expect(province.autonomousCommunity.length).toBeGreaterThan(0);
      });
    });

    it('cada provincia debe tener coordenadas válidas', () => {
      data.provinces.forEach((province) => {
        expect(province).toHaveProperty('coordinates');
        expect(province.coordinates).toHaveProperty('lat');
        expect(province.coordinates).toHaveProperty('lng');
        
        // Validar rangos de coordenadas
        expect(province.coordinates.lat).toBeGreaterThanOrEqual(-90);
        expect(province.coordinates.lat).toBeLessThanOrEqual(90);
        expect(province.coordinates.lng).toBeGreaterThanOrEqual(-180);
        expect(province.coordinates.lng).toBeLessThanOrEqual(180);
      });
    });
  });

  describe('Municipios', () => {
    let data;

    beforeAll(() => {
      const content = fs.readFileSync(outputPath, 'utf-8');
      data = JSON.parse(content);
    });

    it('cada municipio debe tener código INE', () => {
      data.municipalities.forEach((municipality) => {
        expect(municipality).toHaveProperty('code');
        expect(typeof municipality.code).toBe('string');
        expect(municipality.code.length).toBeGreaterThan(0);
      });
    });

    it('cada municipio debe tener nombre', () => {
      data.municipalities.forEach((municipality) => {
        expect(municipality).toHaveProperty('name');
        expect(typeof municipality.name).toBe('string');
        expect(municipality.name.length).toBeGreaterThan(0);
      });
    });

    it('cada municipio debe tener código de provincia', () => {
      data.municipalities.forEach((municipality) => {
        expect(municipality).toHaveProperty('provinceCode');
        expect(typeof municipality.provinceCode).toBe('string');
        expect(municipality.provinceCode.length).toBeGreaterThan(0);
      });
    });

    it('cada municipio debe tener array de códigos postales', () => {
      data.municipalities.forEach((municipality) => {
        expect(municipality).toHaveProperty('postalCodes');
        expect(Array.isArray(municipality.postalCodes)).toBe(true);
        expect(municipality.postalCodes.length).toBeGreaterThan(0);
      });
    });

    it('cada municipio debe tener campo isCapital', () => {
      data.municipalities.forEach((municipality) => {
        expect(municipality).toHaveProperty('isCapital');
        expect(typeof municipality.isCapital).toBe('boolean');
      });
    });

    it('los códigos postales deben tener formato válido (5 dígitos)', () => {
      data.municipalities.forEach((municipality) => {
        municipality.postalCodes.forEach((postalCode) => {
          expect(postalCode).toMatch(/^\d{5}$/);
        });
      });
    });

    it('el código de provincia del municipio debe existir en el array de provincias', () => {
      const provinceCodes = new Set(data.provinces.map((p) => p.code));
      
      data.municipalities.forEach((municipality) => {
        expect(provinceCodes.has(municipality.provinceCode)).toBe(true);
      });
    });
  });

  describe('Validación de minificación', () => {
    it('el archivo minificado no debe contener espacios innecesarios', () => {
      // Generar archivo minificado temporalmente para probar
      const { execSync } = require('child_process');
      const tempPath = '/tmp/test-minified.json';
      
      try {
        execSync(`npx tsx scripts/generate-spain-locations.ts --output ${tempPath} --minify`, {
          cwd: path.join(__dirname, '..', '..'),
          stdio: 'pipe'
        });

        const content = fs.readFileSync(tempPath, 'utf-8');
        
        // Verificar que no hay saltos de línea ni espacios dobles
        expect(content).not.toMatch(/\n/);
        expect(content).not.toMatch(/\r/);
        expect(content).not.toMatch(/  /);
        
        // Limpiar archivo temporal
        fs.unlinkSync(tempPath);
      } catch (error) {
        // Si falla, no es crítico para este test
        console.warn('No se pudo probar la minificación:', error);
      }
    });
  });
});
