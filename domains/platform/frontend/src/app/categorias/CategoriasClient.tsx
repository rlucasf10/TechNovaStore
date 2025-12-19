'use client'

import { useCategories } from '@/catalog'
import Link from 'next/link'

/**
 * Componente cliente para mostrar las categorías
 * Separado del Server Component para mantener la interactividad
 */
export default function CategoriasClient() {
  const { data: categories = [], isLoading } = useCategories()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {categories
        .filter(cat => !cat.parent_id)
        .map((category) => (
          <Link
            key={category.id}
            href={`/productos?category=${category.slug}`}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
          </Link>
        ))}
    </div>
  )
}
