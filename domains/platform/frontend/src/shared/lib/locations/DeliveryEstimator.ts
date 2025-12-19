/**
 * DeliveryEstimator - Servicio para calcular estimaciones de tiempo de entrega
 * 
 * Este servicio calcula el tiempo estimado de entrega basándose en la distancia
 * desde el centro de distribución (Madrid) hasta la ubicación del cliente.
 * 
 * Utiliza la fórmula de Haversine para calcular distancias entre coordenadas
 * geográficas en la superficie de una esfera (la Tierra).
 * 
 * Zonas de entrega:
 * - Madrid (28): 24-48 horas (1-2 días)
 * - Península < 600km: 2-3 días laborables
 * - Península >= 600km: 3-4 días laborables
 * - Islas Baleares (07): 3-5 días laborables
 * - Islas Canarias (35, 38): 4-6 días laborables
 * - Ceuta y Melilla (51, 52): 4-6 días laborables
 */

import type { DeliveryEstimate, Province } from './types';
import { LocationsService } from './LocationsService';

/**
 * Coordenadas del centro de distribución (Madrid)
 * Ubicación: Centro de Madrid, España
 */
const DISTRIBUTION_CENTER = {
  lat: 40.4168,
  lng: -3.7038
} as const;

/**
 * Radio de la Tierra en kilómetros
 * Utilizado en la fórmula de Haversine
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Servicio para calcular estimaciones de tiempo de entrega
 */
export class DeliveryEstimator {
  /** Instancia del servicio de localidades */
  private locationsService: LocationsService;

  /**
   * Constructor del DeliveryEstimator
   * 
   * @param locationsService - Instancia del servicio de localidades (opcional, usa singleton por defecto)
   */
  constructor(locationsService?: LocationsService) {
    this.locationsService = locationsService || LocationsService.getInstance();
  }

