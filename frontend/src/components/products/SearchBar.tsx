'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useProductSearch } from '@/hooks/useProducts'
import { Product } from '@/types'
import { Input } from '@/components/ui'
import Link from 'next/link'
import Image from 'next/image'

interface SearchBarProps {
  onSearch: (_query: string) => void
  initialValue?: string
  placeholder?: string
}

export function SearchBar({ onSearch, initialValue = '', placeholder = 'Buscar productos...' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: suggestions = [], isLoading } = useProductSearch(query)

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)
    setShowSuggestions(value.length > 2)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setShowSuggestions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          const selectedProduct = suggestions[selectedIndex]
          window.location.href = `/productos/${selectedProduct.id}`
        } else {
          handleSubmit(e)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSuggestionClick = (_product: Product) => {
    setShowSuggestions(false)
    setQuery('')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            id="product-search-input"
            name="search"
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length > 2 && setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-12 py-3 text-base"
            autoComplete="off"
            role="searchbox"
            aria-label="Buscar productos"
          />
          
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setShowSuggestions(false)
                inputRef.current?.focus()
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <div className="py-2">
            {suggestions.map((product, index) => (
              <Link
                key={product.id}
                href={`/productos/${product.id}`}
                onClick={() => handleSuggestionClick(product)}
                className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                  index === selectedIndex ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Image
                      src={product.images?.[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{product.category}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(product.our_price)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Search All Results */}
          <div className="border-t border-gray-200 px-4 py-3">
            <button
              onClick={handleSubmit}
              className="w-full text-left text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver todos los resultados para &quot;{query}&quot;
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {showSuggestions && !isLoading && query.length > 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-500">No se encontraron productos</p>
            <button
              onClick={handleSubmit}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Buscar de todas formas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}