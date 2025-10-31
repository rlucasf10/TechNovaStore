/**
 * Página de Ejemplos de Skeleton Loaders
 * 
 * Esta página muestra ejemplos de todos los skeleton loaders implementados.
 * Útil para desarrollo y testing visual.
 */

'use client';

import React from 'react';
import {
    Skeleton,
    SkeletonText,
    ProductCardSkeleton,
    ProductCardSkeletonGrid,
    ProductDetailSkeleton,
    DashboardSkeleton,
    DashboardCardSkeleton,
} from '@/components/ui';

export default function EjemplosSkeletonPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                    Ejemplos de Skeleton Loaders
                </h1>

                {/* Skeleton Base */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        1. Skeleton Base
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Rectangular:
                            </p>
                            <Skeleton width={200} height={100} />
                        </div>

                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Circular (Avatar):
                            </p>
                            <Skeleton width={60} height={60} variant="circular" />
                        </div>

                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Text (Múltiples líneas):
                            </p>
                            <SkeletonText lines={3} lastLineWidth={70} />
                        </div>
                    </div>
                </section>

                {/* ProductCardSkeleton */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        2. ProductCardSkeleton
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Skeleton individual para ProductCard:
                        </p>
                        <div className="max-w-xs">
                            <ProductCardSkeleton />
                        </div>
                    </div>
                </section>

                {/* ProductCardSkeletonGrid */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        3. ProductCardSkeletonGrid
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Grid de skeletons para catálogo de productos:
                        </p>
                        <ProductCardSkeletonGrid count={4} />
                    </div>
                </section>

                {/* ProductDetailSkeleton */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        4. ProductDetailSkeleton
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Skeleton para página de detalle de producto:
                        </p>
                        <ProductDetailSkeleton />
                    </div>
                </section>

                {/* DashboardCardSkeleton */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        5. DashboardCardSkeleton
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Skeleton para tarjetas del dashboard:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DashboardCardSkeleton />
                            <DashboardCardSkeleton withChart />
                        </div>
                    </div>
                </section>

                {/* DashboardSkeleton */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        6. DashboardSkeleton (Completo)
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Skeleton completo para dashboard de usuario:
                        </p>
                        <DashboardSkeleton />
                    </div>
                </section>

                {/* Nota sobre animación */}
                <section className="mb-12">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            💡 Nota sobre la animación shimmer
                        </h3>
                        <p className="text-blue-800 dark:text-blue-200">
                            Todos los skeletons incluyen una animación shimmer que simula el efecto de carga.
                            La animación se adapta automáticamente al tema oscuro.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
