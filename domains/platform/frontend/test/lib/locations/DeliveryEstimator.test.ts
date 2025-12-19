/**
 * Unit Tests para DeliveryEstimator
 * 
 * Verifica casos específicos de estimación de entrega para diferentes zonas:
 * - Madrid: "24-48 horas"
 * - Península: "2-3 días laborables" o "3-4 días laborables"
 * - Islas Baleares: "3-5 días laborables"
 * - Islas Canarias: "4-6 días laborables"
 * - Ceuta y Melilla: "4-6 días laborables"
 */

import { DeliveryEstimator } from '../../../src/shared/lib/locations/DeliveryEstimator';
import { LocationsService } from '../../../src/shared/lib/locations/LocationsService';
import type { SpainLocationsData } from '../../../src/shared/lib/locations/types';

// Mock de datos de prueba con provincias representativas de cada zona
const mockData: SpainLocationsData = {
  version: '2025.1',
  generatedAt: '2025-01-15T10:30:00Z',
  source: 'INE - Test Data',
  provinces: [
    // Madrid (zona especial)
    {
      code: '28',
      name: 'Madrid',
      autonomousCommunity: 'Comunidad de Madrid',
      coordinates: { lat: 40.4168, lng: -3.7038 }
    },
    // Península cercana (< 600km)
    {
      code: '08',
      name: 'Barcelona',
      autonomousCommunity: 'Cataluña',
      coordinates: { lat: 41.3851, lng: 2.1734 }
    },
    {
      code: '46',
      name: 'Valencia',
      autonomousCommunity: 'Comunidad Valenciana',
      coordinates: { lat: 39.4699, lng: -0.3763 }
    },
    // Península lejana (>= 600km)
    {
      code: '15',
      name: 'A Coruña',
      autonomousCommunity: 'Galicia',
      coordinates: { lat: 43.3623, lng: -8.4115 }
    },
    {
      code: '17',
      name: 'Girona',
      autonomousCommunity: 'Cataluña',
      coordinates: { lat: 42.5, lng: 3.2 }
    },
    // Islas Baleares
    {
      code: '07',
      name: 'Illes Balears',
      autonomousCommunity: 'Illes Balears',
      coordinates: { lat: 39.5696, lng: 2.6502 }
    },
    // Islas Canarias
    {
      code: '35',
      name: 'Las Palmas',
      autonomousCommunity: 'Canarias',
      coordinates: { lat: 28.1248, lng: -15.4300 }
    },
    {
      code: '38',
      name: 'Santa Cruz de Tenerife',
      autonomousCommunity: 'Canarias',
      coordinates: { lat: 28.4636, lng: -16.2518 }
    },
    // Ceuta y Melilla
    {
      code: '51',
      name: 'Ceuta',
      autonomousCommunity: 'Ceuta',
      coordinates: { lat: 35.8894, lng: -5.3213 }
    },
    {
      code: '52',
      name: 'Melilla',
      autonomousCommunity: 'Melilla',
      coordinates: { lat: 35.2923, lng: -2.9381 }
    }
  ],
  municipalities: [
    {
      code: '28079',
      name: 'Madrid',
      provinceCode: '28',
      postalCodes: ['28001'],
      isCapital: true
    },
    {
      code: '08019',
      name: 'Barcelona',
      provinceCode: '08',
      postalCodes: ['08001'],
      isCapital: true
    },
    {
      code: '46250',
      name: 'Valencia',
      provinceCode: '46',
      postalCodes: ['46001'],
      isCapital: true
    },
    {
      code: '15030',
      name: 'A Coruña',
      provinceCode: '15',
      postalCodes: ['15001'],
      isCapital: true
    },
    {
      code: '17079',
      name: 'Girona',
      provinceCode: '17',
      postalCodes: ['17001'],
      isCapital: true
    },
    {
      code: '07040',
      name: 'Palma',
      provinceCode: '07',
      postalCodes: ['07001'],
      isCapital: true
    },
    {
      code: '35016',
      name: 'Las Palmas de Gran Canaria',
      provinceCode: '35',
      postalCodes: ['35001'],
      isCapital: true
    },
    {
      code: '38038',
      name: 'Santa Cruz de Tenerife',
      provinceCode: '38',
      postalCodes: ['38001'],
      isCapital: true
    },
    {
      code: '51001',
      name: 'Ceuta',
      provinceCode: '51',
      postalCodes: ['51001'],
      isCapital: true
    },
    {
      code: '52001',
      name: 'Melilla',
      provinceCode: '52',
      postalCodes: ['52001'],
      isCapital: true
    }
  ]
};

