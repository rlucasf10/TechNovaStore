/**
 * Property-Based Tests para DeliveryEstimator
 * 
 * Feature: spain-locations-ine, Property 6: Distancia calculada es positiva y razonable
 * Validates: Requirements 3.1
 * 
 * Feature: spain-locations-ine, Property 7: Estimación de entrega está en rango válido
 * Validates: Requirements 3.2
 * 
 * Estos tests verifican propiedades universales que deben cumplirse
 * para todos los valores de entrada posibles, usando fast-check.
 * 
 * Cada test ejecuta 100 iteraciones con valores aleatorios generados.
 */

import * as fc from 'fast-check';
import { DeliveryEstimator } from '../../../src/shared/lib/locations/DeliveryEstimator';
import { LocationsService } from '../../../src/shared/lib/locations/LocationsService';
import type { SpainLocationsData } from '../../../src/shared/lib/locations/types';

// Mock de datos de prueba completo para property tests
const createMockData = (): SpainLocationsData => ({
  version: '2025.1',
  generatedAt: '2025-01-15T10:30:00Z',
  source: 'INE - Test Data',
  provinces: [
    // Madrid (zona especial: 24-48 horas = 1-2 días)
    {
      code: '28',
      name: 'Madrid',
      autonomousCommunity: 'Comunidad de Madrid',
      coordinates: { lat: 40.4168, lng: -3.7038 }
    },
    // Islas Baleares (zona especial: 3-5 días)
    {
      code: '07',
      name: 'Illes Balears',
      autonomousCommunity: 'Illes Balears',
      coordinates: { lat: 39.5696, lng: 2.6502 }
    },
    // Islas Canarias - Las Palmas (zona especial: 4-6 días)
    {
      code: '35',
      name: 'Las Palmas',
      autonomousCommunity: 'Canarias',
      coordinates: { lat: 28.1248, lng: -15.4300 }
    },
    // Islas Canarias - Santa Cruz de Tenerife (zona especial: 4-6 días)
    {
      code: '38',
      name: 'Santa Cruz de Tenerife',
      autonomousCommunity: 'Canarias',
      coordinates: { lat: 28.4636, lng: -16.2518 }
    },
    // Ceuta (zona especial: 4-6 días)
    {
      code: '51',
      name: 'Ceuta',
      autonomousCommunity: 'Ceuta',
      coordinates: { lat: 35.8894, lng: -5.3213 }
    },
    // Melilla (zona especial: 4-6 días)
    {
      code: '52',
      name: 'Melilla',
      autonomousCommunity: 'Melilla',
      coordinates: { lat: 35.2923, lng: -2.9381 }
    },
    // Península cercana (< 600km): 2-3 días
    {
      code: '19',
      name: 'Guadalajara',
      autonomousCommunity: 'Castilla-La Mancha',
      coordinates: { lat: 40.6318, lng: -3.1679 }
    },
    {
      code: '40',
      name: 'Segovia',
      autonomousCommunity: 'Castilla y León',
      coordinates: { lat: 40.9429, lng: -4.1088 }
    },
    {
      code: '45',
      name: 'Toledo',
      autonomousCommunity: 'Castilla-La Mancha',
      coordinates: { lat: 39.8628, lng: -4.0273 }
    },
    {
      code: '05',
      name: 'Ávila',
      autonomousCommunity: 'Castilla y León',
      coordinates: { lat: 40.6561, lng: -4.6813 }
    },
    // Península media distancia (< 600km): 2-3 días
    {
      code: '08',
      name: 'Barcelona',
      autonomousCommunity: 'Cataluña',
      coordinates: { lat: 41.3851, lng: 2.1734 }
    },
    {
      code: '46',
      name: 'Valencia',
      autonomousCommunity: 'Comunitat Valenciana',
      coordinates: { lat: 39.4699, lng: -0.3763 }
    },
    {
      code: '50',
      name: 'Zaragoza',
      autonomousCommunity: 'Aragón',
      coordinates: { lat: 41.6488, lng: -0.8891 }
    },
    // Península lejana (>= 600km): 3-4 días
    {
      code: '41',
      name: 'Sevilla',
      autonomousCommunity: 'Andalucía',
      coordinates: { lat: 37.3891, lng: -5.9845 }
    },
    {
      code: '29',
      name: 'Málaga',
      autonomousCommunity: 'Andalucía',
      coordinates: { lat: 36.7213, lng: -4.4214 }
    },
    {
      code: '11',
      name: 'Cádiz',
      autonomousCommunity: 'Andalucía',
      coordinates: { lat: 36.5271, lng: -6.2886 }
    },
    {
      code: '15',
      name: 'A Coruña',
      autonomousCommunity: 'Galicia',
      coordinates: { lat: 43.3623, lng: -8.4115 }
    },
    {
      code: '48',
      name: 'Bizkaia',
      autonomousCommunity: 'País Vasco',
      coordinates: { lat: 43.2630, lng: -2.9350 }
    },
    {
      code: '33',
      name: 'Asturias',
      autonomousCommunity: 'Principado de Asturias',
      coordinates: { lat: 43.3614, lng: -5.8593 }
    },
    {
      code: '04',
      name: 'Almería',
      autonomousCommunity: 'Andalucía',
      coordinates: { lat: 36.8381, lng: -2.4597 }
    }
  ],
  municipalities: [
    // Madrid
    {
      code: '28079',
      name: 'Madrid',
      provinceCode: '28',
      postalCodes: ['28001', '28002', '28003'],
      isCapital: true
    },
    // Barcelona
    {
      code: '08019',
      name: 'Barcelona',
      provinceCode: '08',
      postalCodes: ['08001', '08002', '08003'],
      isCapital: true
    },
    // Sevilla
    {
      code: '41091',
      name: 'Sevilla',
      provinceCode: '41',
      postalCodes: ['41001', '41002', '41003'],
      isCapital: true
    },
    // Valencia
    {
      code: '46250',
      name: 'Valencia',
      provinceCode: '46',
      postalCodes: ['46001', '46002', '46003'],
      isCapital: true
    },
    // Málaga
    {
      code: '29067',
      name: 'Málaga',
      provinceCode: '29',
      postalCodes: ['29001', '29002', '29003'],
      isCapital: true
    },
    // Palma de Mallorca (Baleares)
    {
      code: '07040',
      name: 'Palma',
      provinceCode: '07',
      postalCodes: ['07001', '07002', '07003'],
      isCapital: true
    },
    // Las Palmas de Gran Canaria
    {
      code: '35016',
      name: 'Las Palmas de Gran Canaria',
      provinceCode: '35',
      postalCodes: ['35001', '35002', '35003'],
      isCapital: true
    },
    // Santa Cruz de Tenerife
    {
      code: '38038',
      name: 'Santa Cruz de Tenerife',
      provinceCode: '38',
      postalCodes: ['38001', '38002', '38003'],
      isCapital: true
    },
    // Ceuta
    {
      code: '51001',
      name: 'Ceuta',
      provinceCode: '51',
      postalCodes: ['51001', '51002', '51003'],
      isCapital: true
    },
    // Melilla
    {
      code: '52001',
      name: 'Melilla',
      provinceCode: '52',
      postalCodes: ['52001', '52002', '52003'],
      isCapital: true
    }
  ]
});

