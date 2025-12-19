/**
 * ProvinceSelector - Componente para seleccionar provincia española
 * 
 * Componente funcional que muestra un dropdown con las 50 provincias de España
 * ordenadas alfabéticamente. Carga los datos desde LocationsService y gestiona
 * estados de carga y error.
 * 
 * Requisitos: 1.1
 */

'use client';

import React, { useEffect, useState } from 'react';
import { LocationsService } from '@/shared/lib/locations/LocationsService';
import type { Province } from '@/shared/lib/locations/types';

/**
 * Props del componente ProvinceSelector
 */
export interface ProvinceSelectorProps {
  /** Código de provincia seleccionado actualmente (ej: "28") */
  value: string | null;
  
  /** Callback que se ejecuta cuando el usuario selecciona una provincia */
  onChange: (provinceCode: string, provinceName: string) => void;
  
  /** Mensaje de error a mostrar (opcional) */
  error?: string;
  
  /** Indica si el selector está deshabilitado */
  disabled?: boolean;
  
  /** Texto placeholder cuando no hay selección */
  placeholder?: string;
}

/**
 * Componente ProvinceSelector
 * 
 * @example
 * ```tsx
 * <ProvinceSelector
 *   value={selectedProvince}
 *   onChange={(code) => setSelectedProvince(code)}
 *   error={errors.province}
 *   placeholder="Selecciona tu provincia"
 * />
 * ```
 */
export const ProvinceSelector: React.FC<ProvinceSelectorProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = 'Selecciona una provincia'
}) => {
  // Estado de provincias cargadas
  const [provinces, setProvinces] = useState<Province[]>([]);
  
  // Estado de carga
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Estado de error de carga
  const [loadError, setLoadError] = useState<string | null>(null);

  /**
   * Efecto para cargar las provincias al montar el componente
   */
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Obtener instancia del servicio
        const service = LocationsService.getInstance();
        
        // Cargar datos si no están cargados
        await service.loadData();
        
        // Obtener provincias ordenadas alfabéticamente
        const loadedProvinces = service.getProvinces();
        setProvinces(loadedProvinces);
        
      } catch (err) {
        // Manejar error de carga
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Error desconocido al cargar provincias';
        
        setLoadError(errorMessage);
        console.error('Error al cargar provincias:', err);
        
      } finally {
        setIsLoading(false);
      }
    };

    loadProvinces();
  }, []); // Solo ejecutar al montar

  /**
   * Handler para el cambio de selección
   */
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = event.target.value;
    
    // Solo emitir onChange si se seleccionó una provincia válida
    if (selectedCode && selectedCode !== '') {
      const province = provinces.find(p => p.code === selectedCode);
      const provinceName = province ? province.name : '';
      onChange(selectedCode, provinceName);
    }
  };

  /**
   * Determinar si el selector debe estar deshabilitado
   */
  const isDisabled = disabled || isLoading || loadError !== null;

  /**
   * Determinar el mensaje a mostrar en el placeholder
   */
  const getPlaceholderText = (): string => {
    if (isLoading) {
      return 'Cargando provincias...';
    }
    if (loadError) {
      return 'Error al cargar provincias';
    }
    return placeholder;
  };

  /**
   * Determinar si hay un error a mostrar (error de prop o error de carga)
   */
  const displayError = error || loadError;

  /**
   * Clases CSS para el select
   */
  const selectClasses = [
    'w-full',
    'px-4',
    'py-2',
    'border',
    'rounded-lg',
    'bg-white',
    'text-gray-900',
    'focus:outline-none',
    'focus:ring-2',
    'transition-colors',
    'duration-200',
    // Clases condicionales para estados
    displayError 
      ? 'border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:ring-blue-500',
    isDisabled 
      ? 'bg-gray-100 cursor-not-allowed opacity-60' 
      : 'hover:border-gray-400'
  ].join(' ');

  return (
    <div className="w-full">
      {/* Label */}
      <label 
        htmlFor="province-selector" 
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Provincia <span className="text-red-500">*</span>
      </label>

      {/* Select dropdown */}
      <select
        id="province-selector"
        value={value || ''}
        onChange={handleChange}
        disabled={isDisabled}
        className={selectClasses}
        aria-label="Seleccionar provincia"
        aria-invalid={!!displayError}
        aria-describedby={displayError ? 'province-error' : undefined}
      >
        {/* Opción placeholder */}
        <option value="" disabled>
          {getPlaceholderText()}
        </option>

        {/* Opciones de provincias */}
        {provinces.map((province) => (
          <option key={province.code} value={province.code}>
            {province.name}
          </option>
        ))}
      </select>

      {/* Mensaje de error */}
      {displayError && (
        <p 
          id="province-error" 
          className="mt-2 text-sm text-red-600"
          role="alert"
        >
          {displayError}
        </p>
      )}

      {/* Información adicional (número de provincias cargadas) */}
      {!isLoading && !loadError && provinces.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          {provinces.length} provincias disponibles
        </p>
      )}
    </div>
  );
};

export default ProvinceSelector;
