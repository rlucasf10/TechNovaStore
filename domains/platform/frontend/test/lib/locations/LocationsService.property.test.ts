/**
 * Property-Based Tests para LocationsService
 * 
 * Estos tests verifican propiedades universales que deben cumplirse
 * para todos los valores de entrada posibles, usando fast-check.
 * 
 * Cada test ejecuta 100 iteraciones con valores aleatorios generados.
 */

import * as fc from 'fast-check';
import { LocationsService } from '@/shared/lib/locations/LocationsService';
import type { SpainLocationsData, Province, Municipality } from '@/shared/lib/locations/types';

// Mock de datos de prueba más completo para property tests
const createMockData = (): SpainLocationsData => ({
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
      autonomousCommunity: 'Comunitat Valenciana',
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
    // Madrid
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
    // Barcelona
    {
      code: '08019',
      name: 'Barcelona',
      provinceCode: '08',
      postalCodes: ['08001', '08002', '08003', '08004', '08005'],
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
      code: '08015',
      name: 'Badalona',
      provinceCode: '08',
      postalCodes: ['08911', '08912', '08913'],
      isCapital: false
    },
    {
      code: '08121',
      name: "L'Hospitalet de Llobregat",
      provinceCode: '08',
      postalCodes: ['08901', '08902'],
      isCapital: false
    },
    // Sevilla
    {
      code: '41091',
      name: 'Sevilla',
      provinceCode: '41',
      postalCodes: ['41001', '41002', '41003', '41004'],
      isCapital: true
    },
    {
      code: '41001',
      name: 'Aguadulce',
      provinceCode: '41',
      postalCodes: ['41550'],
      isCapital: false
    },
    {
      code: '41002',
      name: 'Alanís',
      provinceCode: '41',
      postalCodes: ['41359'],
      isCapital: false
    },
    // Valencia
    {
      code: '46250',
      name: 'Valencia',
      provinceCode: '46',
      postalCodes: ['46001', '46002', '46003', '46004', '46005'],
      isCapital: true
    },
    {
      code: '46001',
      name: 'Ademuz',
      provinceCode: '46',
      postalCodes: ['46140'],
      isCapital: false
    },
    {
      code: '46002',
      name: 'Ador',
      provinceCode: '46',
      postalCodes: ['46729'],
      isCapital: false
    },
    // Málaga
    {
      code: '29067',
      name: 'Málaga',
      provinceCode: '29',
      postalCodes: ['29001', '29002', '29003', '29004'],
      isCapital: true
    },
    {
      code: '29001',
      name: 'Alameda',
      provinceCode: '29',
      postalCodes: ['29530'],
      isCapital: false
    },
    {
      code: '29002',
      name: 'Alcaucín',
      provinceCode: '29',
      postalCodes: ['29711'],
      isCapital: false
    }
  ]
});

// Mock de fetch global
global.fetch = jest.fn();

