/**
 * DashboardSkeleton Component
 * 
 * Skeleton loader para el Dashboard de Usuario.
 * Muestra un placeholder animado mientras se cargan los datos del dashboard.
 */

import React from 'react';
import { Skeleton, SkeletonText } from './Skeleton';

export interface DashboardSkeletonProps {
  /**
   * Clases CSS adicionales
   */
  className?: string;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  className = '',
}) => {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header del dashboard */}
      <div className="mb-8">
        <Skeleton height={36} width={300} variant="text" className="mb-2" />
        <Skeleton height={20} width={200} variant="text" />
      </div>

      {/* Grid de tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-3"
          >
            <Skeleton height={16} width={120} variant="text" />
            <Skeleton height={32} width={100} variant="text" />
            <Skeleton height={12} width={80} variant="text" />
          </div>
        ))}
      </div>

      {/* Layout de dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna principal (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tarjeta de pedidos recientes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton height={24} width={200} variant="text" />
              <Skeleton height={36} width={120} variant="rectangular" />
            </div>

            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2 flex-1">
                      <Skeleton height={20} width={150} variant="text" />
                      <Skeleton height={16} width={100} variant="text" />
                    </div>
                    <Skeleton height={24} width={80} variant="rectangular" />
                  </div>

                  <div className="flex items-center gap-4">
                    {Array.from({ length: 3 }).map((_, imgIndex) => (
                      <Skeleton
                        key={imgIndex}
                        width={60}
                        height={60}
                        variant="rectangular"
                      />
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Skeleton height={16} width={100} variant="text" />
                    <Skeleton height={32} width={100} variant="rectangular" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta de gráfico */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <Skeleton height={24} width={250} variant="text" className="mb-6" />
            <Skeleton height={300} width="100%" variant="rectangular" />
          </div>
        </div>

        {/* Columna lateral (1/3) */}
        <div className="space-y-8">
          {/* Tarjeta de estadísticas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <Skeleton height={24} width={150} variant="text" className="mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Skeleton height={16} width={120} variant="text" />
                  <Skeleton height={20} width={60} variant="text" />
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta de notificaciones */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton height={24} width={150} variant="text" />
              <Skeleton height={20} width={60} variant="rectangular" />
            </div>

            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex gap-3">
                  <Skeleton width={40} height={40} variant="circular" />
                  <div className="flex-1 space-y-2">
                    <Skeleton height={16} width="100%" variant="text" />
                    <Skeleton height={14} width="70%" variant="text" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta de acciones rápidas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <Skeleton height={24} width={180} variant="text" className="mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} height={44} width="100%" variant="rectangular" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * DashboardCardSkeleton Component
 * 
 * Skeleton para una tarjeta individual del dashboard
 */
export interface DashboardCardSkeletonProps {
  /**
   * Clases CSS adicionales
   */
  className?: string;
  
  /**
   * Incluir gráfico en la tarjeta
   */
  withChart?: boolean;
}

export const DashboardCardSkeleton: React.FC<DashboardCardSkeletonProps> = ({
  className = '',
  withChart = false,
}) => {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800
        rounded-lg
        shadow-sm
        p-6
        space-y-4
        ${className}
      `}
    >
      <Skeleton height={24} width={200} variant="text" />
      
      {withChart ? (
        <Skeleton height={200} width="100%" variant="rectangular" />
      ) : (
        <div className="space-y-3">
          <SkeletonText lines={3} lastLineWidth={80} />
        </div>
      )}
    </div>
  );
};

export default DashboardSkeleton;
