/**
 * useSearch - Hook para búsqueda global
 * 
 * Proporciona funcionalidad de búsqueda con debounce y caché
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchService } from '@/services';
import type { SearchResponse } from '@/types';

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  enabled?: boolean;
}

interface UseSearchReturn {
  results: SearchResponse | null;
  isLoading: boolean;
  error: string | null;
  search: (query: string) => void;
  clearResults: () => void;
}

/**
 * Hook para búsqueda global con debounce
 * @param options - Opciones de configuración
 * @returns Estado y funciones de búsqueda
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    enabled = true,
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref para el timeout del debounce
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Función para realizar la búsqueda
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!enabled || searchQuery.length < minQueryLength) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await searchService.search(searchQuery, 10);
      setResults(searchResults);
    } catch (err) {
      setError('Error al realizar la búsqueda');
      console.error('Error en búsqueda:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, minQueryLength]);

  // Efecto para ejecutar búsqueda con debounce
  useEffect(() => {
    // Limpiar timeout anterior
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Si la query está vacía, limpiar resultados inmediatamente
    if (query.length === 0) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    // Si la query es muy corta, no buscar
    if (query.length < minQueryLength) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    // Mostrar loading inmediatamente
    setIsLoading(true);

    // Configurar nuevo timeout
    debounceTimeout.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, debounceMs, minQueryLength, performSearch]);

  // Función para actualizar la query
  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  // Función para limpiar resultados
  const clearResults = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    clearResults,
  };
}
