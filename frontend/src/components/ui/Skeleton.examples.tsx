/**
 * Skeleton Component Examples
 * 
 * Ejemplos de uso del componente Skeleton
 */

import React from 'react';
import { Skeleton, SkeletonText } from './Skeleton';

export const SkeletonExamples = () => {
  return (
    <div className="space-y-8 p-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Variantes de Skeleton</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Rectangular (Default)</h3>
            <Skeleton width={200} height={100} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Circular (Avatar)</h3>
            <Skeleton width={60} height={60} variant="circular" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Text (Una línea)</h3>
            <Skeleton variant="text" width="100%" height={16} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Text (Múltiples líneas)</h3>
            <SkeletonText lines={4} lastLineWidth={70} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Ejemplos Prácticos</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Skeleton */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Card con Imagen</h3>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <Skeleton width="100%" height={200} />
              <div className="p-4 space-y-3">
                <SkeletonText lines={2} lastLineWidth={80} />
                <Skeleton height={40} width="100%" />
              </div>
            </div>
          </div>

          {/* Profile Skeleton */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Perfil de Usuario</h3>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton width={64} height={64} variant="circular" />
                <div className="flex-1 space-y-2">
                  <Skeleton height={20} width="60%" variant="text" />
                  <Skeleton height={16} width="40%" variant="text" />
                </div>
              </div>
              <SkeletonText lines={3} lastLineWidth={75} />
            </div>
          </div>

          {/* List Item Skeleton */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Lista de Items</h3>
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton width={40} height={40} variant="circular" />
                  <div className="flex-1 space-y-2">
                    <Skeleton height={16} width="80%" variant="text" />
                    <Skeleton height={14} width="50%" variant="text" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Card Skeleton */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Tarjeta de Estadísticas</h3>
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <Skeleton height={16} width={120} variant="text" />
              <Skeleton height={32} width={100} variant="text" />
              <Skeleton height={12} width={80} variant="text" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Sin Animación</h2>
        <div className="space-y-2">
          <Skeleton width="100%" height={16} noAnimation />
          <Skeleton width="80%" height={16} noAnimation />
          <Skeleton width="60%" height={16} noAnimation />
        </div>
      </section>
    </div>
  );
};

export default SkeletonExamples;
