/**
 * ProductDetailSkeleton Component
 * 
 * Skeleton loader para la página de detalle de producto.
 * Muestra un placeholder animado mientras se cargan los datos completos del producto.
 */

import React from 'react';
import { Skeleton, SkeletonText } from './Skeleton';

export interface ProductDetailSkeletonProps {
  /**
   * Clases CSS adicionales
   */
  className?: string;
}

export const ProductDetailSkeleton: React.FC<ProductDetailSkeletonProps> = ({
  className = '',
}) => {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Skeleton height={20} width={300} variant="text" />
      </div>

      {/* Layout principal: Galería + Información */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Galería de imágenes */}
        <div className="space-y-4">
          {/* Imagen principal */}
          <div className="aspect-square rounded-lg overflow-hidden">
            <Skeleton width="100%" height="100%" variant="rectangular" />
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="aspect-square rounded-md overflow-hidden">
                <Skeleton width="100%" height="100%" variant="rectangular" />
              </div>
            ))}
          </div>
        </div>

        {/* Información del producto */}
        <div className="space-y-6">
          {/* Nombre del producto */}
          <div className="space-y-2">
            <Skeleton height={32} width="90%" variant="text" />
            <Skeleton height={32} width="70%" variant="text" />
          </div>

          {/* Rating y SKU */}
          <div className="flex items-center gap-4">
            <Skeleton width={150} height={20} variant="text" />
            <Skeleton width={100} height={20} variant="text" />
          </div>

          {/* Precio */}
          <div className="space-y-2">
            <Skeleton height={16} width={120} variant="text" />
            <Skeleton height={40} width={150} variant="text" />
            <Skeleton height={16} width={100} variant="text" />
          </div>

          {/* Disponibilidad */}
          <Skeleton height={20} width={150} variant="text" />

          {/* Selector de cantidad */}
          <div className="space-y-2">
            <Skeleton height={16} width={80} variant="text" />
            <Skeleton height={48} width={150} variant="rectangular" />
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Skeleton height={48} width="100%" variant="rectangular" />
            <Skeleton height={48} width="100%" variant="rectangular" />
          </div>

          {/* Comparador de precios */}
          <div className="border-t pt-6">
            <Skeleton height={24} width={200} variant="text" className="mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} height={60} width="100%" variant="rectangular" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de contenido */}
      <div className="mb-12">
        {/* Tab headers */}
        <div className="flex gap-6 border-b mb-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} height={40} width={120} variant="text" />
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-4">
          <SkeletonText lines={5} lastLineWidth={70} />
          <SkeletonText lines={4} lastLineWidth={80} />
        </div>
      </div>

      {/* Especificaciones técnicas */}
      <div className="mb-12">
        <Skeleton height={28} width={250} variant="text" className="mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Skeleton width={150} height={16} variant="text" />
              <Skeleton width={100} height={16} variant="text" />
            </div>
          ))}
        </div>
      </div>

      {/* Productos relacionados */}
      <div>
        <Skeleton height={28} width={250} variant="text" className="mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton width="100%" height={200} variant="rectangular" />
              <Skeleton height={16} width="100%" variant="text" />
              <Skeleton height={16} width="80%" variant="text" />
              <Skeleton height={20} width={100} variant="text" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
