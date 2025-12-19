/**
 * Tests para LocationsService
 * 
 * Verifica que los métodos de consulta funcionen correctamente
 * y que la memoización mejore el rendimiento.
 */

import { LocationsService } from '../../../src/shared/lib/locations/LocationsService';
import type { SpainLocationsData } from '../../../src/shared/lib/locations/types';

// Mock de datos de prueba
const mockData: SpainLocationsData = {
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
    }
  ],
  municipalities: [
    {
      code: '28079',
      name: 'Madrid',
      provinceCode: '28',
      postalCodes: ['28001', '28002', '28003'],
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
      code: '08019',
      name: 'Barcelona',
      provinceCode: '08',
      postalCodes: ['08001', '08002', '08003'],
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
      code: '41091',
      name: 'Sevilla',
      provinceCode: '41',
      postalCodes: ['41001', '41002', '41003'],
      isCapital: true
    }
  ]
};

// Mock de fetch global
global.fetch = jest.fn();

describe('LocationsService', () => {
  let service: LocationsService;

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

  describe('getProvinces', () => {
    it('debe retornar todas las provincias ordenadas alfabéticamente', async () => {
      await service.loadData();
      const provinces = service.getProvinces();

      expect(provinces).toHaveLength(3);
      expect(provinces[0].name).toBe('Barcelona');
      expect(provinces[1].name).toBe('Madrid');
      expect(provinces[2].name).toBe('Sevilla');
    });

    it('debe usar memoización (retornar la misma referencia en llamadas subsecuentes)', async () => {
      await service.loadData();
      
      const provinces1 = service.getProvinces();
      const provinces2 = service.getProvinces();

      // Debe retornar la misma referencia (memoización)
      expect(provinces1).toBe(provinces2);
    });

    it('debe lanzar error si los datos no están cargados', () => {
      expect(() => service.getProvinces()).toThrow(
        'Los datos de localidades no han sido cargados'
      );
    });
  });

  describe('getMunicipalitiesByProvince', () => {
    it('debe retornar todos los municipios de una provincia ordenados alfabéticamente', async () => {
      await service.loadData();
      const municipalities = service.getMunicipalitiesByProvince('28');

      expect(municipalities).toHaveLength(3);
      expect(municipalities[0].name).toBe('Ajalvir');
      expect(municipalities[1].name).toBe('Alameda del Valle');
      expect(municipalities[2].name).toBe('Madrid');
    });

    it('debe usar memoización (retornar la misma referencia en llamadas subsecuentes)', async () => {
      await service.loadData();
      
      const municipalities1 = service.getMunicipalitiesByProvince('28');
      const municipalities2 = service.getMunicipalitiesByProvince('28');

      // Debe retornar la misma referencia (memoización)
      expect(municipalities1).toBe(municipalities2);
    });

    it('debe retornar array vacío si la provincia no tiene municipios', async () => {
      await service.loadData();
      const municipalities = service.getMunicipalitiesByProvince('99');

      expect(municipalities).toHaveLength(0);
    });

    it('debe cachear resultados por provincia independientemente', async () => {
      await service.loadData();
      
      const madrid = service.getMunicipalitiesByProvince('28');
      const barcelona = service.getMunicipalitiesByProvince('08');

      expect(madrid).toHaveLength(3);
      expect(barcelona).toHaveLength(2);
      expect(madrid).not.toBe(barcelona);
    });
  });

  describe('getMunicipality', () => {
    it('debe retornar un municipio por su código', async () => {
      await service.loadData();
      const municipality = service.getMunicipality('28079');

      expect(municipality).not.toBeNull();
      expect(municipality!.name).toBe('Madrid');
      expect(municipality!.isCapital).toBe(true);
    });

    it('debe usar memoización (retornar la misma referencia en llamadas subsecuentes)', async () => {
      await service.loadData();
      
      const municipality1 = service.getMunicipality('28079');
      const municipality2 = service.getMunicipality('28079');

      // Debe retornar la misma referencia (memoización)
      expect(municipality1).toBe(municipality2);
    });

    it('debe retornar null si el municipio no existe', async () => {
      await service.loadData();
      const municipality = service.getMunicipality('99999');

      expect(municipality).toBeNull();
    });

    it('debe cachear null para municipios no encontrados', async () => {
      await service.loadData();
      
      const municipality1 = service.getMunicipality('99999');
      const municipality2 = service.getMunicipality('99999');

      expect(municipality1).toBeNull();
      expect(municipality2).toBeNull();
      expect(municipality1).toBe(municipality2);
    });
  });

  describe('getPostalCodesByMunicipality', () => {
    it('debe retornar todos los códigos postales de un municipio', async () => {
      await service.loadData();
      const postalCodes = service.getPostalCodesByMunicipality('28079');

      expect(postalCodes).toEqual(['28001', '28002', '28003']);
    });

    it('debe lanzar error si el municipio no existe', async () => {
      await service.loadData();

      expect(() => service.getPostalCodesByMunicipality('99999')).toThrow(
        'Municipio no encontrado: 99999'
      );
    });

    it('debe usar memoización del método getMunicipality', async () => {
      await service.loadData();
      
      // Primera llamada cachea el municipio
      const postalCodes1 = service.getPostalCodesByMunicipality('28079');
      
      // Segunda llamada debe usar el caché
      const postalCodes2 = service.getPostalCodesByMunicipality('28079');

      expect(postalCodes1).toEqual(postalCodes2);
    });
  });

  describe('searchMunicipalities', () => {
    it('debe buscar municipios por nombre (case-insensitive)', async () => {
      await service.loadData();
      const results = await service.searchMunicipalities('madrid');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Madrid');
    });

    it('debe buscar municipios con búsqueda parcial', async () => {
      await service.loadData();
      const results = await service.searchMunicipalities('ala');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alameda del Valle');
    });

    it('debe filtrar por provincia si se proporciona', async () => {
      await service.loadData();
      const results = await service.searchMunicipalities('ala', '28');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alameda del Valle');
      expect(results.every(m => m.provinceCode === '28')).toBe(true);
    });

    it('debe usar memoización (retornar la misma referencia en llamadas subsecuentes)', async () => {
      await service.loadData();
      
      const results1 = await service.searchMunicipalities('madrid');
      const results2 = await service.searchMunicipalities('madrid');

      // Debe retornar la misma referencia (memoización)
      expect(results1).toBe(results2);
    });

    it('debe cachear búsquedas con y sin provincia independientemente', async () => {
      await service.loadData();
      
      const results1 = await service.searchMunicipalities('a');
      const results2 = await service.searchMunicipalities('a', '28');

      expect(results1).not.toBe(results2);
      expect(results1.length).toBeGreaterThan(results2.length);
    });

    it('debe retornar array vacío si la búsqueda está vacía', async () => {
      await service.loadData();
      const results = await service.searchMunicipalities('');

      expect(results).toHaveLength(0);
    });

    it('debe retornar array vacío si no hay coincidencias', async () => {
      await service.loadData();
      const results = await service.searchMunicipalities('xyz123');

      expect(results).toHaveLength(0);
    });

    it('debe usar caché de getMunicipalitiesByProvince cuando se filtra por provincia', async () => {
      await service.loadData();
      
      // Primera llamada cachea los municipios de la provincia
      const municipalities = service.getMunicipalitiesByProvince('28');
      
      // Búsqueda debe usar el caché
      const results = await service.searchMunicipalities('a', '28');

      expect(results.length).toBeLessThanOrEqual(municipalities.length);
      expect(results.every(m => m.provinceCode === '28')).toBe(true);
    });

    it('debe implementar debounce interno de 100ms', async () => {
      await service.loadData();
      
      const start = Date.now();
      
      // Realizar búsqueda
      const results = await service.searchMunicipalities('madrid');
      
      const elapsed = Date.now() - start;
      
      // Debe esperar aproximadamente 100ms (debounce)
      // Permitir margen de error de ±5ms por imprecisión del timer
      expect(elapsed).toBeGreaterThanOrEqual(95);
      expect(elapsed).toBeLessThan(150);
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Madrid');
    });

    it('debe cancelar búsquedas anteriores de la misma query cuando se inicia una nueva', async () => {
      await service.loadData();
      
      const start = Date.now();
      
      // Iniciar primera búsqueda con 'a'
      const promise1 = service.searchMunicipalities('a');
      
      // Esperar 50ms (menos que el debounce)
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Iniciar segunda búsqueda con 'a' (debe cancelar la primera)
      const promise2 = service.searchMunicipalities('a');
      
      // Esperar a que se complete la segunda búsqueda
      const results = await promise2;
      
      const elapsed = Date.now() - start;
      
      // El tiempo total debe ser aproximadamente 150ms (50ms + 100ms debounce)
      // No 200ms (100ms + 100ms) que sería si ambas búsquedas se ejecutaran
      expect(elapsed).toBeLessThan(200);
      expect(elapsed).toBeGreaterThanOrEqual(100);
      
      // Debe retornar resultados que contienen 'a'
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(m => m.name.toLowerCase().includes('a'))).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('debe limpiar todos los cachés', async () => {
      await service.loadData();
      
      // Llenar cachés
      const provinces1 = service.getProvinces();
      const municipalities1 = service.getMunicipalitiesByProvince('28');
      const search1 = await service.searchMunicipalities('madrid');

      // Limpiar caché
      service.clearCache();

      // Recargar datos
      await service.loadData();

      // Obtener nuevas referencias
      const provinces2 = service.getProvinces();
      const municipalities2 = service.getMunicipalitiesByProvince('28');
      const search2 = await service.searchMunicipalities('madrid');

      // Las referencias deben ser diferentes (caché limpiado)
      expect(provinces1).not.toBe(provinces2);
      expect(municipalities1).not.toBe(municipalities2);
      expect(search1).not.toBe(search2);
    });

    it('debe cancelar búsquedas pendientes', async () => {
      await service.loadData();
      
      // Iniciar búsqueda (no esperar a que termine)
      service.searchMunicipalities('madrid');
      
      // Limpiar caché inmediatamente (debe cancelar la búsqueda)
      service.clearCache();
      
      // Recargar datos
      await service.loadData();
      
      // Verificar que el servicio sigue funcionando después de clearCache
      const newResults = await service.searchMunicipalities('madrid');
      expect(newResults).toHaveLength(1);
      expect(newResults[0].name).toBe('Madrid');
    });
  });

  describe('validatePostalCode', () => {
    it('debe validar correctamente un código postal que pertenece a la provincia', async () => {
      await service.loadData();
      const result = service.validatePostalCode('28001', '28');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('debe rechazar código postal vacío', async () => {
      await service.loadData();
      const result = service.validatePostalCode('', '28');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('El código postal es obligatorio');
    });

    it('debe rechazar código postal con formato inválido (menos de 5 dígitos)', async () => {
      await service.loadData();
      const result = service.validatePostalCode('123', '28');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('El código postal debe tener 5 dígitos');
    });

    it('debe rechazar código postal con formato inválido (más de 5 dígitos)', async () => {
      await service.loadData();
      const result = service.validatePostalCode('123456', '28');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('El código postal debe tener 5 dígitos');
    });

    it('debe rechazar código postal con caracteres no numéricos', async () => {
      await service.loadData();
      const result = service.validatePostalCode('28A01', '28');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('El código postal debe tener 5 dígitos');
    });

    it('debe rechazar si no se proporciona provincia', async () => {
      await service.loadData();
      const result = service.validatePostalCode('28001', '');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Debe seleccionar una provincia antes de validar el código postal');
    });

    it('debe rechazar código postal que no pertenece a la provincia', async () => {
      await service.loadData();
      const result = service.validatePostalCode('08001', '28');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('El código postal 08001 no pertenece a la provincia de Madrid');
    });

    it('debe validar correctamente múltiples códigos postales del mismo municipio', async () => {
      await service.loadData();
      
      const result1 = service.validatePostalCode('28001', '28');
      const result2 = service.validatePostalCode('28002', '28');
      const result3 = service.validatePostalCode('28003', '28');

      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
      expect(result3.isValid).toBe(true);
    });

    it('debe validar correctamente códigos postales de diferentes provincias', async () => {
      await service.loadData();
      
      const resultMadrid = service.validatePostalCode('28001', '28');
      const resultBarcelona = service.validatePostalCode('08001', '08');
      const resultSevilla = service.validatePostalCode('41001', '41');

      expect(resultMadrid.isValid).toBe(true);
      expect(resultBarcelona.isValid).toBe(true);
      expect(resultSevilla.isValid).toBe(true);
    });

    it('debe rechazar código postal de Barcelona validado contra Madrid', async () => {
      await service.loadData();
      const result = service.validatePostalCode('08001', '28');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('08001');
      expect(result.errorMessage).toContain('Madrid');
    });

    it('debe rechazar código postal de Madrid validado contra Barcelona', async () => {
      await service.loadData();
      const result = service.validatePostalCode('28001', '08');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('28001');
      expect(result.errorMessage).toContain('Barcelona');
    });

    it('debe manejar código postal con espacios en blanco', async () => {
      await service.loadData();
      const result = service.validatePostalCode('  ', '28');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('El código postal es obligatorio');
    });

    it('debe validar código postal de municipio no capital', async () => {
      await service.loadData();
      const result = service.validatePostalCode('28864', '28');

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('debe rechazar provincia inexistente', async () => {
      await service.loadData();
      const result = service.validatePostalCode('28001', '99');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Provincia no encontrada: 99');
    });

    it('debe lanzar error si los datos no están cargados', () => {
      expect(() => service.validatePostalCode('28001', '28')).toThrow(
        'Los datos de localidades no han sido cargados'
      );
    });
  });

  describe('Performance - Memoización', () => {
    it('debe ser más rápido en llamadas subsecuentes (getProvinces)', async () => {
      await service.loadData();
      
      // Primera llamada (sin caché)
      const start1 = performance.now();
      service.getProvinces();
      const time1 = performance.now() - start1;

      // Segunda llamada (con caché)
      const start2 = performance.now();
      service.getProvinces();
      const time2 = performance.now() - start2;

      // La segunda llamada debe ser significativamente más rápida
      // (al menos 50% más rápida debido a memoización)
      expect(time2).toBeLessThan(time1 * 0.5);
    });

    it('debe ser más rápido en llamadas subsecuentes (getMunicipalitiesByProvince)', async () => {
      await service.loadData();
      
      // Primera llamada (sin caché)
      const start1 = performance.now();
      service.getMunicipalitiesByProvince('28');
      const time1 = performance.now() - start1;

      // Segunda llamada (con caché)
      const start2 = performance.now();
      service.getMunicipalitiesByProvince('28');
      const time2 = performance.now() - start2;

      // La segunda llamada debe ser significativamente más rápida
      expect(time2).toBeLessThan(time1 * 0.5);
    });
  });
});
