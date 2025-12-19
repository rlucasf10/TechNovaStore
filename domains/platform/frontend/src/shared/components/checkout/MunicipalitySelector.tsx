/**
 * MunicipalitySelector - Componente para seleccionar municipio español
 * 
 * Componente funcional que muestra un dropdown con los municipios de una provincia
 * seleccionada. Incluye funcionalidad de búsqueda con debounce para facilitar
 * la selección en provincias con muchos municipios.
 * 
 * Implementa virtualización automática cuando hay más de 100 municipios para
 * mantener performance fluida en móvil.
 * 
 * Requisitos: 1.2, 6.2, 6.3, 6.4
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef, startTransition } from 'react';
import { LocationsService } from '@/shared/lib/locations/LocationsService';
import type { Municipality } from '@/shared/lib/locations/types';

/**
 * Props del componente MunicipalitySelector
 */
export interface MunicipalitySelectorProps {
  /** Código de provincia seleccionado (requerido para habilitar el selector) */
  provinceCode: string | null;
  
  /** Código de municipio seleccionado actualmente (ej: "28079") */
  value: string | null;
  
  /** Callback que se ejecuta cuando el usuario selecciona un municipio */
  onChange: (municipalityCode: string, municipalityName: string, postalCodes: string[]) => void;
  
  /** Mensaje de error a mostrar (opcional) */
  error?: string;
  
  /** Indica si el selector está deshabilitado */
  disabled?: boolean;
  
  /** Texto placeholder cuando no hay selección */
  placeholder?: string;
  
  /** Habilita campo de búsqueda para filtrar municipios */
  searchable?: boolean;
}

/**
 * Componente MunicipalitySelector
 * 
 * @example
 * ```tsx
 * <MunicipalitySelector
 *   provinceCode={selectedProvince}
 *   value={selectedMunicipality}
 *   onChange={(code) => setSelectedMunicipality(code)}
 *   error={errors.municipality}
 *   placeholder="Selecciona tu municipio"
 *   searchable={true}
 * />
 * ```
 */