// Mock de fetch global
global.fetch = jest.fn();

describe('DeliveryEstimator - Unit Tests', () => {
  let estimator: DeliveryEstimator;
  let locationsService: LocationsService;

  beforeEach(async () => {
    // Obtener instancia del servicio de localidades
    locationsService = LocationsService.getInstance();
    
    // Limpiar caché antes de cada test
    locationsService.clearCache();
    
    // Resetear mock de fetch
    (global.fetch as jest.Mock).mockReset();
    
    // Configurar mock de fetch para retornar datos de prueba
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData
    });

    // Cargar datos
    await locationsService.loadData();

    // Crear instancia del estimador
    estimator = new DeliveryEstimator(locationsService);
  });

  describe('Zona Madrid', () => {
    it('debe retornar "24-48 horas" para Madrid', () => {
      const estimate = estimator.estimateDelivery('28');

      expect(estimate.days).toBe('24-48 horas');
      expect(estimate.daysMin).toBe(1);
      expect(estimate.daysMax).toBe(2);
      expect(estimate.zone).toBe('madrid');
    });

    it('debe retornar "24-48 horas" para municipio de Madrid', () => {
      const estimate = estimator.estimateDeliveryByMunicipality('28079');

      expect(estimate.days).toBe('24-48 horas');
      expect(estimate.daysMin).toBe(1);
      expect(estimate.daysMax).toBe(2);
      expect(estimate.zone).toBe('madrid');
    });
  });

  describe('Zona Península', () => {
    it('debe retornar "2-3 días laborables" para Barcelona (península cercana)', () => {
      const estimate = estimator.estimateDelivery('08');

      expect(estimate.days).toBe('2-3 días laborables');
      expect(estimate.daysMin).toBe(2);
      expect(estimate.daysMax).toBe(3);
      expect(estimate.zone).toBe('peninsula');
    });

    it('debe retornar "2-3 días laborables" para Valencia (península cercana)', () => {
      const estimate = estimator.estimateDelivery('46');

      expect(estimate.days).toBe('2-3 días laborables');
      expect(estimate.daysMin).toBe(2);
      expect(estimate.daysMax).toBe(3);
      expect(estimate.zone).toBe('peninsula');
    });

    it('debe retornar "2-3 días laborables" para A Coruña (península cercana)', () => {
      const estimate = estimator.estimateDelivery('15');

      expect(estimate.days).toBe('2-3 días laborables');
      expect(estimate.daysMin).toBe(2);
      expect(estimate.daysMax).toBe(3);
      expect(estimate.zone).toBe('peninsula');
    });

    it('debe retornar "3-4 días laborables" para Girona (península lejana)', () => {
      const estimate = estimator.estimateDelivery('17');

      expect(estimate.days).toBe('3-4 días laborables');
      expect(estimate.daysMin).toBe(3);
      expect(estimate.daysMax).toBe(4);
      expect(estimate.zone).toBe('peninsula');
    });
  });

  describe('Zona Islas Baleares', () => {
    it('debe retornar "3-5 días laborables" para Islas Baleares', () => {
      const estimate = estimator.estimateDelivery('07');

      expect(estimate.days).toBe('3-5 días laborables');
      expect(estimate.daysMin).toBe(3);
      expect(estimate.daysMax).toBe(5);
      expect(estimate.zone).toBe('balearic');
    });

    it('debe retornar "3-5 días laborables" para municipio de Palma', () => {
      const estimate = estimator.estimateDeliveryByMunicipality('07040');

      expect(estimate.days).toBe('3-5 días laborables');
      expect(estimate.daysMin).toBe(3);
      expect(estimate.daysMax).toBe(5);
      expect(estimate.zone).toBe('balearic');
    });
  });

  describe('Zona Islas Canarias', () => {
    it('debe retornar "4-6 días laborables" para Las Palmas (Canarias)', () => {
      const estimate = estimator.estimateDelivery('35');

      expect(estimate.days).toBe('4-6 días laborables');
      expect(estimate.daysMin).toBe(4);
      expect(estimate.daysMax).toBe(6);
      expect(estimate.zone).toBe('canary');
    });

    it('debe retornar "4-6 días laborables" para Santa Cruz de Tenerife (Canarias)', () => {
      const estimate = estimator.estimateDelivery('38');

      expect(estimate.days).toBe('4-6 días laborables');
      expect(estimate.daysMin).toBe(4);
      expect(estimate.daysMax).toBe(6);
      expect(estimate.zone).toBe('canary');
    });

    it('debe retornar "4-6 días laborables" para municipio de Las Palmas', () => {
      const estimate = estimator.estimateDeliveryByMunicipality('35016');

      expect(estimate.days).toBe('4-6 días laborables');
      expect(estimate.daysMin).toBe(4);
      expect(estimate.daysMax).toBe(6);
      expect(estimate.zone).toBe('canary');
    });

    it('debe retornar "4-6 días laborables" para municipio de Santa Cruz', () => {
      const estimate = estimator.estimateDeliveryByMunicipality('38038');

      expect(estimate.days).toBe('4-6 días laborables');
      expect(estimate.daysMin).toBe(4);
      expect(estimate.daysMax).toBe(6);
      expect(estimate.zone).toBe('canary');
    });
  });

  describe('Zona Ceuta y Melilla', () => {
    it('debe retornar "4-6 días laborables" para Ceuta', () => {
      const estimate = estimator.estimateDelivery('51');

      expect(estimate.days).toBe('4-6 días laborables');
      expect(estimate.daysMin).toBe(4);
      expect(estimate.daysMax).toBe(6);
      expect(estimate.zone).toBe('ceuta-melilla');
    });

    it('debe retornar "4-6 días laborables" para Melilla', () => {
      const estimate = estimator.estimateDelivery('52');

      expect(estimate.days).toBe('4-6 días laborables');
      expect(estimate.daysMin).toBe(4);
      expect(estimate.daysMax).toBe(6);
      expect(estimate.zone).toBe('ceuta-melilla');
    });

    it('debe retornar "4-6 días laborables" para municipio de Ceuta', () => {
      const estimate = estimator.estimateDeliveryByMunicipality('51001');

      expect(estimate.days).toBe('4-6 días laborables');
      expect(estimate.daysMin).toBe(4);
      expect(estimate.daysMax).toBe(6);
      expect(estimate.zone).toBe('ceuta-melilla');
    });

    it('debe retornar "4-6 días laborables" para municipio de Melilla', () => {
      const estimate = estimator.estimateDeliveryByMunicipality('52001');

      expect(estimate.days).toBe('4-6 días laborables');
      expect(estimate.daysMin).toBe(4);
      expect(estimate.daysMax).toBe(6);
      expect(estimate.zone).toBe('ceuta-melilla');
    });
  });

  describe('Manejo de Errores', () => {
    it('debe lanzar error si la provincia no existe', () => {
      expect(() => estimator.estimateDelivery('99')).toThrow(
        'Provincia no encontrada: 99'
      );
    });

    it('debe lanzar error si el municipio no existe', () => {
      expect(() => estimator.estimateDeliveryByMunicipality('99999')).toThrow(
        'Municipio no encontrado: 99999'
      );
    });
  });

  describe('Cálculo de Distancia', () => {
    it('debe calcular distancia correcta de Madrid a Barcelona (~504 km)', () => {
      const distance = estimator.calculateDistance(
        40.4168, -3.7038,  // Madrid
        41.3851, 2.1734    // Barcelona
      );

      // Distancia real es aproximadamente 504 km
      expect(distance).toBeGreaterThan(500);
      expect(distance).toBeLessThan(510);
    });

    it('debe calcular distancia 0 para el mismo punto', () => {
      const distance = estimator.calculateDistance(
        40.4168, -3.7038,  // Madrid
        40.4168, -3.7038   // Madrid
      );

      expect(distance).toBe(0);
    });

    it('debe calcular distancia correcta de Madrid a A Coruña (~509 km)', () => {
      const distance = estimator.calculateDistance(
        40.4168, -3.7038,  // Madrid
        43.3623, -8.4115   // A Coruña
      );

      // Distancia real es aproximadamente 509 km
      expect(distance).toBeGreaterThan(500);
      expect(distance).toBeLessThan(520);
    });
  });
});