describe('LocationsService - Property-Based Tests', () => {
  let service: LocationsService;
  let mockData: SpainLocationsData;

  beforeEach(async () => {
    // Obtener instancia del servicio
    service = LocationsService.getInstance();
    
    // Limpiar caché antes de cada test
    service.clearCache();
    
    // Crear datos mock
    mockData = createMockData();
    
    // Resetear mock de fetch
    (global.fetch as jest.Mock).mockReset();
    
    // Configurar mock de fetch para retornar datos de prueba
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData
    });

    // Cargar datos
    await service.loadData();
  });

  /**
   * Property 1: Municipios filtrados pertenecen a la provincia seleccionada
   * Feature: spain-locations-ine, Property 1: Municipios filtrados pertenecen a la provincia seleccionada
   * Validates: Requirements 1.2
   */
  describe('Property 1: Municipios filtrados pertenecen a la provincia seleccionada', () => {
    it('debe retornar solo municipios que pertenecen a la provincia seleccionada', () => {
      // Generador de códigos de provincia válidos
      const provinceCodeArbitrary = fc.constantFrom(
        ...mockData.provinces.map(p => p.code)
      );

      fc.assert(
        fc.property(provinceCodeArbitrary, (provinceCode) => {
          // Obtener municipios de la provincia
          const municipalities = service.getMunicipalitiesByProvince(provinceCode);

          // Verificar que todos los municipios tienen el mismo provinceCode
          const allBelongToProvince = municipalities.every(
            (municipality) => municipality.provinceCode === provinceCode
          );

          // La propiedad debe cumplirse siempre
          expect(allBelongToProvince).toBe(true);
        }),
        { numRuns: 100 } // Ejecutar 100 iteraciones
      );
    });

    it('debe retornar array vacío para provincias sin municipios', () => {
      // Generador de códigos de provincia inválidos
      const invalidProvinceCodeArbitrary = fc.string({ minLength: 2, maxLength: 2 })
        .filter(code => !mockData.provinces.some(p => p.code === code));

      fc.assert(
        fc.property(invalidProvinceCodeArbitrary, (provinceCode) => {
          // Obtener municipios de provincia inexistente
          const municipalities = service.getMunicipalitiesByProvince(provinceCode);

          // Debe retornar array vacío
          expect(municipalities).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('debe retornar municipios ordenados alfabéticamente', () => {
      const provinceCodeArbitrary = fc.constantFrom(
        ...mockData.provinces.map(p => p.code)
      );

      fc.assert(
        fc.property(provinceCodeArbitrary, (provinceCode) => {
          const municipalities = service.getMunicipalitiesByProvince(provinceCode);

          // Verificar que están ordenados alfabéticamente
          for (let i = 0; i < municipalities.length - 1; i++) {
            const comparison = municipalities[i].name.localeCompare(
              municipalities[i + 1].name,
              'es'
            );
            expect(comparison).toBeLessThanOrEqual(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('debe retornar la misma referencia en llamadas subsecuentes (memoización)', () => {
      const provinceCodeArbitrary = fc.constantFrom(
        ...mockData.provinces.map(p => p.code)
      );

      fc.assert(
        fc.property(provinceCodeArbitrary, (provinceCode) => {
          const municipalities1 = service.getMunicipalitiesByProvince(provinceCode);
          const municipalities2 = service.getMunicipalitiesByProvince(provinceCode);

          // Debe retornar la misma referencia (memoización)
          expect(municipalities1).toBe(municipalities2);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Código postal auto-completado es válido para el municipio
   * Feature: spain-locations-ine, Property 2: Código postal auto-completado es válido para el municipio
   * Validates: Requirements 1.3, 4.1
   */
  describe('Property 2: Código postal auto-completado es válido para el municipio', () => {
    it('debe retornar un código postal que está en la lista de postalCodes del municipio', () => {
      // Generador de códigos de municipio válidos
      const municipalityCodeArbitrary = fc.constantFrom(
        ...mockData.municipalities.map(m => m.code)
      );

      fc.assert(
        fc.property(municipalityCodeArbitrary, (municipalityCode) => {
          // Obtener el municipio
          const municipality = service.getMunicipality(municipalityCode);

          // El municipio debe existir
          expect(municipality).not.toBeNull();

          if (municipality) {
            // Obtener los códigos postales del municipio
            const postalCodes = service.getPostalCodesByMunicipality(municipalityCode);

            // Debe haber al menos un código postal
            expect(postalCodes.length).toBeGreaterThan(0);

            // El primer código postal (que sería el auto-completado) debe estar en la lista
            const autoCompletedPostalCode = postalCodes[0];
            expect(municipality.postalCodes).toContain(autoCompletedPostalCode);

            // Todos los códigos postales retornados deben estar en la lista del municipio
            postalCodes.forEach(postalCode => {
              expect(municipality.postalCodes).toContain(postalCode);
            });
          }
        }),
        { numRuns: 100 } // Ejecutar 100 iteraciones
      );
    });

    it('debe retornar códigos postales válidos para municipios con múltiples códigos', () => {
      // Generador de municipios que tienen múltiples códigos postales
      const municipalitiesWithMultiplePostalCodes = mockData.municipalities
        .filter(m => m.postalCodes.length > 1);

      // Solo ejecutar si hay municipios con múltiples códigos postales
      if (municipalitiesWithMultiplePostalCodes.length > 0) {
        const municipalityCodeArbitrary = fc.constantFrom(
          ...municipalitiesWithMultiplePostalCodes.map(m => m.code)
        );

        fc.assert(
          fc.property(municipalityCodeArbitrary, (municipalityCode) => {
            // Obtener el municipio
            const municipality = service.getMunicipality(municipalityCode);

            expect(municipality).not.toBeNull();

            if (municipality) {
              // Obtener todos los códigos postales
              const postalCodes = service.getPostalCodesByMunicipality(municipalityCode);

              // Debe tener múltiples códigos postales
              expect(postalCodes.length).toBeGreaterThan(1);

              // Todos deben ser válidos para el municipio
              postalCodes.forEach(postalCode => {
                expect(municipality.postalCodes).toContain(postalCode);
              });

              // Verificar que son exactamente los mismos códigos (sin duplicados)
              expect(postalCodes.length).toBe(municipality.postalCodes.length);
            }
          }),
          { numRuns: 100 }
        );
      }
    });

    it('debe lanzar error para municipios inexistentes', () => {
      // Generador de códigos de municipio inválidos
      const invalidMunicipalityCodeArbitrary = fc.string({ minLength: 5, maxLength: 5 })
        .filter(code => !mockData.municipalities.some(m => m.code === code));

      fc.assert(
        fc.property(invalidMunicipalityCodeArbitrary, (municipalityCode) => {
          // Intentar obtener códigos postales de municipio inexistente
          expect(() => {
            service.getPostalCodesByMunicipality(municipalityCode);
          }).toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('debe retornar el mismo array de códigos postales en llamadas subsecuentes', () => {
      const municipalityCodeArbitrary = fc.constantFrom(
        ...mockData.municipalities.map(m => m.code)
      );

      fc.assert(
        fc.property(municipalityCodeArbitrary, (municipalityCode) => {
          // Obtener códigos postales dos veces
          const postalCodes1 = service.getPostalCodesByMunicipality(municipalityCode);
          const postalCodes2 = service.getPostalCodesByMunicipality(municipalityCode);

          // Deben ser el mismo array (referencia)
          expect(postalCodes1).toBe(postalCodes2);

          // Y tener el mismo contenido
          expect(JSON.stringify(postalCodes1)).toBe(JSON.stringify(postalCodes2));
        }),
        { numRuns: 100 }
      );
    });

    it('debe validar que los códigos postales auto-completados son válidos para la provincia', () => {
      const municipalityCodeArbitrary = fc.constantFrom(
        ...mockData.municipalities.map(m => m.code)
      );

      fc.assert(
        fc.property(municipalityCodeArbitrary, (municipalityCode) => {
          // Obtener el municipio
          const municipality = service.getMunicipality(municipalityCode);

          expect(municipality).not.toBeNull();

          if (municipality) {
            // Obtener códigos postales
            const postalCodes = service.getPostalCodesByMunicipality(municipalityCode);

            // Cada código postal debe ser válido para la provincia del municipio
            postalCodes.forEach(postalCode => {
              const validationResult = service.validatePostalCode(
                postalCode,
                municipality.provinceCode
              );

              expect(validationResult.isValid).toBe(true);
              expect(validationResult.errorMessage).toBeUndefined();
            });
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Validación de código postal detecta inconsistencias
   * Feature: spain-locations-ine, Property 8: Validación de código postal detecta inconsistencias
   * Validates: Requirements 4.2, 4.3
   */
  describe('Property 8: Validación de código postal detecta inconsistencias', () => {
    it('debe rechazar códigos postales que no pertenecen a la provincia seleccionada', () => {
      // Generador de pares (código postal, provincia) que NO coinciden
      const mismatchedPairArbitrary = fc.tuple(
        // Código postal de una provincia
        fc.constantFrom(...mockData.municipalities.flatMap(m => m.postalCodes)),
        // Código de provincia diferente
        fc.constantFrom(...mockData.provinces.map(p => p.code))
      ).filter(([postalCode, provinceCode]) => {
        // Filtrar para asegurar que el código postal NO pertenece a la provincia
        const municipalitiesInProvince = mockData.municipalities.filter(
          m => m.provinceCode === provinceCode
        );
        const belongsToProvince = municipalitiesInProvince.some(
          m => m.postalCodes.includes(postalCode)
        );
        return !belongsToProvince;
      });

      fc.assert(
        fc.property(mismatchedPairArbitrary, ([postalCode, provinceCode]) => {
          // Validar código postal contra provincia incorrecta
          const result = service.validatePostalCode(postalCode, provinceCode);

          // Debe retornar false (inválido)
          expect(result.isValid).toBe(false);
          
          // Debe tener un mensaje de error descriptivo
          expect(result.errorMessage).toBeDefined();
          expect(result.errorMessage).toContain(postalCode);
        }),
        { numRuns: 100 }
      );
    });

    it('debe aceptar códigos postales que SÍ pertenecen a la provincia seleccionada', () => {
      // Generador de pares (código postal, provincia) que SÍ coinciden
      const matchedPairArbitrary = fc.constantFrom(
        ...mockData.municipalities.flatMap(municipality =>
          municipality.postalCodes.map(postalCode => ({
            postalCode,
            provinceCode: municipality.provinceCode
          }))
        )
      );

      fc.assert(
        fc.property(matchedPairArbitrary, ({ postalCode, provinceCode }) => {
          // Validar código postal contra provincia correcta
          const result = service.validatePostalCode(postalCode, provinceCode);

          // Debe retornar true (válido)
          expect(result.isValid).toBe(true);
          
          // No debe tener mensaje de error
          expect(result.errorMessage).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('debe rechazar códigos postales con formato inválido', () => {
      // Generador de códigos postales con formato inválido
      const invalidFormatArbitrary = fc.oneof(
        // Menos de 5 dígitos
        fc.string({ minLength: 1, maxLength: 4 }).filter(s => /^\d+$/.test(s)),
        // Más de 5 dígitos
        fc.string({ minLength: 6, maxLength: 10 }).filter(s => /^\d+$/.test(s)),
        // Con caracteres no numéricos
        fc.string({ minLength: 5, maxLength: 5 }).filter(s => !/^\d{5}$/.test(s)),
        // String vacío
        fc.constant(''),
        // Solo espacios
        fc.constant('     ')
      );

      const provinceCodeArbitrary = fc.constantFrom(
        ...mockData.provinces.map(p => p.code)
      );

      fc.assert(
        fc.property(
          invalidFormatArbitrary,
          provinceCodeArbitrary,
          (postalCode, provinceCode) => {
            // Validar código postal con formato inválido
            const result = service.validatePostalCode(postalCode, provinceCode);

            // Debe retornar false (inválido)
            expect(result.isValid).toBe(false);
            
            // Debe tener un mensaje de error
            expect(result.errorMessage).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe rechazar validación sin provincia seleccionada', () => {
      // Generador de códigos postales válidos
      const validPostalCodeArbitrary = fc.constantFrom(
        ...mockData.municipalities.flatMap(m => m.postalCodes)
      );

      // Generador de provincias vacías o inválidas
      const emptyProvinceArbitrary = fc.constantFrom('', '   ', null as any, undefined as any);

      fc.assert(
        fc.property(
          validPostalCodeArbitrary,
          emptyProvinceArbitrary,
          (postalCode, provinceCode) => {
            // Validar código postal sin provincia
            const result = service.validatePostalCode(postalCode, provinceCode);

            // Debe retornar false (inválido)
            expect(result.isValid).toBe(false);
            
            // Debe tener un mensaje de error sobre provincia
            expect(result.errorMessage).toBeDefined();
            expect(result.errorMessage?.toLowerCase()).toContain('provincia');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe validar consistentemente el mismo par (código postal, provincia)', () => {
      // Generador de pares aleatorios
      const pairArbitrary = fc.tuple(
        fc.constantFrom(...mockData.municipalities.flatMap(m => m.postalCodes)),
        fc.constantFrom(...mockData.provinces.map(p => p.code))
      );

      fc.assert(
        fc.property(pairArbitrary, ([postalCode, provinceCode]) => {
          // Validar dos veces el mismo par
          const result1 = service.validatePostalCode(postalCode, provinceCode);
          const result2 = service.validatePostalCode(postalCode, provinceCode);

          // Debe retornar el mismo resultado (consistencia)
          expect(result1.isValid).toBe(result2.isValid);
          expect(result1.errorMessage).toBe(result2.errorMessage);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Búsqueda filtra correctamente
   * Feature: spain-locations-ine, Property 11: Búsqueda filtra correctamente
   * Validates: Requirements 6.3
   */
  describe('Property 11: Búsqueda filtra correctamente', () => {
    it('debe retornar solo municipios que contienen el texto de búsqueda (case-insensitive)', async () => {
      // Generador de textos de búsqueda basados en nombres reales de municipios
      const searchQueryArbitrary = fc.constantFrom(
        // Búsquedas completas
        'madrid', 'barcelona', 'sevilla', 'valencia', 'málaga',
        // Búsquedas parciales
        'ala', 'bad', 'hos', 'agu', 'ade',
        // Búsquedas con mayúsculas
        'MADRID', 'Barcelona', 'SeVilla',
        // Búsquedas de una letra
        'a', 'b', 'm', 's', 'v'
      );

      await fc.assert(
        fc.asyncProperty(searchQueryArbitrary, async (query) => {
          // Realizar búsqueda
          const results = await service.searchMunicipalities(query);

          // Normalizar query para comparación case-insensitive
          const normalizedQuery = query.toLowerCase();

          // Verificar que todos los resultados contienen el texto de búsqueda
          const allContainQuery = results.every(
            (municipality) => municipality.name.toLowerCase().includes(normalizedQuery)
          );

          expect(allContainQuery).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('debe limitar resultados a máximo 50 municipios', async () => {
      // Generador de búsquedas que probablemente retornen muchos resultados
      const broadSearchArbitrary = fc.constantFrom('a', 'e', 'i', 'o', 'u', 'l', 'm', 's');

      await fc.assert(
        fc.asyncProperty(broadSearchArbitrary, async (query) => {
          // Realizar búsqueda
          const results = await service.searchMunicipalities(query);

          // Verificar que no excede el límite de 50
          expect(results.length).toBeLessThanOrEqual(50);
        }),
        { numRuns: 100 }
      );
    });

    it('debe filtrar por provincia cuando se proporciona', async () => {
      // Generador de búsquedas con provincia
      const searchWithProvinceArbitrary = fc.tuple(
        fc.constantFrom('a', 'al', 'ma', 'ba', 'se'),
        fc.constantFrom(...mockData.provinces.map(p => p.code))
      );

      await fc.assert(
        fc.asyncProperty(searchWithProvinceArbitrary, async ([query, provinceCode]) => {
          // Realizar búsqueda con filtro de provincia
          const results = await service.searchMunicipalities(query, provinceCode);

          // Verificar que todos los resultados pertenecen a la provincia
          const allBelongToProvince = results.every(
            (municipality) => municipality.provinceCode === provinceCode
          );

          expect(allBelongToProvince).toBe(true);

          // Verificar que todos contienen el texto de búsqueda
          const normalizedQuery = query.toLowerCase();
          const allContainQuery = results.every(
            (municipality) => municipality.name.toLowerCase().includes(normalizedQuery)
          );

          expect(allContainQuery).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('debe retornar array vacío para búsquedas sin coincidencias', async () => {
      // Generador de búsquedas que no deberían tener coincidencias
      const noMatchSearchArbitrary = fc.constantFrom(
        'xyz123', 'qwerty', 'zzzzz', '99999', 'abcdefghijklmnop'
      );

      await fc.assert(
        fc.asyncProperty(noMatchSearchArbitrary, async (query) => {
          // Realizar búsqueda
          const results = await service.searchMunicipalities(query);

          // Debe retornar array vacío
          expect(results).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('debe retornar array vacío para búsquedas vacías', async () => {
      // Generador de búsquedas vacías
      const emptySearchArbitrary = fc.constantFrom('', '   ', '\t', '\n');

      await fc.assert(
        fc.asyncProperty(emptySearchArbitrary, async (query) => {
          // Realizar búsqueda
          const results = await service.searchMunicipalities(query);

          // Debe retornar array vacío
          expect(results).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('debe usar memoización (retornar la misma referencia para búsquedas idénticas)', async () => {
      // Generador de búsquedas
      const searchQueryArbitrary = fc.constantFrom('madrid', 'barcelona', 'ala', 'a');

      await fc.assert(
        fc.asyncProperty(searchQueryArbitrary, async (query) => {
          // Realizar búsqueda dos veces
          const results1 = await service.searchMunicipalities(query);
          const results2 = await service.searchMunicipalities(query);

          // Debe retornar la misma referencia (memoización)
          expect(results1).toBe(results2);
        }),
        { numRuns: 100 }
      );
    });

    it('debe cachear búsquedas con y sin provincia independientemente', async () => {
      // Generador de búsquedas con y sin provincia
      const searchArbitrary = fc.tuple(
        fc.constantFrom('a', 'al', 'ma'),
        fc.option(fc.constantFrom(...mockData.provinces.map(p => p.code)), { nil: undefined })
      );

      await fc.assert(
        fc.asyncProperty(searchArbitrary, async ([query, provinceCode]) => {
          // Realizar búsqueda
          const results1 = await service.searchMunicipalities(query, provinceCode);
          
          // Realizar la misma búsqueda nuevamente
          const results2 = await service.searchMunicipalities(query, provinceCode);

          // Debe retornar la misma referencia (memoización)
          expect(results1).toBe(results2);

          // Si hay provincia, verificar que es diferente de búsqueda sin provincia
          if (provinceCode) {
            const resultsWithoutProvince = await service.searchMunicipalities(query);
            expect(results1).not.toBe(resultsWithoutProvince);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('debe ser case-insensitive (mayúsculas y minúsculas dan mismo resultado)', async () => {
      // Generador de pares de búsquedas (minúscula, mayúscula)
      const caseVariationsArbitrary = fc.constantFrom(
        ['madrid', 'MADRID'],
        ['barcelona', 'BARCELONA'],
        ['sevilla', 'SEVILLA'],
        ['ala', 'ALA']
      );

      await fc.assert(
        fc.asyncProperty(caseVariationsArbitrary, async ([lowercase, uppercase]) => {
          // Realizar búsqueda con ambas variaciones
          const resultsLower = await service.searchMunicipalities(lowercase);
          const resultsUpper = await service.searchMunicipalities(uppercase);

          // Ambos resultados deben tener la misma longitud
          expect(resultsLower.length).toBe(resultsUpper.length);

          // Ambos resultados deben contener los mismos municipios (mismo código)
          if (resultsLower.length > 0) {
            const codesLower = resultsLower.map(m => m.code).sort();
            const codesUpper = resultsUpper.map(m => m.code).sort();
            expect(JSON.stringify(codesLower)).toBe(JSON.stringify(codesUpper));
          }
        }),
        { numRuns: 50 } // 50 iteraciones × 2 búsquedas × 100ms = ~10s
      );
    }, 20000); // Timeout de 20 segundos
  });
});
