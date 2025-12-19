/**
 * StreetAutocomplete - Componente para autocompletar direcciones usando Nominatim (OpenStreetMap)
 * 
 * Componente que permite buscar direcciones reales en España usando la API gratuita de Nominatim.
 * Implementa debounce para no saturar la API y respeta los límites de uso.
 * 
 * Límites de Nominatim:
 * - Máximo 1 petición por segundo
 * - Uso justo (no abusar)
 * - Requiere User-Agent identificativo
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Resultado de búsqueda de Nominatim
 */
interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    province?: string;
    state?: string;
    country?: string;
  };
  lat: string;
  lon: string;
}

/**
 * Props del componente StreetAutocomplete
 */
export interface StreetAutocompleteProps {
  /** Valor actual del input */
  value: string;
  
  /** Callback cuando cambia el valor */
  onChange: (value: string) => void;
  
  /** Callback cuando se selecciona una dirección */
  onSelect?: (address: {
    street: string;
    houseNumber?: string;
    fullAddress: string;
    lat: string;
    lon: string;
  }) => void;
  
  /** Código postal para filtrar resultados (opcional) */
  postalCode?: string;
  
  /** Ciudad/Municipio para filtrar resultados (opcional) */
  city?: string;
  
  /** Provincia para filtrar resultados (opcional) */
  province?: string;
  
  /** Mensaje de error */
  error?: string;
  
  /** Placeholder del input */
  placeholder?: string;
  
  /** Si está deshabilitado */
  disabled?: boolean;
}

/**
 * Componente StreetAutocomplete
 */
export const StreetAutocomplete: React.FC<StreetAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  postalCode,
  city,
  province,
  error,
  placeholder = 'Escribe tu dirección...',
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastRequestTime = useRef<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Buscar direcciones en Nominatim
   */
  const searchAddresses = useCallback(async (query: string) => {
    // Validar query mínimo
    if (!query || query.trim().length < 5) {
      setSuggestions([]);
      return;
    }

    // Evitar búsquedas con solo "Calle" o palabras muy genéricas
    const trimmedQuery = query.trim();
    if (trimmedQuery === 'Calle' || trimmedQuery === 'Avenida' || trimmedQuery === 'Plaza') {
      setSuggestions([]);
      return;
    }

    // Respetar límite de 1 petición por segundo
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    if (timeSinceLastRequest < 1000) {
      // Esperar el tiempo restante
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }

    setIsLoading(true);

    try {
      // Construir query con filtros
      let searchQuery = query;
      
      // Agregar contexto de ciudad y provincia para mejores resultados
      if (city) {
        searchQuery += `, ${city}`;
      }
      if (province) {
        searchQuery += `, ${province}`;
      }
      searchQuery += ', España';

      // Llamar a Nominatim API
      const params = new URLSearchParams({
        q: searchQuery,
        format: 'json',
        addressdetails: '1',
        limit: '10',
        countrycodes: 'es', // Solo España
        'accept-language': 'es',
      });

      // Si hay código postal, agregarlo al query
      if (postalCode) {
        params.append('postalcode', postalCode);
      }

      // Nota: En producción, esto debería hacerse desde el backend
      // para evitar problemas de CORS y respetar los términos de uso de Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`
      );

      lastRequestTime.current = Date.now();

      if (!response.ok) {
        // Error 400 suele ser query inválido, no mostrar error al usuario
        if (response.status === 400) {
          setSuggestions([]);
          return;
        }
        throw new Error('Error al buscar direcciones');
      }

      const data: NominatimResult[] = await response.json();
      
      // Filtrar solo resultados que tengan calle
      const filtered = data.filter(result => 
        result.address?.road || result.display_name.includes('Calle')
      );

      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } catch (err) {
      console.error('Error buscando direcciones:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [city, province, postalCode]);

  /**
   * Manejar cambio en el input con debounce
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Cancelar timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Programar nueva búsqueda después de 500ms
    debounceTimer.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 500);
  };

  /**
   * Manejar selección de una sugerencia
   */
  const handleSelect = (result: NominatimResult) => {
    const street = result.address.road || '';
    const houseNumber = result.address.house_number;
    const fullAddress = result.display_name;

    // Construir dirección formateada
    let formattedAddress = street;
    if (houseNumber) {
      formattedAddress += ` ${houseNumber}`;
    }

    onChange(formattedAddress);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);

    // Notificar selección
    if (onSelect) {
      onSelect({
        street,
        houseNumber,
        fullAddress,
        lat: result.lat,
        lon: result.lon,
      });
    }
  };

  /**
   * Manejar navegación con teclado
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  /**
   * Cerrar dropdown al hacer clic fuera
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Limpiar timer al desmontar
   */
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label htmlFor="street-autocomplete" className="block text-sm font-medium text-gray-700 mb-2">
        Dirección completa *
      </label>
      
      <div className="relative">
        <input
          id="street-autocomplete"
          name="street"
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="street-address"
          className={`
            w-full px-4 py-2 pr-10 border rounded-lg bg-white text-gray-900
            focus:outline-none focus:ring-2 transition-colors duration-200
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400'}
          `}
          aria-label="Buscar dirección"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="address-suggestions"
          aria-describedby={error ? 'street-error' : undefined}
          aria-invalid={!!error}
        />
        
        {/* Indicador de carga */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {isOpen && suggestions.length > 0 && (
        <div
          id="address-suggestions"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((result, index) => (
            <div
              key={result.place_id}
              onClick={() => handleSelect(result)}
              className={`
                px-4 py-3 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0
                ${index === selectedIndex ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-900'}
              `}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="font-medium">
                {result.address.road} {result.address.house_number || ''}
              </div>
              <div className={`text-sm ${index === selectedIndex ? 'text-blue-100' : 'text-gray-500'}`}>
                {result.address.postcode && `${result.address.postcode}, `}
                {result.address.city || result.address.town || result.address.village || result.address.municipality}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <p id="street-error" className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Información sobre Nominatim */}
      <p className="mt-1 text-xs text-gray-500">
        💡 Escribe al menos 5 caracteres para buscar direcciones (ej: "Gran Vía 28")
      </p>
    </div>
  );
};

export default StreetAutocomplete;
