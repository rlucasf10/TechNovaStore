'use client'

import { useState } from 'react'
import { Rating, Button, Badge } from '@/components/ui'

interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  comment: string
  date: Date
  verified: boolean
  helpful: number
  images?: string[]
}

interface ProductReviewsProps {
  productId: string
  averageRating: number
  totalReviews: number
  reviews?: Review[]
}

export function ProductReviews({ 
  averageRating, 
  totalReviews,
  reviews = []
}: ProductReviewsProps) {
  const [selectedFilter, setSelectedFilter] = useState<number | 'all'>('all')

  // Calcular distribución de ratings
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => Math.floor(r.rating) === stars).length
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
    return { stars, count, percentage }
  })

  // Filtrar reviews según el filtro seleccionado
  const filteredReviews = selectedFilter === 'all' 
    ? reviews 
    : reviews.filter(r => Math.floor(r.rating) === selectedFilter)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  return (
    <div className="space-y-8">
      {/* Resumen de Rating */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Rating promedio */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <Rating value={averageRating} size="lg" readOnly />
            <p className="text-sm text-gray-600 mt-2">
              Basado en {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'}
            </p>
          </div>

          {/* Distribución por estrellas */}
          <div className="space-y-2">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <button
                key={stars}
                onClick={() => setSelectedFilter(stars)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  selectedFilter === stars 
                    ? 'bg-primary-50 border border-primary-200' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium text-gray-700">{stars}</span>
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
        <Button
          variant={selectedFilter === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setSelectedFilter('all')}
        >
          Todas
        </Button>
        {[5, 4, 3, 2, 1].map(stars => (
          <Button
            key={stars}
            variant={selectedFilter === stars ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedFilter(stars)}
          >
            {stars}★
          </Button>
        ))}
      </div>

      {/* Lista de Reviews */}
      <div className="space-y-6">
        {filteredReviews.length > 0 ? (
          filteredReviews.map(review => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {review.userAvatar ? (
                    <img 
                      src={review.userAvatar} 
                      alt={review.userName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-lg">
                        {review.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenido de la review */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{review.userName}</h4>
                        {review.verified && (
                          <Badge variant="success" size="sm">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Compra verificada
                          </Badge>
                        )}
                      </div>
                      <Rating value={review.rating} size="sm" readOnly />
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(review.date)}
                    </span>
                  </div>

                  {review.title && (
                    <h5 className="font-semibold text-gray-900 mb-2">
                      {review.title}
                    </h5>
                  )}

                  <p className="text-gray-700 mb-3">
                    {review.comment}
                  </p>

                  {/* Imágenes de la review */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Imagen ${index + 1} de la reseña`}
                          className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                        />
                      ))}
                    </div>
                  )}

                  {/* Botón de útil */}
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span>Útil ({review.helpful})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-gray-500">
              {selectedFilter === 'all' 
                ? 'Aún no hay reseñas para este producto' 
                : `No hay reseñas con ${selectedFilter} estrellas`}
            </p>
          </div>
        )}
      </div>

      {/* Botón para escribir review */}
      <div className="border-t border-gray-200 pt-6">
        <Button variant="primary" size="lg" className="w-full sm:w-auto">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Escribir una reseña
        </Button>
        <p className="text-sm text-gray-500 mt-2">
          Comparte tu experiencia con este producto
        </p>
      </div>
    </div>
  )
}
