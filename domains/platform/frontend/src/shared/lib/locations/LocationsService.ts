/**
 * LocationsService - Servicio singleton para gestionar datos de localidades españolas
 * 
 * Este servicio proporciona acceso a los datos de provincias y municipios de España,
 * implementando lazy loading y caché en memoria para optimizar el rendimiento.
 * 
 * Características:
 * - Patrón Singleton: Una única instancia en toda la aplicación
 * - Lazy Loading: Los datos se cargan solo cuando se necesitan
 * - Caché en memoria: Los datos se mantienen en memoria después de la primera carga
 * - Manejo de errores: Gestión robusta de errores de carga
 */

import type { SpainLocationsData, Province, Municipality, PostalCodeValidationResult } from './types';

/**
 * Servicio singleton para gestionar datos de localidades españolas
 */
export class LocationsService {
  /** Instancia única del servicio (patrón Singleton) */
  private static instance: LocationsService | null = null;
  
  /** Datos de localidades cargados en memoria (caché) */
  private data: SpainLocationsData | null = null;
  
  /** Indica si los datos están siendo cargados actualmente */
  private loading: boolean = false;
  
  /** Promise de carga en progreso (para evitar cargas duplicadas) */
  private loadingPromise: Promise<void> | null = null;

  /** Caché de provincias ordenadas (memoización) */
  private cachedProvinces: Province[] | null = null;

  /** Caché de municipios por provincia (memoización) */
  private municipalitiesByProvinceCache: Map<string, Municipality[]> = new Map();

  /** Caché de municipios por código (memoización) */
  private municipalityByCodeCache: Map<string, Municipality | null> = new Map();

  /** Caché de búsquedas de municipios (memoización) */
  private searchCache: Map<string, Municipality[]> = new Map();

  /** Tamaño máximo del caché de búsquedas (para evitar uso excesivo de memoria) */
  private readonly MAX_SEARCH_CACHE_SIZE = 100;

  /** Mapa de timers de debounce por clave de búsqueda */
  private searchDebounceTimers: Map<string, NodeJS.Timeout> = new Map();

  /** Tiempo de debounce para búsqueda (en milisegundos) */
  private readonly SEARCH_DEBOUNCE_MS = 100;

  /**
   * Constructor privado para implementar el patrón Singleton
   * No se puede instanciar directamente, usar getInstance()
   */
  private constructor() {
    // Constructor privado para prevenir instanciación directa
  }

  /**
   * Obtiene la instancia única del servicio (patrón Singleton)
   * 
   * @returns La instancia única de LocationsService
   * 
   * @example
   * ```typescript
   * const service = LocationsService.getInstance();
   * await service.loadData();
   * const provinces = service.getProvinces();
   * ```
   */
  public static getInstance(): LocationsService {
    if (!LocationsService.instance) {
      LocationsService.instance = new LocationsService();
    }
    return LocationsService.instance;
  }

  /**
   * Carga los datos de localidades desde el archivo JSON estático
   * 
   * Implementa lazy loading: los datos se cargan solo la primera vez que se llama.
   * Las llamadas subsecuentes retornan inmediatamente si los datos ya están cargados.
   * 
   * Si hay una carga en progreso, espera a que termine en lugar de iniciar una nueva.
   * 
   * @throws {Error} Si falla la carga del archivo JSON
   * 
   * @example
   * ```typescript
   * const service = LocationsService.getInstance();
   * try {
   *   await service.loadData();
   *   console.log('Datos cargados exitosamente');
   * } catch (error) {
   *   console.error('Error al cargar datos:', error);
   * }
   * ```
   */
  public async loadData(): Promise<void> {
    // Si los datos ya están cargados, retornar inmediatamente (caché)
    if (this.data !== null) {
      return;
    }

    // Si hay una carga en progreso, esperar a que termine
    if (this.loading && this.loadingPromise) {
      return this.loadingPromise;
    }

    // Iniciar nueva carga
    this.loading = true;
    this.loadingPromise = this._loadDataInternal();

    try {
      await this.loadingPromise;
    } finally {
      this.loading = false;
      this.loadingPromise = null;
    }
  }

