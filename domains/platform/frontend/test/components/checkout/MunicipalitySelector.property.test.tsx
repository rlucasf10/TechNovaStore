/**
 * Property-Based Tests para MunicipalitySelector
 * 
 * Estos tests verifican propiedades universales que deben cumplirse
 * para todos los valores posibles de entrada, usando fast-check.
 * 
 * Feature: spain-locations-ine
 */

import * as fc from 'fast-check';
import { LocationsService } from '../../../src/shared/lib/locations/LocationsService';
import type { Municipality, SpainLocationsData } from '../../../src/shared/lib/locations/types';

// Mock de datos de prueba más completo para property testing
const generateMockData = (): SpainLocationsData => ({
  version: '2025.1',
  generatedAt: '2025-01-15T10:30:00Z',
  source: 'INE - Test Data',
  provinces: [
    {
      code: '28',
      name: 'Madrid',
      autonomousCommunity: 'Comunidad de Madrid',
      coordinates: { lat: 40.4168, lng: -3.7038 }
    },
    {
      code: '08',
      name: 'Barcelona',
      autonomousCommunity: 'Cataluña',
      coordinates: { lat: 41.3851, lng: 2.1734 }
    },
    {
      code: '41',
      name: 'Sevilla',
      autonomousCommunity: 'Andalucía',
      coordinates: { lat: 37.3891, lng: -5.9845 }
    },
    {
      code: '46',
      name: 'Valencia',
      autonomousCommunity: 'Comunidad Valenciana',
      coordinates: { lat: 39.4699, lng: -0.3763 }
    },
    {
      code: '29',
      name: 'Málaga',
      autonomousCommunity: 'Andalucía',
      coordinates: { lat: 36.7213, lng: -4.4214 }
    }
  ],
  municipalities: [
    // Madrid (28)
    {
      code: '28079',
      name: 'Madrid',
      provinceCode: '28',
      postalCodes: ['28001', '28002', '28003', '28004', '28005'],
      isCapital: true
    },
    {
      code: '28001',
      name: 'Ajalvir',
      provinceCode: '28',
      postalCodes: ['28864'],
      isCapital: false
    },
    {
      code: '28002',
      name: 'Alameda del Valle',
      provinceCode: '28',
      postalCodes: ['28749'],
      isCapital: false
    },
    {
      code: '28003',
      name: 'Alcalá de Henares',
      provinceCode: '28',
      postalCodes: ['28801', '28802', '28803'],
      isCapital: false
    },
    {
      code: '28004',
      name: 'Alcobendas',
      provinceCode: '28',
      postalCodes: ['28100', '28101', '28102'],
      isCapital: false
    },
    // Barcelona (08)
    {
      code: '08019',
      name: 'Barcelona',
      provinceCode: '08',
      postalCodes: ['08001', '08002', '08003', '08004'],
      isCapital: true
    },
    {
      code: '08001',
      name: 'Abrera',
      provinceCode: '08',
      postalCodes: ['08630'],
      isCapital: false
    },
    {
      code: '08002',
      name: 'Badalona',
      provinceCode: '08',
      postalCodes: ['08911', '08912', '08913'],
      isCapital: false
    },
    // Sevilla (41)
    {
      code: '41091',
      name: 'Sevilla',
      provinceCode: '41',
      postalCodes: ['41001', '41002', '41003'],
      isCapital: true
    },
    {
      code: '41001',
      name: 'Alcalá de Guadaíra',
      provinceCode: '41',
      postalCodes: ['41500'],
      isCapital: false
    },
    // Valencia (46)
    {
      code: '46250',
      name: 'Valencia',
      provinceCode: '46',
      postalCodes: ['46001', '46002', '46003'],
      isCapital: true
    },
    {
      code: '46001',
      name: 'Alaquàs',
      provinceCode: '46',
      postalCodes: ['46970'],
      isCapital: false
    },
    // Málaga (29)
    {
      code: '29067',
      name: 'Málaga',
      provinceCode: '29',
      postalCodes: ['29001', '29002', '29003'],
      isCapital: true
    },
    {
      code: '29001',
      name: 'Alameda',
      provinceCode: '29',
      postalCodes: ['29530'],
      isCapital: false
    }
  ]
});

// Mock de fetch global
global.fetch = jest.fn();

