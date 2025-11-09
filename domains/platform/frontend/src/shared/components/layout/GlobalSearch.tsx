'use client';

/**
 * GlobalSearch - Componente de búsqueda global
 * 
 * Características:
 * - Autocompletado con debounce de 300ms
 * - Navegación por teclado (↑↓ Enter)
 * - Shortcut Ctrl+K / Cmd+K
 * - Agrupación de resultados por tipo
 * - Highlight de términos coincidentes
 * - Límite de 10 resultados (3 productos, 3 categorías, 4 marcas)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Package, Tag, Layers } from 'lucide-react';
import { useSearch } from '@/catalog';
import type { SearchResult } from '@/types';

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

export function GlobalSearch({ 
  placeholder = 'Buscar productos, categorías, marcas...', 
  className = '' 
}: GlobalSearchProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMounted, setIsMounted] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { results, isLoading, search, clearResults } = useSearch({
    debounceMs: 300,
    minQueryLength: 2,
  });

  // Detectar si estamos en el cliente para evitar hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Aplanar todos los resultados para navegación por teclado
  const allResults = results
    ? [
        ...(results.products || []).slice(0, 3),
        ...(results.categories || []).slice(0, 3),
        ...(results.brands || []).slice(0, 4),
      ]
    : [];

  // Shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    if (!isMounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMounted]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!isMounted) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMounted]);

  // Manejar cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    search(value);
    setSelectedIndex(-1);
    
    if (value.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Manejar navegación por teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || allResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allResults.length) {
          handleResultClick(allResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Manejar clic en resultado
  const handleResultClick = useCallback((result: SearchResult) => {
    let url = '';
    
    switch (result.type) {
      case 'product':
        url = `/productos/${result.slug || result.id}`;
        break;
      case 'category':
        url = `/categorias/${result.slug || result.id}`;
        break;
      case 'brand':
        url = `/productos?brand=${encodeURIComponent(result.name)}`;
        break;
    }

    if (url) {
      router.push(url);
      handleClear();
    }
  }, [router]);

  // Limpiar búsqueda
  const handleClear = () => {
    setInputValue('');
    clearResults();
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Highlight de términos coincidentes
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-primary-100 text-primary-700 font-medium">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  // Obtener icono según tipo
  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'category':
        return <Layers className="w-4 h-4" />;
      case 'brand':
        return <Tag className="w-4 h-4" />;
    }
  };

  // Renderizar grupo de resultados
  const renderResultGroup = (
    title: string,
    items: SearchResult[],
    startIndex: number
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="py-2">
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </div>
        {items.map((item, index) => {
          const globalIndex = startIndex + index;
          const isSelected = globalIndex === selectedIndex;

          return (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => handleResultClick(item)}
              onMouseEnter={() => setSelectedIndex(globalIndex)}
              role="option"
              aria-selected={isSelected}
              className={`
                w-full px-4 py-3 flex items-center gap-3 text-left transition-colors
                ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'}
              `}
            >
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                ${isSelected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}
              `}>
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  getIcon(item.type)
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {highlightMatch(item.name, inputValue)}
                </div>
                {item.category && (
                  <div className="text-xs text-gray-500 truncate">
                    {item.category}
                  </div>
                )}
                {item.productCount !== undefined && (
                  <div className="text-xs text-gray-500">
                    {item.productCount} productos
                  </div>
                )}
              </div>

              {item.price !== undefined && (
                <div className="flex-shrink-0 text-sm font-semibold text-primary-600">
                  ${item.price.toFixed(2)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          id="global-search"
          name="search"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Búsqueda global"
          aria-autocomplete="list"
          aria-controls={isOpen ? 'search-results' : undefined}
          aria-expanded={isOpen}
          className="
            block w-full pl-10 pr-10 py-2 
            border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            text-sm placeholder-gray-400
            transition-all
          "
        />

        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Hint del shortcut */}
        {!inputValue && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div
          ref={dropdownRef}
          id="search-results"
          role="listbox"
          aria-label="Resultados de búsqueda"
          className="
            absolute top-full left-0 right-0 mt-2
            bg-white rounded-lg shadow-lg border border-gray-200
            max-h-[500px] overflow-y-auto
            z-50
          "
        >
          {isLoading && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <div className="mt-2">Buscando...</div>
            </div>
          )}

          {!isLoading && results && allResults.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No se encontraron resultados para &quot;{inputValue}&quot;
            </div>
          )}

          {!isLoading && results && allResults.length > 0 && (
            <>
              {renderResultGroup('Productos', (results.products || []).slice(0, 3), 0)}
              {renderResultGroup('Categorías', (results.categories || []).slice(0, 3), (results.products || []).slice(0, 3).length)}
              {renderResultGroup('Marcas', (results.brands || []).slice(0, 4), (results.products || []).slice(0, 3).length + (results.categories || []).slice(0, 3).length)}
              
              {/* Footer con total de resultados */}
              {results.total > 10 && (
                <div className="px-4 py-3 border-t border-gray-200 text-center">
                  <button
                    onClick={() => {
                      router.push(`/productos?q=${encodeURIComponent(inputValue)}`);
                      handleClear();
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Ver todos los resultados ({results.total})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