  /**
   * Método interno para cargar los datos desde el archivo JSON
   * 
   * @private
   */
  private async _loadDataInternal(): Promise<void> {
    try {
      // Lazy loading: importar el archivo JSON solo cuando se necesita
      // Next.js optimizará esto para que no se incluya en el bundle inicial
      const response = await fetch('/data/spain-locations.json');
      
      if (!response.ok) {
        throw new Error(
          `Error al cargar datos de localidades: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json() as SpainLocationsData;

      // Validar que los datos tienen la estructura esperada
      if (!data.provinces || !Array.isArray(data.provinces)) {
        throw new Error('Datos de localidades inválidos: falta el array de provincias');
      }

      if (!data.municipalities || !Array.isArray(data.municipalities)) {
        throw new Error('Datos de localidades inválidos: falta el array de municipios');
      }

      // Guardar datos en caché
      this.data = data;

    } catch (error) {
      // Limpiar estado en caso de error
      this.data = null;
      
      // Re-lanzar el error con contexto adicional
      if (error instanceof Error) {
        throw new Error(`Error al cargar datos de localidades: ${error.message}`);
      } else {
        throw new Error('Error desconocido al cargar datos de localidades');
      }
    }
  }

  /**
   * Obtiene todas las provincias
   * 
   * Implementa memoización: el array ordenado se calcula solo una vez
   * y se reutiliza en llamadas subsecuentes para optimizar rendimiento.
   * 
   * @returns Array de provincias ordenadas alfabéticamente
   * @throws {Error} Si los datos no han sido cargados
   * 
   * @example
   * ```typescript
   * const service = LocationsService.getInstance();
   * await service.loadData();
   * const provinces = service.getProvinces();
   * console.log(`Total de provincias: ${provinces.length}`); // 50
   * ```
   */
  public getProvinces(): Province[] {
    this._ensureDataLoaded();
    
    // Memoización: retornar caché si ya existe
    if (this.cachedProvinces !== null) {
      return this.cachedProvinces;
    }

    // Ordenar provincias alfabéticamente por nombre
    this.cachedProvinces = [...this.data!.provinces].sort((a, b) =>
      a.name.localeCompare(b.name, 'es')
    );

    return this.cachedProvinces;
  }

  /**
   * Obtiene todos los municipios de una provincia específica
   * 
   * Implementa memoización: los resultados se cachean por código de provincia
   * para evitar filtrados repetidos y mejorar el rendimiento.
   * 
   * @param provinceCode - Código INE de la provincia (ej: "28" para Madrid)
   * @returns Array de municipios de la provincia, ordenados alfabéticamente
   * @throws {Error} Si los datos no han sido cargados
   * 
   * @example
   * ```typescript
   * const service = LocationsService.getInstance();
   * await service.loadData();
   * const municipalities = service.getMunicipalitiesByProvince("28");
   * console.log(`Municipios en Madrid: ${municipalities.length}`);
   * ```
   */
  public getMunicipalitiesByProvince(provinceCode: string): Municipality[] {
    this._ensureDataLoaded();
    
    // Memoización: retornar caché si ya existe para esta provincia
    if (this.municipalitiesByProvinceCache.has(provinceCode)) {
      return this.municipalitiesByProvinceCache.get(provinceCode)!;
    }

    // Filtrar y ordenar municipios por provincia
    const municipalities = this.data!.municipalities
      .filter((municipality) => municipality.provinceCode === provinceCode)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));

    // Guardar en caché
    this.municipalitiesByProvinceCache.set(provinceCode, municipalities);

    return municipalities;
  }

  /**
   * Obtiene un municipio específico por su código
   * 
   * Implementa memoización: los resultados se cachean por código de municipio
   * para evitar búsquedas repetidas en el array completo.
   * 
   * @param municipalityCode - Código INE del municipio (ej: "28079" para Madrid)
   * @returns El municipio encontrado o null si no existe
   * @throws {Error} Si los datos no han sido cargados
   * 
   * @example
   * ```typescript
   * const service = LocationsService.getInstance();
   * await service.loadData();
   * const madrid = service.getMunicipality("28079");
   * if (madrid) {
   *   console.log(`Capital: ${madrid.isCapital}`); // true
   * }
   * ```
   */
  public getMunicipality(municipalityCode: string): Municipality | null {
    this._ensureDataLoaded();
    
    // Memoización: retornar caché si ya existe para este código
    if (this.municipalityByCodeCache.has(municipalityCode)) {
      return this.municipalityByCodeCache.get(municipalityCode)!;
    }

    // Buscar municipio por código
    const municipality = this.data!.municipalities.find(
      (m) => m.code === municipalityCode
    ) || null;

    // Guardar en caché
    this.municipalityByCodeCache.set(municipalityCode, municipality);

    return municipality;
  }

  /**
   * Obtiene todos los códigos postales de un municipio
   * 
   * @param municipalityCode - Código INE del municipio
   * @returns Array de códigos postales del municipio
   * @throws {Error} Si los datos no han sido cargados o el municipio no existe
   * 
   * @example
   * ```typescript
   * const service = LocationsService.getInstance();
   * await service.loadData();
   * const postalCodes = service.getPostalCodesByMunicipality("28079");
   * console.log(`Códigos postales de Madrid: ${postalCodes.join(', ')}`);
   * ```
   */
  public getPostalCodesByMunicipality(municipalityCode: string): string[] {
    const municipality = this.getMunicipality(municipalityCode);
    
    if (!municipality) {
      throw new Error(`Municipio no encontrado: ${municipalityCode}`);
    }
    
    return municipality.postalCodes;
  }

  /**
   * Valida si un código postal pertenece a una provincia específica
   * 
   * Valida tanto el formato (5 dígitos) como la consistencia del código postal
   * con la provincia seleccionada. Retorna un objeto con el resultado de validación
   * y un mensaje de error descriptivo en caso de que la validación falle.
   * 
   * @param postalCode - Código postal a validar (5 dígitos)
   * @param provinceCode - Código INE de la provincia
   * @returns Objeto con isValid (boolean) y errorMessage (string opcional)
   * @throws {Error} Si los datos no han sido cargados
   * 
   * @example
   * ```typescript
   * const service = LocationsService.getInstance();
   * await service.loadData();
   * 
   * // Código postal válido
   * const result1 = service.validatePostalCode("28001", "28");
   * console.log(result1); // { isValid: true }
   * 
   * // Formato inválido
   * const result2 = service.validatePostalCode("123", "28");
   * console.log(result2); // { isValid: false, errorMessage: "El código postal debe tener 5 dígitos" }
   * 
   * // Código postal no pertenece a la provincia
   * const result3 = service.validatePostalCode("08001", "28");
   * console.log(result3); // { isValid: false, errorMessage: "El código postal 08001 no pertenece a la provincia seleccionada" }
   * ```
   */
  public validatePostalCode(postalCode: string, provinceCode: string): PostalCodeValidationResult {
    this._ensureDataLoaded();

    // Validar que el código postal no esté vacío
    if (!postalCode || postalCode.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'El código postal es obligatorio'
      };
    }

    // Validar formato del código postal (5 dígitos)
    if (!/^\d{5}$/.test(postalCode)) {
      return {
        isValid: false,
        errorMessage: 'El código postal debe tener 5 dígitos'
      };
    }

    // Validar que la provincia esté seleccionada
    if (!provinceCode || provinceCode.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Debe seleccionar una provincia antes de validar el código postal'
      };
    }

    // Buscar la provincia para obtener su nombre
    const province = this.data!.provinces.find(p => p.code === provinceCode);
    if (!province) {
      return {
        isValid: false,
        errorMessage: `Provincia no encontrada: ${provinceCode}`
      };
    }

    // Buscar si algún municipio de la provincia tiene este código postal
    const municipalities = this.getMunicipalitiesByProvince(provinceCode);
    
    const isValidForProvince = municipalities.some((municipality) =>
      municipality.postalCodes.includes(postalCode)
    );

    if (!isValidForProvince) {
      return {
        isValid: false,
        errorMessage: `El código postal ${postalCode} no pertenece a la provincia de ${province.name}`
      };
    }

    // Validación exitosa
    return {
      isValid: true
    };
  }

  /**
   * Busca municipios por nombre (búsqueda case-insensitive)
   * 
   * Implementa memoización: los resultados de búsqueda se cachean para evitar
   * filtrados repetidos. El caché tiene un límite de tamaño para evitar uso
   * excesivo de memoria.
   * 
   * Implementa debounce interno de 100ms: las búsquedas se retrasan para evitar
   * filtrados excesivos mientras el usuario escribe.
   * 
   * @param query - Texto de búsqueda
   * @param provinceCode - (Opcional) Código de provincia para filtrar resultados
   * @returns Promise que resuelve con array de municipios que coinciden con la búsqueda (máximo 50 resultados)
   * @throws {Error} Si los datos no han sido cargados
   * 
   * @example
   * ```typescript
   * const service = LocationsService.getInstance();
   * await service.loadData();
   * const results = await service.searchMunicipalities("san", "28");
   * console.log(`Municipios encontrados: ${results.length}`);
   * ```
   */
  public async searchMunicipalities(
    query: string,
    provinceCode?: string
  ): Promise<Municipality[]> {
    this._ensureDataLoaded();

    // Normalizar query para búsqueda case-insensitive
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return [];
    }

    // Crear clave de caché única para esta búsqueda
    const cacheKey = `${normalizedQuery}|${provinceCode || 'all'}`;

    // Memoización: retornar caché si ya existe para esta búsqueda
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    // Implementar debounce interno de 100ms
    return new Promise<Municipality[]>((resolve) => {
      // Cancelar búsqueda anterior para esta clave si existe
      const existingTimer = this.searchDebounceTimers.get(cacheKey);
      if (existingTimer !== undefined) {
        clearTimeout(existingTimer);
      }

      // Programar nueva búsqueda después del debounce
      const timer = setTimeout(() => {
        // Limpiar timer del mapa
        this.searchDebounceTimers.delete(cacheKey);

        // Filtrar municipios
        let municipalities: Municipality[];

        // Filtrar por provincia si se proporciona
        if (provinceCode) {
          // Usar caché de municipios por provincia si está disponible
          municipalities = this.getMunicipalitiesByProvince(provinceCode);
        } else {
          municipalities = this.data!.municipalities;
        }

        // Buscar por nombre (case-insensitive)
        const results = municipalities
          .filter((municipality) =>
            municipality.name.toLowerCase().includes(normalizedQuery)
          )
          .slice(0, 50); // Limitar resultados a 50 municipios

        // Guardar en caché (con límite de tamaño)
        if (this.searchCache.size >= this.MAX_SEARCH_CACHE_SIZE) {
          // Si el caché está lleno, eliminar la entrada más antigua
          const firstKey = this.searchCache.keys().next().value;
          if (firstKey !== undefined) {
            this.searchCache.delete(firstKey);
          }
        }
        this.searchCache.set(cacheKey, results);

        resolve(results);
      }, this.SEARCH_DEBOUNCE_MS);

      // Guardar timer en el mapa
      this.searchDebounceTimers.set(cacheKey, timer);
    });
  }

  /**
   * Verifica que los datos estén cargados, lanza error si no lo están
   * 
   * @private
   * @throws {Error} Si los datos no han sido cargados
   */
  private _ensureDataLoaded(): void {
    if (this.data === null) {
      throw new Error(
        'Los datos de localidades no han sido cargados. Llama a loadData() primero.'
      );
    }
  }

  /**
   * Limpia el caché de datos (útil para testing o para forzar recarga)
   * 
   * Limpia tanto los datos principales como todos los cachés de memoización.
   * También cancela cualquier búsqueda pendiente.
   * 
   * @example
   * ```typescript
   * const service = LocationsService.getInstance();
   * service.clearCache();
   * await service.loadData(); // Cargará los datos nuevamente
   * ```
   */
  public clearCache(): void {
    this.data = null;
    this.loading = false;
    this.loadingPromise = null;
    
    // Limpiar cachés de memoización
    this.cachedProvinces = null;
    this.municipalitiesByProvinceCache.clear();
    this.municipalityByCodeCache.clear();
    this.searchCache.clear();

    // Cancelar todas las búsquedas pendientes
    this.searchDebounceTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.searchDebounceTimers.clear();
  }

  /**
   * Verifica si los datos están cargados en caché
   * 
   * @returns true si los datos están cargados, false en caso contrario
   * 
   * @example
   * ```typescript
   * const service = LocationsService.getInstance();
   * if (!service.isDataLoaded()) {
   *   await service.loadData();
   * }
   * ```
   */
  public isDataLoaded(): boolean {
    return this.data !== null;
  }
}

// Exportar instancia por defecto para conveniencia
export default LocationsService.getInstance();