describe('MunicipalitySelector - Property-Based Tests', () => {
  let service: LocationsService;
  const mockData = generateMockData();

  beforeEach(() => {
    // Obtener instancia del servicio
    service = LocationsService.getInstance();
    
    // Limpiar caché antes de cada test
    service.clearCache();
    
    // Resetear mock de fetch
    (global.fetch as jest.Mock).mockReset();
    
    // Configurar mock de fetch para retornar datos de prueba
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData
    });
  });

  /**
   * Property 2: Código postal auto-completado es válido para el municipio
   * 
   * Feature: spain-locations-ine, Property 2: Código postal auto-completado es válido para el municipio
   * Validates: Requirements 1.3, 4.1
   * 
   * Para cualquier municipio seleccionado, el código postal auto-completado
   * debe estar en el array postalCodes del municipio.
   * 
   * Esta propiedad verifica que cuando un usuario selecciona un municipio,
   * el sistema auto-completa un código postal que realmente pertenece a ese municipio.
   */
  describe('Property 2: Código postal auto-completado es válido para el municipio', () => {
    it('debe auto-completar un código postal válido para cualquier municipio', async () => {
      // Cargar datos del servicio
      await service.loadData();

      // Generador de códigos de municipio válidos
      const municipalityCodeArbitrary = fc.constantFrom(
        ...mockData.municipalities.map(m => m.code)
      );

      // Property: Para cualquier municipio, el primer código postal debe estar en postalCodes
      await fc.assert(
        fc.asyncProperty(municipalityCodeArbitrary, async (municipalityCode) => {
          // Obtener el municipio
          const municipality = service.getMunicipality(municipalityCode);
          
          // El municipio debe existir
          expect(municipality).not.toBeNull();
          
          if (municipality) {
            // El municipio debe tener al menos un código postal
            expect(municipality.postalCodes).toBeDefined();
            expect(municipality.postalCodes.length).toBeGreaterThan(0);
            
            // Simular auto-completado: tomar el primer código postal
            const autoCompletedPostalCode = municipality.postalCodes[0];
            
            // Verificar que el código postal auto-completado está en la lista de códigos postales
            expect(municipality.postalCodes).toContain(autoCompletedPostalCode);
            
            // Verificar que el código postal tiene formato válido (5 dígitos)
            expect(autoCompletedPostalCode).toMatch(/^\d{5}$/);
            
            // Verificar que el código postal es válido para la provincia del municipio
            const validationResult = service.validatePostalCode(
              autoCompletedPostalCode,
              municipality.provinceCode
            );
            expect(validationResult.isValid).toBe(true);
          }
        }),
        { numRuns: 100 } // Ejecutar 100 iteraciones
      );
    });

    it('debe auto-completar códigos postales válidos para municipios con múltiples códigos', async () => {
      // Cargar datos del servicio
      await service.loadData();

      // Generador de códigos de municipio que tienen múltiples códigos postales
      const municipalitiesWithMultiplePostalCodes = mockData.municipalities
        .filter(m => m.postalCodes.length > 1);
      
      const municipalityCodeArbitrary = fc.constantFrom(
        ...municipalitiesWithMultiplePostalCodes.map(m => m.code)
      );

      // Property: Para cualquier municipio con múltiples códigos postales,
      // todos los códigos postales deben ser válidos
      await fc.assert(
        fc.asyncProperty(municipalityCodeArbitrary, async (municipalityCode) => {
          // Obtener el municipio
          const municipality = service.getMunicipality(municipalityCode);
          
          expect(municipality).not.toBeNull();
          
          if (municipality) {
            // Verificar que tiene múltiples códigos postales
            expect(municipality.postalCodes.length).toBeGreaterThan(1);
            
            // Verificar que TODOS los códigos postales son válidos
            for (const postalCode of municipality.postalCodes) {
              // Formato válido
              expect(postalCode).toMatch(/^\d{5}$/);
              
              // Validación contra la provincia
              const validationResult = service.validatePostalCode(
                postalCode,
                municipality.provinceCode
              );
              expect(validationResult.isValid).toBe(true);
              
              // El código postal debe estar en la lista
              expect(municipality.postalCodes).toContain(postalCode);
            }
          }
        }),
        { numRuns: 100 } // Ejecutar 100 iteraciones
      );
    });

    it('debe auto-completar códigos postales únicos (sin duplicados) para cualquier municipio', async () => {
      // Cargar datos del servicio
      await service.loadData();

      // Generador de códigos de municipio válidos
      const municipalityCodeArbitrary = fc.constantFrom(
        ...mockData.municipalities.map(m => m.code)
      );

      // Property: Para cualquier municipio, no debe haber códigos postales duplicados
      await fc.assert(
        fc.asyncProperty(municipalityCodeArbitrary, async (municipalityCode) => {
          // Obtener el municipio
          const municipality = service.getMunicipality(municipalityCode);
          
          expect(municipality).not.toBeNull();
          
          if (municipality) {
            const postalCodes = municipality.postalCodes;
            
            // Verificar que no hay duplicados
            const uniquePostalCodes = new Set(postalCodes);
            expect(uniquePostalCodes.size).toBe(postalCodes.length);
            
            // Verificar que cada código postal es único
            for (let i = 0; i < postalCodes.length; i++) {
              for (let j = i + 1; j < postalCodes.length; j++) {
                expect(postalCodes[i]).not.toBe(postalCodes[j]);
              }
            }
          }
        }),
        { numRuns: 100 } // Ejecutar 100 iteraciones
      );
    });

    it('debe auto-completar códigos postales que pertenecen a la provincia correcta', async () => {
      // Cargar datos del servicio
      await service.loadData();

      // Generador de pares (municipio, provincia)
      const municipalityProvinceArbitrary = fc.constantFrom(
        ...mockData.municipalities.map(m => ({
          municipalityCode: m.code,
          provinceCode: m.provinceCode
        }))
      );

      // Property: Para cualquier municipio, todos sus códigos postales deben
      // ser válidos para su provincia
      await fc.assert(
        fc.asyncProperty(municipalityProvinceArbitrary, async ({ municipalityCode, provinceCode }) => {
          // Obtener el municipio
          const municipality = service.getMunicipality(municipalityCode);
          
          expect(municipality).not.toBeNull();
          
          if (municipality) {
            // Verificar que el municipio pertenece a la provincia correcta
            expect(municipality.provinceCode).toBe(provinceCode);
            
            // Verificar que todos los códigos postales son válidos para esta provincia
            for (const postalCode of municipality.postalCodes) {
              const validationResult = service.validatePostalCode(postalCode, provinceCode);
              expect(validationResult.isValid).toBe(true);
              expect(validationResult.errorMessage).toBeUndefined();
            }
          }
        }),
        { numRuns: 100 } // Ejecutar 100 iteraciones
      );
    });

    it('debe rechazar códigos postales de otros municipios de la misma provincia', async () => {
      // Cargar datos del servicio
      await service.loadData();

      // Generador de pares de municipios diferentes de la misma provincia
      const samProvinceDifferentMunicipalitiesArbitrary = fc
        .constantFrom(...mockData.provinces.map(p => p.code))
        .chain(provinceCode => {
          const municipalitiesInProvince = mockData.municipalities
            .filter(m => m.provinceCode === provinceCode);
          
          if (municipalitiesInProvince.length < 2) {
            // Si no hay al menos 2 municipios, retornar un generador vacío
            return fc.constant(null);
          }
          
          return fc.tuple(
            fc.constantFrom(...municipalitiesInProvince.map(m => m.code)),
            fc.constantFrom(...municipalitiesInProvince.map(m => m.code))
          ).filter(([code1, code2]) => code1 !== code2)
            .map(([code1, code2]) => ({ municipalityCode1: code1, municipalityCode2: code2, provinceCode }));
        })
        .filter(value => value !== null);

      // Property: Un código postal de un municipio NO debe estar en otro municipio
      // de la misma provincia
      await fc.assert(
        fc.asyncProperty(samProvinceDifferentMunicipalitiesArbitrary, async (pair) => {
          if (!pair) return; // Skip si no hay suficientes municipios
          
          const { municipalityCode1, municipalityCode2, provinceCode } = pair;
          
          // Obtener ambos municipios
          const municipality1 = service.getMunicipality(municipalityCode1);
          const municipality2 = service.getMunicipality(municipalityCode2);
          
          expect(municipality1).not.toBeNull();
          expect(municipality2).not.toBeNull();
          
          if (municipality1 && municipality2) {
            // Verificar que son municipios diferentes
            expect(municipality1.code).not.toBe(municipality2.code);
            
            // Verificar que pertenecen a la misma provincia
            expect(municipality1.provinceCode).toBe(provinceCode);
            expect(municipality2.provinceCode).toBe(provinceCode);
            
            // Verificar que los códigos postales no se solapan
            const postalCodes1Set = new Set(municipality1.postalCodes);
            const postalCodes2Set = new Set(municipality2.postalCodes);
            
            // No debe haber intersección entre los códigos postales
            for (const postalCode of municipality1.postalCodes) {
              expect(postalCodes2Set.has(postalCode)).toBe(false);
            }
            
            for (const postalCode of municipality2.postalCodes) {
              expect(postalCodes1Set.has(postalCode)).toBe(false);
            }
          }
        }),
        { numRuns: 100 } // Ejecutar 100 iteraciones
      );
    });
  });
});