describe('DeliveryEstimator - Property-Based Tests', () => {
  let service: LocationsService;
  let estimator: DeliveryEstimator;
  let mockData: SpainLocationsData;

  beforeEach(() => {
    // Crear datos mock
    mockData = createMockData();

    // Crear instancia del servicio con datos mock
    service = new LocationsService();
    (service as any).data = mockData;

    // Crear instancia del estimador con el servicio mock
    estimator = new DeliveryEstimator(service);
  });

  describe('Property 6: Distancia calculada es positiva y razonable', () => {
    /**
     * Feature: spain-locations-ine, Property 6: Distancia calculada es positiva y razonable
     * Validates: Requirements 3.1
     * 
     * Para cualquier par de coordenadas dentro de España, la distancia calculada
     * debe ser mayor que 0 y menor que 1500 km (distancia máxima aproximada en España).
     * 
     * Rangos de coordenadas de España:
     * - Latitud: 36° N (sur) a 43.8° N (norte)
     * - Longitud: -9.3° W (oeste) a 4.3° E (este)
     */
    it('debe calcular distancia positiva y razonable para coordenadas dentro de España', () => {
      // Generador de coordenadas dentro de España
      // Latitud: 36 a 43.8 (sur a norte)
      // Longitud: -9.3 a 4.3 (oeste a este)
      // Usar noDefaultInfinity y noNaN para evitar valores especiales
      const spanishLatitudeArbitrary = fc.double({ 
        min: 36.0, 
        max: 43.8,
        noDefaultInfinity: true,
        noNaN: true
      });
      const spanishLongitudeArbitrary = fc.double({ 
        min: -9.3, 
        max: 4.3,
        noDefaultInfinity: true,
        noNaN: true
      });

      fc.assert(
        fc.property(
          spanishLatitudeArbitrary,
          spanishLongitudeArbitrary,
          spanishLatitudeArbitrary,
          spanishLongitudeArbitrary,
          (lat1, lng1, lat2, lng2) => {
            // Calcular distancia entre dos puntos
            const distance = estimator.calculateDistance(lat1, lng1, lat2, lng2);

            // Verificar que la distancia es no negativa
            expect(distance).toBeGreaterThanOrEqual(0);

            // Verificar que la distancia es razonable (< 1500 km)
            // La distancia máxima en España es aproximadamente 1200 km
            expect(distance).toBeLessThan(1500);
          }
        ),
        { numRuns: 100 } // Ejecutar 100 iteraciones
      );
    });

    it('debe calcular distancia 0 para el mismo punto', () => {
      // Generador de coordenadas dentro de España
      const spanishLatitudeArbitrary = fc.double({ 
        min: 36.0, 
        max: 43.8,
        noDefaultInfinity: true,
        noNaN: true
      });
      const spanishLongitudeArbitrary = fc.double({ 
        min: -9.3, 
        max: 4.3,
        noDefaultInfinity: true,
        noNaN: true
      });

      fc.assert(
        fc.property(
          spanishLatitudeArbitrary,
          spanishLongitudeArbitrary,
          (lat, lng) => {
            // Calcular distancia del punto a sí mismo
            const distance = estimator.calculateDistance(lat, lng, lat, lng);

            // Verificar que la distancia es 0
            expect(distance).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe calcular distancia simétrica (d(A,B) = d(B,A))', () => {
      // Generador de coordenadas dentro de España
      const spanishLatitudeArbitrary = fc.double({ 
        min: 36.0, 
        max: 43.8,
        noDefaultInfinity: true,
        noNaN: true
      });
      const spanishLongitudeArbitrary = fc.double({ 
        min: -9.3, 
        max: 4.3,
        noDefaultInfinity: true,
        noNaN: true
      });

      fc.assert(
        fc.property(
          spanishLatitudeArbitrary,
          spanishLongitudeArbitrary,
          spanishLatitudeArbitrary,
          spanishLongitudeArbitrary,
          (lat1, lng1, lat2, lng2) => {
            // Calcular distancia en ambas direcciones
            const distanceAB = estimator.calculateDistance(lat1, lng1, lat2, lng2);
            const distanceBA = estimator.calculateDistance(lat2, lng2, lat1, lng1);

            // Verificar que las distancias son iguales (propiedad simétrica)
            expect(distanceAB).toBeCloseTo(distanceBA, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe calcular distancia desde Madrid a provincias en rango razonable', () => {
      // Generador de códigos de provincia válidos
      const provinceCodeArbitrary = fc.constantFrom(
        ...mockData.provinces.map(p => p.code)
      );

      fc.assert(
        fc.property(provinceCodeArbitrary, (provinceCode) => {
          // Obtener la provincia
          const province = mockData.provinces.find(p => p.code === provinceCode);
          expect(province).toBeDefined();

          // Calcular distancia desde Madrid (centro de distribución)
          const distance = estimator.calculateDistanceFromDistributionCenter(province!);

          // Verificar que la distancia es no negativa
          expect(distance).toBeGreaterThanOrEqual(0);

          // Verificar que la distancia es razonable
          // Madrid a Canarias es aproximadamente 1800 km (la más lejana)
          // Pero para península, debe ser < 1000 km
          expect(distance).toBeLessThan(2000);
        }),
        { numRuns: 100 }
      );
    });

    it('debe calcular distancias conocidas correctamente', () => {
      // Madrid a Barcelona: ~504 km
      const madridBarcelona = estimator.calculateDistance(
        40.4168, -3.7038,  // Madrid
        41.3851, 2.1734    // Barcelona
      );
      expect(madridBarcelona).toBeGreaterThan(500);
      expect(madridBarcelona).toBeLessThan(510);

      // Madrid a Sevilla: ~390 km
      const madridSevilla = estimator.calculateDistance(
        40.4168, -3.7038,  // Madrid
        37.3891, -5.9845   // Sevilla
      );
      expect(madridSevilla).toBeGreaterThan(385);
      expect(madridSevilla).toBeLessThan(395);

      // Madrid a Valencia: ~302 km
      const madridValencia = estimator.calculateDistance(
        40.4168, -3.7038,  // Madrid
        39.4699, -0.3763   // Valencia
      );
      expect(madridValencia).toBeGreaterThan(295);
      expect(madridValencia).toBeLessThan(310);
    });
  });

  describe('Property 7: Estimación de entrega está en rango válido', () => {
    /**
     * Feature: spain-locations-ine, Property 7: Estimación de entrega está en rango válido
     * Validates: Requirements 3.2
     * 
     * Para cualquier provincia válida, la estimación de días de entrega debe estar
     * entre 1 y 6 días (ambos inclusive).
     * 
     * Rangos esperados por zona:
     * - Madrid: 1-2 días
     * - Península cercana: 2-3 días
     * - Península lejana: 3-4 días
     * - Baleares: 3-5 días
     * - Canarias: 4-6 días
     * - Ceuta/Melilla: 4-6 días
     */
    it('debe retornar estimación con días en rango 1-6 para cualquier provincia', () => {
      // Generador de códigos de provincia válidos
      const provinceCodeArbitrary = fc.constantFrom(
        ...mockData.provinces.map(p => p.code)
      );

      fc.assert(
        fc.property(provinceCodeArbitrary, (provinceCode) => {
          // Calcular estimación para la provincia
          const estimate = estimator.estimateDelivery(provinceCode);

          // Verificar que daysMin está en rango válido
          expect(estimate.daysMin).toBeGreaterThanOrEqual(1);
          expect(estimate.daysMin).toBeLessThanOrEqual(6);

          // Verificar que daysMax está en rango válido
          expect(estimate.daysMax).toBeGreaterThanOrEqual(1);
          expect(estimate.daysMax).toBeLessThanOrEqual(6);

          // Verificar que daysMin <= daysMax
          expect(estimate.daysMin).toBeLessThanOrEqual(estimate.daysMax);

          // Verificar que la descripción no está vacía
          expect(estimate.days).toBeTruthy();
          expect(estimate.days.length).toBeGreaterThan(0);

          // Verificar que la zona es válida
          expect(['madrid', 'peninsula', 'balearic', 'canary', 'ceuta-melilla']).toContain(estimate.zone);
        }),
        { numRuns: 100 } // Ejecutar 100 iteraciones
      );
    });

    it('debe retornar estimación consistente para la misma provincia', () => {
      // Generador de códigos de provincia válidos
      const provinceCodeArbitrary = fc.constantFrom(
        ...mockData.provinces.map(p => p.code)
      );

      fc.assert(
        fc.property(provinceCodeArbitrary, (provinceCode) => {
          // Calcular estimación dos veces para la misma provincia
          const estimate1 = estimator.estimateDelivery(provinceCode);
          const estimate2 = estimator.estimateDelivery(provinceCode);

          // Verificar que ambas estimaciones son idénticas
          expect(estimate1.days).toBe(estimate2.days);
          expect(estimate1.daysMin).toBe(estimate2.daysMin);
          expect(estimate1.daysMax).toBe(estimate2.daysMax);
          expect(estimate1.zone).toBe(estimate2.zone);
        }),
        { numRuns: 100 }
      );
    });

    it('debe retornar estimación correcta para zonas especiales', () => {
      // Verificar Madrid (1-2 días)
      const madridEstimate = estimator.estimateDelivery('28');
      expect(madridEstimate.daysMin).toBe(1);
      expect(madridEstimate.daysMax).toBe(2);
      expect(madridEstimate.zone).toBe('madrid');

      // Verificar Baleares (3-5 días)
      const balearicEstimate = estimator.estimateDelivery('07');
      expect(balearicEstimate.daysMin).toBe(3);
      expect(balearicEstimate.daysMax).toBe(5);
      expect(balearicEstimate.zone).toBe('balearic');

      // Verificar Canarias - Las Palmas (4-6 días)
      const canary1Estimate = estimator.estimateDelivery('35');
      expect(canary1Estimate.daysMin).toBe(4);
      expect(canary1Estimate.daysMax).toBe(6);
      expect(canary1Estimate.zone).toBe('canary');

      // Verificar Canarias - Santa Cruz de Tenerife (4-6 días)
      const canary2Estimate = estimator.estimateDelivery('38');
      expect(canary2Estimate.daysMin).toBe(4);
      expect(canary2Estimate.daysMax).toBe(6);
      expect(canary2Estimate.zone).toBe('canary');

      // Verificar Ceuta (4-6 días)
      const ceutaEstimate = estimator.estimateDelivery('51');
      expect(ceutaEstimate.daysMin).toBe(4);
      expect(ceutaEstimate.daysMax).toBe(6);
      expect(ceutaEstimate.zone).toBe('ceuta-melilla');

      // Verificar Melilla (4-6 días)
      const melillaEstimate = estimator.estimateDelivery('52');
      expect(melillaEstimate.daysMin).toBe(4);
      expect(melillaEstimate.daysMax).toBe(6);
      expect(melillaEstimate.zone).toBe('ceuta-melilla');
    });

    it('debe retornar estimación en rango válido para península', () => {
      // Generador de códigos de provincia de península (excluyendo zonas especiales)
      const peninsulaProvinceCodeArbitrary = fc.constantFrom(
        ...mockData.provinces
          .filter(p => !['28', '07', '35', '38', '51', '52'].includes(p.code))
          .map(p => p.code)
      );

      fc.assert(
        fc.property(peninsulaProvinceCodeArbitrary, (provinceCode) => {
          // Calcular estimación para provincia de península
          const estimate = estimator.estimateDelivery(provinceCode);

          // Verificar que es zona península
          expect(estimate.zone).toBe('peninsula');

          // Verificar que los días están en rango válido para península (2-4 días)
          expect(estimate.daysMin).toBeGreaterThanOrEqual(2);
          expect(estimate.daysMin).toBeLessThanOrEqual(3);
          expect(estimate.daysMax).toBeGreaterThanOrEqual(3);
          expect(estimate.daysMax).toBeLessThanOrEqual(4);

          // Verificar que daysMin <= daysMax
          expect(estimate.daysMin).toBeLessThanOrEqual(estimate.daysMax);
        }),
        { numRuns: 100 }
      );
    });

    it('debe lanzar error para provincia inexistente', () => {
      // Generador de códigos de provincia inválidos
      const invalidProvinceCodeArbitrary = fc.string({ minLength: 2, maxLength: 2 })
        .filter(code => !mockData.provinces.some(p => p.code === code));

      fc.assert(
        fc.property(invalidProvinceCodeArbitrary, (provinceCode) => {
          // Intentar calcular estimación para provincia inexistente
          expect(() => {
            estimator.estimateDelivery(provinceCode);
          }).toThrow();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7 (Extended): Estimación por municipio está en rango válido', () => {
    /**
     * Extensión de Property 7 para municipios
     * 
     * Para cualquier municipio válido, la estimación de días de entrega debe estar
     * entre 1 y 6 días (ambos inclusive).
     */
    it('debe retornar estimación con días en rango 1-6 para cualquier municipio', () => {
      // Generador de códigos de municipio válidos
      const municipalityCodeArbitrary = fc.constantFrom(
        ...mockData.municipalities.map(m => m.code)
      );

      fc.assert(
        fc.property(municipalityCodeArbitrary, (municipalityCode) => {
          // Calcular estimación para el municipio
          const estimate = estimator.estimateDeliveryByMunicipality(municipalityCode);

          // Verificar que daysMin está en rango válido
          expect(estimate.daysMin).toBeGreaterThanOrEqual(1);
          expect(estimate.daysMin).toBeLessThanOrEqual(6);

          // Verificar que daysMax está en rango válido
          expect(estimate.daysMax).toBeGreaterThanOrEqual(1);
          expect(estimate.daysMax).toBeLessThanOrEqual(6);

          // Verificar que daysMin <= daysMax
          expect(estimate.daysMin).toBeLessThanOrEqual(estimate.daysMax);
        }),
        { numRuns: 100 }
      );
    });

    it('debe retornar la misma estimación para municipio y su provincia', () => {
      // Generador de códigos de municipio válidos
      const municipalityCodeArbitrary = fc.constantFrom(
        ...mockData.municipalities.map(m => m.code)
      );

      fc.assert(
        fc.property(municipalityCodeArbitrary, (municipalityCode) => {
          // Obtener el municipio
          const municipality = mockData.municipalities.find(m => m.code === municipalityCode);
          expect(municipality).toBeDefined();

          // Calcular estimación por municipio
          const estimateByMunicipality = estimator.estimateDeliveryByMunicipality(municipalityCode);

          // Calcular estimación por provincia
          const estimateByProvince = estimator.estimateDelivery(municipality!.provinceCode);

          // Verificar que ambas estimaciones son idénticas
          expect(estimateByMunicipality.days).toBe(estimateByProvince.days);
          expect(estimateByMunicipality.daysMin).toBe(estimateByProvince.daysMin);
          expect(estimateByMunicipality.daysMax).toBe(estimateByProvince.daysMax);
          expect(estimateByMunicipality.zone).toBe(estimateByProvince.zone);
        }),
        { numRuns: 100 }
      );
    });
  });
});
