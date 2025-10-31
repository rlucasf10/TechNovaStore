/**
 * ProductCardSkeleton Component
 * 
 * Skeleton loader para ProductCard.
 * Muestra un placeholder animado mientras se cargan los datos del producto.
 */

import React from 'react';
import { Skeleton } from './Skeleton';

export interface ProductCardSkeletonProps {
  /**
   * Clases CSS adicionales
   */
  className?: string;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800
        rounded-lg
        shadow-sm
        overflow-hidden
        ${className}
      `}
      aria-label="Cargando producto..."
    >
      {/* Imagen del producto */}
      <div className="relative aspect-square">
        <Skeleton width="100%" height="100%" variant="rectangular" />
        
        {/* Badge de descuento (placeholder) */}
        <div className="absolute top-2 right-2">
          <Skeleton width={60} height={24} variant="rectangular" />
        </div>
      </div>

      {/* Contenido del card */}
      <div className="p-4 space-y-3">
        {/* Nombre del producto (2 líneas) */}
        <div className="space-y-2">
          <Skeleton height={16} width="100%" variant="text" />
          <Skeleton height={16} width="80%" variant="text" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <Skeleton width={100} height={16} variant="text" />
          <Skeleton width={40} height={16} variant="text" />
        </div>

        {/* Precio */}
        <div className="space-y-1">
          <Skeleton height={12} width={80} variant="text" />
          <Skeleton height={20} width={100} variant="text" />
        </div>

        {/* Botón de agregar al carrito */}
        <Skeleton height={40} width="100%" variant="rectangular" />
      </div>
    </div>
  );
};

/**
 * ProductCardSkeletonGrid Component
 * 
 * Grid de múltiples ProductCardSkeleton para mostrar durante la carga del catálogo
 */
export interface ProductCardSkeletonGridProps {
  /**
   * Número de skeletons a mostrar
   */
  count?: number;
  
  /**
   * Clases CSS adicionales para el grid
   */
  className?: string;
}

export const ProductCardSkeletonGrid: React.FC<ProductCardSkeletonGridProps> = ({
  count = 8,
  className = '',
}) => {
  return (
    <div
      className={`
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        gap-6
        ${className}
      `}
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default ProductCardSkeleton;
