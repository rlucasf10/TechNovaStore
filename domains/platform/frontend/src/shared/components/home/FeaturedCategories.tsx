'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

/**
 * FeaturedCategories - Categorías destacadas
 * 
 * Grid de 6 categorías (3x2 desktop, 2x3 móvil)
 * Con imagen de fondo, overlay, hover con zoom sutil y contador de productos
 * 
 * Requisitos: 6.1
 */

interface Category {
  name: string
  slug: string
  image: string
  description: string
  color: string
  productCount?: number
}

export function FeaturedCategories() {
  const [categories, setCategories] = useState<Category[]>([
    {
      name: 'Portátiles',
      slug: 'portatiles',
      image: '/images/categories/laptops.jpg',
      description: 'Desde 299€',
      color: 'from-blue-500 to-blue-600',
      productCount: 0
    },
    {
      name: 'Componentes PC',
      slug: 'componentes',
      image: '/images/categories/components.jpg',
      description: 'Monta tu PC',
      color: 'from-purple-500 to-purple-600',
      productCount: 0
    },
    {
      name: 'Monitores',
      slug: 'monitores',
      image: '/images/categories/monitors.jpg',
      description: 'Gaming y profesionales',
      color: 'from-green-500 to-green-600',
      productCount: 0
    },
    {
      name: 'Smartphones',
      slug: 'smartphones',
      image: '/images/categories/smartphones.jpg',
      description: 'Últimos modelos',
      color: 'from-red-500 to-red-600',
      productCount: 0
    },
    {
      name: 'Periféricos',
      slug: 'perifericos',
      image: '/images/categories/peripherals.jpg',
      description: 'Teclados, ratones...',
      color: 'from-yellow-500 to-yellow-600',
      productCount: 0
    },
    {
      name: 'Consolas',
      slug: 'consolas',
      image: '/images/categories/consoles.jpg',
      description: 'PS5, Xbox, Switch',
      color: 'from-indigo-500 to-indigo-600',
      productCount: 0
    }
  ])

  // Cargar contador de productos por categoría
  useEffect(() => {
    const fetchProductCounts = async () => {
      try {
        // Intentar obtener el contador de productos desde el API Gateway
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
        const response = await fetch(`${apiUrl}/categories`)
        if (response.ok) {
          const data = await response.json()
          // El endpoint /categories devuelve las categorías con productCount
          if (data.data && Array.isArray(data.data)) {
            const countsMap: Record<string, number> = {}
            data.data.forEach((cat: { slug: string; productCount?: number }) => {
              countsMap[cat.slug] = cat.productCount || 0
            })
            setCategories(prev => prev.map(cat => ({
              ...cat,
              productCount: countsMap[cat.slug] || cat.productCount || 0
            })))
          }
        }
      } catch {
        // Si falla, mantener los valores por defecto (silenciar error)
      }
    }

    fetchProductCounts()
  }, [])

  return (
    <section className="py-16 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Explora por Categorías
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Encuentra exactamente lo que necesitas
          </p>
        </div>

        {/* Grid: 2 columnas en móvil, 3 columnas en desktop */}
        <nav aria-label="Categorías de productos">
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/productos?category=${category.slug}`}
                  className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-gray-200 hover:shadow-xl transition-all duration-300 block"
                  aria-label={`Ver productos de ${category.name} - ${category.description}`}
                >
                  {/* Imagen de fondo con zoom sutil en hover */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90 group-hover:opacity-80 transition-all duration-300 group-hover:scale-105`}
                    style={{
                      transform: 'scale(1)',
                      transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
                    }}
                    aria-hidden="true"
                  />
                  
                  {/* Overlay oscuro sutil */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" aria-hidden="true" />
                  
                  {/* Contenido */}
                  <div className="relative h-full flex flex-col items-center justify-center p-6 text-white">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2 text-center transform group-hover:scale-105 transition-transform duration-300">
                      {category.name}
                    </h3>
                    <p className="text-sm md:text-base opacity-90 text-center mb-3">
                      {category.description}
                    </p>
                    
                    {/* Contador de productos */}
                    {category.productCount !== undefined && category.productCount > 0 && (
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                        {category.productCount} productos
                      </div>
                    )}
                    
                    {/* Flecha en hover */}
                    <div className="absolute bottom-4 right-4 transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" aria-hidden="true">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  )
}
