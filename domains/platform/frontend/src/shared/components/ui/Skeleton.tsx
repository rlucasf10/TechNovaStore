/**
 * Skeleton Component
 * 
 * Componente base para crear efectos de carga tipo skeleton con animación shimmer.
 * Se usa como building block para crear skeletons más complejos.
 */

import React from 'react';

export interface SkeletonProps {
  /**
   * Ancho del skeleton (puede ser número en px o string con unidades)
   */
  width?: number | string;
  
  /**
   * Alto del skeleton (puede ser número en px o string con unidades)
   */
  height?: number | string;
  
  /**
   * Variante del skeleton
   */
  variant?: 'text' | 'circular' | 'rectangular';
  
  /**
   * Clases CSS adicionales
   */
  className?: string;
  
  /**
   * Deshabilitar animación shimmer
   */
  noAnimation?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'rectangular',
  className = '',
  noAnimation = false,
}) => {
  // Convertir width y height a strings CSS
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  // Clases base según variante
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  return (
    <div
      className={`
        bg-gray-200 dark:bg-gray-700
        ${variantClasses[variant]}
        ${!noAnimation ? 'animate-shimmer' : ''}
        ${className}
      `}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
      aria-hidden="true"
    />
  );
};

/**
 * SkeletonText Component
 * 
 * Skeleton optimizado para texto con múltiples líneas
 */
export interface SkeletonTextProps {
  /**
   * Número de líneas de texto
   */
  lines?: number;
  
  /**
   * Ancho de la última línea (porcentaje)
   */
  lastLineWidth?: number;
  
  /**
   * Clases CSS adicionales
   */
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = 60,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          height={16}
          width={index === lines - 1 ? `${lastLineWidth}%` : '100%'}
        />
      ))}
    </div>
  );
};

export default Skeleton;