  /**
   * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
   * 
   * La fórmula de Haversine calcula la distancia del círculo máximo entre dos puntos
   * en la superficie de una esfera dadas sus latitudes y longitudes.
   * 
   * Fórmula:
   * a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlng/2)
   * c = 2 * atan2(√a, √(1−a))
   * d = R * c
   * 
   * Donde:
   * - Δlat = lat2 - lat1
   * - Δlng = lng2 - lng1
   * - R = radio de la Tierra (6371 km)
   * 
   * @param lat1 - Latitud del primer punto (en grados)
   * @param lng1 - Longitud del primer punto (en grados)
   * @param lat2 - Latitud del segundo punto (en grados)
   * @param lng2 - Longitud del segundo punto (en grados)
   * @returns Distancia en kilómetros
   * 
   * @example
   * ```typescript
   * const estimator = new DeliveryEstimator();
   * // Distancia de Madrid a Barcelona
   * const distance = estimator.calculateDistance(40.4168, -3.7038, 41.3851, 2.1734);
   * console.log(`Distancia: ${distance.toFixed(2)} km`); // ~504 km
   * ```
   */
  public calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Convertir grados a radianes
    const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);
    const deltaLatRad = toRadians(lat2 - lat1);
    const deltaLngRad = toRadians(lng2 - lng1);

    // Aplicar fórmula de Haversine
    // a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlng/2)
    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLngRad / 2) *
        Math.sin(deltaLngRad / 2);

    // c = 2 * atan2(√a, √(1−a))
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // d = R * c
    const distance = EARTH_RADIUS_KM * c;

    return distance;
  }

  /**
   * Calcula la distancia desde el centro de distribución (Madrid) hasta una provincia
   * 
   * @param province - Provincia de destino
   * @returns Distancia en kilómetros
   * 
   * @example
   * ```typescript
   * const estimator = new DeliveryEstimator();
   * const service = LocationsService.getInstance();
   * await service.loadData();
   * const provinces = service.getProvinces();
   * const barcelona = provinces.find(p => p.code === "08");
   * if (barcelona) {
   *   const distance = estimator.calculateDistanceFromDistributionCenter(barcelona);
   *   console.log(`Distancia a Barcelona: ${distance.toFixed(2)} km`);
   * }
   * ```
   */
  public calculateDistanceFromDistributionCenter(province: Province): number {
    return this.calculateDistance(
      DISTRIBUTION_CENTER.lat,
      DISTRIBUTION_CENTER.lng,
      province.coordinates.lat,
      province.coordinates.lng
    );
  }

  /**
   * Estima el tiempo de entrega para una provincia específica
   * 
   * Lógica de zonas:
   * - Madrid (código 28): "24-48 horas" (1-2 días)
   * - Península < 600km: "2-3 días laborables"
   * - Península >= 600km: "3-4 días laborables"
   * - Islas Baleares (código 07): "3-5 días laborables"
   * - Islas Canarias (códigos 35, 38): "4-6 días laborables"
   * - Ceuta y Melilla (códigos 51, 52): "4-6 días laborables"
   * 
   * @param provinceCode - Código INE de la provincia (ej: "28" para Madrid)
   * @returns Estimación de entrega con días y zona
   * @throws {Error} Si los datos no han sido cargados o la provincia no existe
   * 
   * @example
   * ```typescript
   * const estimator = new DeliveryEstimator();
   * const service = LocationsService.getInstance();
   * await service.loadData();
   * 
   * const madridEstimate = estimator.estimateDelivery("28");
   * console.log(madridEstimate.days); // "24-48 horas"
   * console.log(madridEstimate.zone); // "madrid"
   * 
   * const barcelonaEstimate = estimator.estimateDelivery("08");
   * console.log(barcelonaEstimate.days); // "2-3 días laborables"
   * console.log(barcelonaEstimate.zone); // "peninsula"
   * ```
   */
  public estimateDelivery(provinceCode: string): DeliveryEstimate {
    // Obtener la provincia desde el servicio de localidades
    const provinces = this.locationsService.getProvinces();
    const province = provinces.find((p) => p.code === provinceCode);

    if (!province) {
      throw new Error(`Provincia no encontrada: ${provinceCode}`);
    }

    // Caso especial: Madrid (centro de distribución)
    if (provinceCode === '28') {
      return {
        days: '24-48 horas',
        daysMin: 1,
        daysMax: 2,
        zone: 'madrid'
      };
    }

    // Caso especial: Islas Baleares
    if (provinceCode === '07') {
      return {
        days: '3-5 días laborables',
        daysMin: 3,
        daysMax: 5,
        zone: 'balearic'
      };
    }

    // Caso especial: Islas Canarias (Las Palmas: 35, Santa Cruz de Tenerife: 38)
    if (provinceCode === '35' || provinceCode === '38') {
      return {
        days: '4-6 días laborables',
        daysMin: 4,
        daysMax: 6,
        zone: 'canary'
      };
    }

    // Caso especial: Ceuta y Melilla
    if (provinceCode === '51' || provinceCode === '52') {
      return {
        days: '4-6 días laborables',
        daysMin: 4,
        daysMax: 6,
        zone: 'ceuta-melilla'
      };
    }

    // Península: calcular distancia desde Madrid
    const distance = this.calculateDistanceFromDistributionCenter(province);

    // Península cercana (< 600km)
    if (distance < 600) {
      return {
        days: '2-3 días laborables',
        daysMin: 2,
        daysMax: 3,
        zone: 'peninsula'
      };
    }

    // Península lejana (>= 600km)
    return {
      days: '3-4 días laborables',
      daysMin: 3,
      daysMax: 4,
      zone: 'peninsula'
    };
  }

  /**
   * Estima el tiempo de entrega para un municipio específico
   * 
   * Utiliza la provincia del municipio para calcular la estimación.
   * 
   * @param municipalityCode - Código INE del municipio (ej: "28079" para Madrid)
   * @returns Estimación de entrega con días y zona
   * @throws {Error} Si los datos no han sido cargados o el municipio no existe
   * 
   * @example
   * ```typescript
   * const estimator = new DeliveryEstimator();
   * const service = LocationsService.getInstance();
   * await service.loadData();
   * 
   * const estimate = estimator.estimateDeliveryByMunicipality("28079");
   * console.log(estimate.days); // "24-48 horas"
   * ```
   */
  public estimateDeliveryByMunicipality(municipalityCode: string): DeliveryEstimate {
    // Obtener el municipio desde el servicio de localidades
    const municipality = this.locationsService.getMunicipality(municipalityCode);

    if (!municipality) {
      throw new Error(`Municipio no encontrado: ${municipalityCode}`);
    }

    // Usar la provincia del municipio para calcular la estimación
    return this.estimateDelivery(municipality.provinceCode);
  }
}

// Exportar instancia por defecto para conveniencia
export default new DeliveryEstimator();