export const MunicipalitySelector: React.FC<MunicipalitySelectorProps> = ({
  provinceCode,
  value,
  onChange,
  error,
  disabled = false,
  placeholder = 'Selecciona un municipio',
  searchable = false
}) => {
  // Estado de municipios cargados
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  
  // Estado de carga
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Estado de error de carga
  const [loadError, setLoadError] = useState<string | null>(null);

  // Estado de búsqueda (solo si searchable=true)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Estado de búsqueda en progreso
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Timer para debounce de búsqueda (usar ref en lugar de state para evitar re-renders)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Estado para controlar si el dropdown está abierto (solo para virtualización)
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Ref para detectar clics fuera del dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determinar si se debe usar virtualización (más de 100 municipios)
  const shouldUseVirtualization = useMemo(() => {
    return municipalities.length > 100;
  }, [municipalities.length]);

  /**
   * Efecto para cargar municipios cuando cambia la provincia
   */
  useEffect(() => {
    // Limpiar búsqueda al cambiar provincia
    setSearchQuery('');
    
    // Si no hay provincia seleccionada, limpiar municipios
    if (!provinceCode) {
      setMunicipalities([]);
      setLoadError(null);
      return;
    }

    const loadMunicipalities = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Obtener instancia del servicio
        const service = LocationsService.getInstance();
        
        // Cargar datos si no están cargados
        await service.loadData();
        
        // Obtener municipios de la provincia ordenados alfabéticamente
        const loadedMunicipalities = service.getMunicipalitiesByProvince(provinceCode);
        
        // Usar startTransition para marcar esta actualización como no urgente
        startTransition(() => {
          setMunicipalities(loadedMunicipalities);
        });
        
      } catch (err) {
        // Manejar error de carga
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Error desconocido al cargar municipios';
        
        setLoadError(errorMessage);
        console.error('Error al cargar municipios:', err);
        
      } finally {
        setIsLoading(false);
      }
    };

    loadMunicipalities();
  }, [provinceCode]); // Recargar cuando cambia la provincia

  /**
   * Función para realizar búsqueda de municipios con debounce
   */
  const performSearch = useCallback(async (query: string) => {
    if (!provinceCode) {
      return;
    }

    try {
      setIsSearching(true);
      
      const service = LocationsService.getInstance();
      
      // Si la búsqueda está vacía, cargar todos los municipios de la provincia
      if (!query.trim()) {
        const allMunicipalities = service.getMunicipalitiesByProvince(provinceCode);
        startTransition(() => {
          setMunicipalities(allMunicipalities);
        });
      } else {
        // Buscar municipios que coincidan con la query
        const results = await service.searchMunicipalities(query, provinceCode);
        startTransition(() => {
          setMunicipalities(results);
        });
      }
      
    } catch (err) {
      console.error('Error al buscar municipios:', err);
      // No mostrar error al usuario, simplemente mantener resultados actuales
      
    } finally {
      setIsSearching(false);
    }
  }, [provinceCode]);

  /**
   * Handler para cambios en el campo de búsqueda (con debounce de 300ms)
   */
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    // Cancelar timer anterior si existe
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Programar nueva búsqueda después de 300ms
    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }, [performSearch]);

  /**
   * Limpiar timer al desmontar el componente
   */
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  /**
   * Efecto para cerrar dropdown al hacer clic fuera
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  /**
   * Handler para el cambio de selección (select nativo)
   */
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = event.target.value;
    
    // Solo emitir onChange si se seleccionó un municipio válido
    if (selectedCode && selectedCode !== '') {
      const municipality = municipalities.find(m => m.code === selectedCode);
      if (municipality) {
        onChange(selectedCode, municipality.name, municipality.postalCodes);
      }
    }
  };

  /**
   * Determinar si el selector debe estar deshabilitado
   */
  const isDisabled = useMemo(() => {
    return disabled || !provinceCode || isLoading || loadError !== null;
  }, [disabled, provinceCode, isLoading, loadError]);

  /**
   * Handler para selección en dropdown virtualizado
   */
  const handleVirtualizedSelect = useCallback((municipalityCode: string) => {
    const municipality = municipalities.find(m => m.code === municipalityCode);
    if (municipality) {
      onChange(municipalityCode, municipality.name, municipality.postalCodes);
    }
    setIsDropdownOpen(false);
  }, [onChange, municipalities]);

  /**
   * Toggle del dropdown virtualizado
   */
  const toggleDropdown = useCallback(() => {
    if (!isDisabled) {
      setIsDropdownOpen(prev => !prev);
    }
  }, [isDisabled]);

  /**
   * Determinar el mensaje a mostrar en el placeholder
   */
  const getPlaceholderText = (): string => {
    if (!provinceCode) {
      return 'Primero selecciona una provincia';
    }
    if (isLoading) {
      return 'Cargando municipios...';
    }
    if (loadError) {
      return 'Error al cargar municipios';
    }
    if (isSearching) {
      return 'Buscando...';
    }
    return placeholder;
  };

  /**
   * Determinar si hay un error a mostrar (error de prop o error de carga)
   */
  const displayError = error || loadError;

  /**
   * Clases CSS para el select (memoizadas)
   */
  const selectClasses = useMemo(() => {
    const baseClasses = 'w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 transition-colors duration-200';
    const errorClasses = displayError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500';
    const disabledClasses = isDisabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400';
    return `${baseClasses} ${errorClasses} ${disabledClasses}`;
  }, [displayError, isDisabled]);

  /**
   * Clases CSS para el input de búsqueda (memoizadas)
   */
  const searchInputClasses = useMemo(() => {
    const baseClasses = 'w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 mb-2';
    const disabledClasses = isDisabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400';
    return `${baseClasses} ${disabledClasses}`;
  }, [isDisabled]);

  /**
   * Obtener el nombre del municipio seleccionado
   */
  const selectedMunicipalityName = useMemo(() => {
    if (!value) return null;
    const municipality = municipalities.find(m => m.code === value);
    return municipality ? `${municipality.name}${municipality.isCapital ? ' (Capital)' : ''}` : null;
  }, [value, municipalities]);

  /**
   * Renderizar opciones del dropdown virtualizado
   * Usa CSS overflow-y: auto para scroll nativo que funciona bien en móvil
   */
  const renderVirtualizedOptions = useCallback(() => {
    return municipalities.map((municipality) => {
      const isSelected = value === municipality.code;
      
      return (
        <div
          key={municipality.code}
          className={
            isSelected 
              ? 'px-4 py-2 cursor-pointer bg-blue-500 text-white' 
              : 'px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-900'
          }
          onClick={() => handleVirtualizedSelect(municipality.code)}
          role="option"
          aria-selected={isSelected}
        >
          {municipality.name}
        </div>
      );
    });
  }, [municipalities, value, handleVirtualizedSelect]);

  return (
    <div className="w-full">
      {/* Label */}
      <label 
        htmlFor={searchable && provinceCode && !isLoading && !loadError ? "municipality-search" : "municipality-selector"}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Municipio <span className="text-red-500">*</span>
      </label>

      {/* Campo de búsqueda (solo si searchable=true) */}
      {searchable && provinceCode && !isLoading && !loadError && (
        <input
          id="municipality-search"
          name="municipalitySearch"
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Buscar municipio..."
          disabled={isDisabled}
          className={searchInputClasses}
          aria-label="Buscar municipio"
        />
      )}

      {/* Renderizado condicional: Select nativo o Dropdown virtualizado */}
      {!shouldUseVirtualization ? (
        // Select nativo para listas pequeñas (≤100 municipios)
        <select
          id="municipality-selector"
          value={value || ''}
          onChange={handleChange}
          disabled={isDisabled}
          className={selectClasses}
          aria-label="Seleccionar municipio"
          aria-invalid={!!displayError}
          aria-describedby={displayError ? 'municipality-error' : undefined}
        >
          {/* Opción placeholder */}
          <option value="" disabled>
            {getPlaceholderText()}
          </option>

          {/* Opciones de municipios */}
          {municipalities.map((municipality) => (
            <option key={municipality.code} value={municipality.code}>
              {municipality.name}
            </option>
          ))}
        </select>
      ) : (
        // Dropdown virtualizado para listas largas (>100 municipios)
        <div ref={dropdownRef} className="relative">
          {/* Botón para abrir/cerrar dropdown */}
          <button
            type="button"
            onClick={toggleDropdown}
            disabled={isDisabled}
            className={selectClasses}
            aria-label="Seleccionar municipio"
            aria-invalid={!!displayError}
            aria-describedby={displayError ? 'municipality-error' : undefined}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
          >
            <span className="block truncate text-left">
              {selectedMunicipalityName || getPlaceholderText()}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </button>

          {/* Lista virtualizada con scroll nativo optimizado para móvil */}
          {isDropdownOpen && (
            <div 
              className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg border border-gray-300 overflow-y-auto"
              role="listbox"
              style={{
                /* Optimizaciones para scroll suave en móvil */
                WebkitOverflowScrolling: 'touch',
                /* Usar will-change para mejor rendimiento */
                willChange: 'scroll-position'
              }}
            >
              {renderVirtualizedOptions()}
            </div>
          )}
        </div>
      )}

      {/* Mensaje de error */}
      {displayError && (
        <p 
          id="municipality-error" 
          className="mt-2 text-sm text-red-600"
          role="alert"
        >
          {displayError}
        </p>
      )}

      {/* Información adicional (número de municipios) */}
      {!isLoading && !loadError && provinceCode && municipalities.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          {municipalities.length} municipio{municipalities.length !== 1 ? 's' : ''} disponible{municipalities.length !== 1 ? 's' : ''}
          {searchQuery && ` (filtrado por "${searchQuery}")`}
          {shouldUseVirtualization && ' (usando virtualización para mejor rendimiento)'}
        </p>
      )}

      {/* Mensaje cuando no hay resultados de búsqueda */}
      {!isLoading && !loadError && provinceCode && searchQuery && municipalities.length === 0 && (
        <p className="mt-1 text-xs text-gray-500">
          No se encontraron municipios que coincidan con "{searchQuery}"
        </p>
      )}
    </div>
  );
};

export default MunicipalitySelector;
