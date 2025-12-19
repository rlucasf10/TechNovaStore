'use client'

import { useRef, useEffect, useState } from 'react'
import { Grid } from 'react-window'
import { Product } from '@/types'
import { ProductCard } from './ProductCard'
import { ProductCardSkeletonGrid } from '@/ui/ProductCardSkeleton'

interface VirtualizedProductGridProps {
  /** Lista de productos a mostrar */
  products: Product[]
  /** Indica si los productos están cargando */
  isLoading?: boolean
  /** Callback cuando se agrega un producto al carrito */
  onAddToCart?: (product: Product) => void
  /** Callback cuando se hace clic en Quick View */
  onQuickView?: (product: Product) => void
  /** Número de skeletons a mostrar durante la carga */
  skeletonCount?: number
  /** Clases CSS adicionales */
  className?: string
  /** Modo de vista: grid o list */
  viewMode?: 'grid' | 'list'
}

/**
 * VirtualizedProductGrid Component
 * 
 * Grid virtualizado de productos usando react-window para optimizar el rendimiento
 * con listas largas de productos.
 * 
 * Características:
 * - Renderiza solo los productos visibles en el viewport
 * - Mejora significativa de rendimiento con +100 productos
 * - Grid responsivo que se adapta al tamaño de la ventana
 * - 4 columnas en desktop XL (≥1280px)
 * - 3 columnas en desktop (≥1024px)
 * - 2 columnas en tablet (≥640px)
 * - 1 columna en móvil (<640px)
 * 
 * Requisitos: 3.2 (Optimización de rendimiento)
 */
export function VirtualizedProductGrid({
  products,
  isLoading = false,
  onAddToCart,
  onQuickView,
  skeletonCount = 8,
  className = '',
  viewMode = 'grid'
}: VirtualizedProductGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [columnCount, setColumnCount] = useState(4)

  // Calcular dimensiones del contenedor y número de columnas
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        const height = Math.max(600, window.innerHeight - 300) // Altura mínima de 600px
        
        // Determinar número de columnas según el ancho
        let cols = 4 // XL: ≥1280px
        if (width < 640) {
          cols = 1 // Móvil
        } else if (width < 1024) {
          cols = 2 // Tablet
        } else if (width < 1280) {
          cols = 3 // Desktop
        }
        
        setColumnCount(cols)
        setDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Mostrar skeleton loading mientras carga
  if (isLoading) {
    return (
      <ProductCardSkeletonGrid 
        count={skeletonCount}
        className={className}
      />
    )
  }

  // Mostrar mensaje si no hay productos
  if (products.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No se encontraron productos
        </h3>
        <p className="text-gray-600">
          Intenta ajustar los filtros o buscar con otros términos
        </p>
      </div>
    )
  }

  // Si hay pocos productos (menos de 20), usar el grid normal sin virtualización
  if (products.length < 20) {
    const gridClasses = viewMode === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
      : 'flex flex-col gap-4'

    return (
      <div
        className={`${gridClasses} ${className}`}
        role="list"
        aria-label="Lista de productos"
      >
        {products.map((product) => (
          <div key={product.id} role="listitem">
            <ProductCard
              product={product}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
              viewMode={viewMode}
            />
          </div>
        ))}
      </div>
    )
  }

  // Calcular dimensiones de cada celda
  const gap = 24 // 24px de gap entre productos (gap-6 en Tailwind)
  const columnWidth = Math.floor((dimensions.width - (gap * (columnCount - 1))) / columnCount)
  const rowHeight = viewMode === 'grid' ? 420 : 200 // Altura aproximada de ProductCard
  const rowCount = Math.ceil(products.length / columnCount)

  // Componente de celda para react-window
  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex
    
    // Si el índice está fuera del rango de productos, renderizar div vacío
    if (index >= products.length) {
      return <div style={style} />
    }

    const product = products[index]

    return (
      <div
        style={{
          ...style,
          left: Number(style.left) + (columnIndex * gap),
          top: Number(style.top) + (rowIndex * gap),
          width: columnWidth,
          height: rowHeight - gap,
        }}
      >
        <ProductCard
          product={product}
          onAddToCart={onAddToCart}
          onQuickView={onQuickView}
          viewMode={viewMode}
        />
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className={className}
      role="list"
      aria-label="Lista virtualizada de productos"
    >
      {dimensions.width > 0 && (
        <Grid
          columnCount={columnCount}
          columnWidth={columnWidth + gap}
          defaultHeight={dimensions.height}
          defaultWidth={dimensions.width}
          rowCount={rowCount}
          rowHeight={rowHeight}
          overscanCount={2}
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          cellComponent={Cell}
          cellProps={{}}
        />
      )}
    </div>
  )
}
