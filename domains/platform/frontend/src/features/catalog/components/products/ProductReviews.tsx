'use client'

import { useState, useEffect, useCallback } from 'react'
import { Rating, Button, Badge, Input } from '@/ui'
import { AnimatedModal } from '@/ui/AnimatedModal'
import { reviewService, type Review, type ReviewStats, type GetReviewsParams } from '@/shared/services/reviewService'
import { useAuthStore } from '@/customer/store/auth.store'
import { useToast } from '@/hooks/useToast'

interface ProductReviewsProps {
  productId: string
  averageRating?: number
  totalReviews?: number
  reviews?: Review[] // Para compatibilidad con datos estáticos
}

export function ProductReviews({ 
  productId,
  averageRating: initialAverageRating = 0,
  totalReviews: initialTotalReviews = 0,
}: ProductReviewsProps) {
  // Estado de autenticación
  const { isAuthenticated } = useAuthStore()
  const toast = useToast()

  // Estado de reviews
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: initialAverageRating,
    totalReviews: initialTotalReviews,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estado de paginación y filtros
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<GetReviewsParams['sortBy']>('newest')

  // Estado del modal de crear review
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 0, title: '', comment: '' })
  const [submitting, setSubmitting] = useState(false)
  
  // Estado para imágenes
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)


  // Cargar reviews
  const loadReviews = useCallback(async (resetPage = false) => {
    try {
      if (resetPage) {
        setLoading(true)
        setPage(1)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      const params: GetReviewsParams = {
        page: resetPage ? 1 : page,
        limit: 10,
        sortBy,
        ...(selectedFilter !== 'all' && { rating: selectedFilter })
      }

      const response = await reviewService.getProductReviews(productId, params)

      if (response.success) {
        if (resetPage) {
          setReviews(response.data.reviews)
        } else {
          setReviews(prev => [...prev, ...response.data.reviews])
        }
        setStats(response.data.stats)
        setHasMore(response.data.pagination.hasMore)
      }
    } catch (err: any) {
      console.error('Error al cargar reviews:', err)
      setError('No se pudieron cargar las reviews')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [productId, page, selectedFilter, sortBy])

  // Cargar reviews al montar y cuando cambian los filtros
  useEffect(() => {
    loadReviews(true)
  }, [productId, selectedFilter, sortBy])

  // Cargar más reviews
  const handleLoadMore = () => {
    setPage(prev => prev + 1)
    loadReviews(false)
  }

  // Cambiar filtro de rating
  const handleFilterChange = (filter: number | 'all') => {
    setSelectedFilter(filter)
  }

  // Cambiar ordenamiento
  const handleSortChange = (newSort: GetReviewsParams['sortBy']) => {
    setSortBy(newSort)
  }


  // Votar review
  const handleVote = async (reviewId: string, helpful: boolean) => {
    if (!isAuthenticated) {
      toast.warning('Inicia sesión para votar', 'Autenticación requerida')
      return
    }

    try {
      const response = await reviewService.voteReview(reviewId, helpful)
      if (response.success) {
        // Actualizar el estado local de la review
        setReviews(prev => prev.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              helpfulCount: response.data.helpfulCount,
              notHelpfulCount: response.data.notHelpfulCount,
              userVote: response.data.userVote
            }
          }
          return review
        }))
        toast.success('Voto registrado', '¡Gracias!')
      }
    } catch (err: any) {
      console.error('Error al votar:', err)
      // Manejar error 403 (intentando votar en tu propia review)
      if (err.response?.status === 403) {
        toast.warning('No se puede votar en tu propia review', 'Acción no permitida')
      } else {
        toast.error('No se pudo registrar el voto', 'Error')
      }
    }
  }

  // Manejar selección de imágenes
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    const maxImages = 5
    const currentCount = selectedImages.length

    if (currentCount + newFiles.length > maxImages) {
      toast.warning(`Solo puedes subir hasta ${maxImages} imágenes`, 'Límite alcanzado')
      return
    }

    // Validar tamaño (máximo 5MB por imagen)
    const maxSize = 5 * 1024 * 1024
    const validFiles = newFiles.filter(file => {
      if (file.size > maxSize) {
        toast.warning(`${file.name} es demasiado grande (máx 5MB)`, 'Archivo muy grande')
        return false
      }
      if (!file.type.startsWith('image/')) {
        toast.warning(`${file.name} no es una imagen válida`, 'Tipo inválido')
        return false
      }
      return true
    })

    // Crear URLs de preview
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file))
    
    setSelectedImages(prev => [...prev, ...validFiles])
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls])
  }

  // Eliminar imagen seleccionada
  const handleRemoveImage = (index: number) => {
    // Revocar URL para liberar memoria
    URL.revokeObjectURL(imagePreviewUrls[index])
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  // Subir imágenes a un servicio (simulado por ahora - en producción usar S3, Cloudinary, etc.)
  const uploadImages = async (files: File[]): Promise<{ url: string; thumbnailUrl?: string }[]> => {
    // Por ahora, convertimos las imágenes a base64 para almacenarlas
    // En producción, esto debería subir a un servicio de almacenamiento
    const uploadedImages: { url: string; thumbnailUrl?: string }[] = []
    
    for (const file of files) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      
      uploadedImages.push({
        url: base64,
        thumbnailUrl: base64
      })
    }
    
    return uploadedImages
  }

  // Crear review
  const handleCreateReview = async () => {
    if (!isAuthenticated) {
      toast.warning('Inicia sesión para escribir una review', 'Autenticación requerida')
      return
    }

    if (newReview.rating === 0) {
      toast.warning('Selecciona una calificación', 'Campo requerido')
      return
    }

    if (newReview.title.trim().length < 5) {
      toast.warning('El título debe tener al menos 5 caracteres', 'Campo requerido')
      return
    }

    if (newReview.comment.trim().length < 10) {
      toast.warning('El comentario debe tener al menos 10 caracteres', 'Campo requerido')
      return
    }

    try {
      setSubmitting(true)
      
      // Subir imágenes si hay
      let uploadedImages: { url: string; thumbnailUrl?: string }[] = []
      if (selectedImages.length > 0) {
        setUploadingImages(true)
        try {
          uploadedImages = await uploadImages(selectedImages)
        } catch (uploadErr) {
          console.error('Error al subir imágenes:', uploadErr)
          toast.warning('No se pudieron subir las imágenes, pero la review se publicará sin ellas', 'Advertencia')
        } finally {
          setUploadingImages(false)
        }
      }
      
      const response = await reviewService.createReview(productId, {
        rating: newReview.rating,
        title: newReview.title.trim(),
        comment: newReview.comment.trim(),
        images: uploadedImages
      })

      if (response.success) {
        toast.success('Review publicada exitosamente', '¡Gracias por tu opinión!')
        setShowCreateModal(false)
        setNewReview({ rating: 0, title: '', comment: '' })
        // Limpiar imágenes
        imagePreviewUrls.forEach(url => URL.revokeObjectURL(url))
        setSelectedImages([])
        setImagePreviewUrls([])
        // Recargar reviews
        loadReviews(true)
      }
    } catch (err: any) {
      console.error('Error al crear review:', err)
      if (err.response?.status === 409) {
        toast.error('Ya has dejado una review para este producto', 'Error')
      } else {
        toast.error('No se pudo publicar la review', 'Error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString))
  }


  // Calcular distribución de ratings para la barra de progreso
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => {
    const count = stats.ratingDistribution[stars as keyof typeof stats.ratingDistribution] || 0
    const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
    return { stars, count, percentage }
  })

  return (
    <div className="space-y-8" id="reviews">
      {/* Resumen de Rating */}
      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Rating promedio */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {stats.averageRating.toFixed(1)}
            </div>
            <Rating value={stats.averageRating} size="lg" readOnly />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Basado en {stats.totalReviews} {stats.totalReviews === 1 ? 'reseña' : 'reseñas'}
            </p>
          </div>

          {/* Distribución por estrellas */}
          <div className="space-y-2">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <button
                key={stars}
                onClick={() => handleFilterChange(stars)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  selectedFilter === stars 
                    ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700' 
                    : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stars}</span>
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Filtros y ordenamiento */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar:</span>
          <Button
            variant={selectedFilter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleFilterChange('all')}
          >
            Todas
          </Button>
          {[5, 4, 3, 2, 1].map(stars => (
            <Button
              key={stars}
              variant={selectedFilter === stars ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange(stars)}
            >
              {stars}★
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as GetReviewsParams['sortBy'])}
            className="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="helpful">Más útiles</option>
            <option value="rating_high">Mayor calificación</option>
            <option value="rating_low">Menor calificación</option>
          </select>
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => loadReviews(true)} className="mt-4">
            Reintentar
          </Button>
        </div>
      )}


      {/* Lista de Reviews */}
      {!loading && !error && (
        <div className="space-y-6">
          {reviews.length > 0 ? (
            <>
              {reviews.map(review => (
                <div key={review.id} className="border-b border-gray-200 dark:border-slate-700 pb-6 last:border-0">
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
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{review.userName}</h4>
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
                        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>

                      {review.title && (
                        <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {review.title}
                        </h5>
                      )}

                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {review.comment}
                      </p>

                      {/* Imágenes de la review */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto">
                          {review.images.map((image, index) => (
                            <img
                              key={index}
                              src={image.url}
                              alt={`Imagen ${index + 1} de la reseña`}
                              className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity flex-shrink-0"
                            />
                          ))}
                        </div>
                      )}


                      {/* Botones de votos */}
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleVote(review.id, true)}
                          className={`flex items-center gap-2 text-sm transition-colors ${
                            review.userVote === true 
                              ? 'text-green-600 dark:text-green-400 font-medium' 
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                          <span>Útil ({review.helpfulCount})</span>
                        </button>
                        <button 
                          onClick={() => handleVote(review.id, false)}
                          className={`flex items-center gap-2 text-sm transition-colors ${
                            review.userVote === false 
                              ? 'text-red-600 dark:text-red-400 font-medium' 
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
                        >
                          <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                          <span>No útil ({review.notHelpfulCount})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Botón cargar más */}
              {hasMore && (
                <div className="text-center pt-4">
                  <Button
                    variant="ghost"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                        Cargando...
                      </>
                    ) : (
                      'Cargar más reviews'
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">
                {selectedFilter === 'all' 
                  ? 'Aún no hay reseñas para este producto. ¡Sé el primero en opinar!' 
                  : `No hay reseñas con ${selectedFilter} estrellas`}
              </p>
            </div>
          )}
        </div>
      )}


      {/* Botón para escribir review */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full sm:w-auto"
          onClick={() => {
            if (!isAuthenticated) {
              toast.warning('Inicia sesión para escribir una review', 'Autenticación requerida')
              return
            }
            setShowCreateModal(true)
          }}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Escribir una reseña
        </Button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Comparte tu experiencia con este producto
        </p>
      </div>

      {/* Modal para crear review */}
      <AnimatedModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Escribir una reseña"
        size="lg"
        animationType="slideUp"
      >
        <div className="space-y-6">
          {/* Selector de rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tu calificación *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                  className="focus:outline-none"
                >
                  <svg
                    className={`w-8 h-8 transition-colors ${
                      star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {newReview.rating > 0 ? `${newReview.rating} de 5` : 'Selecciona'}
              </span>
            </div>
          </div>

          {/* Título */}
          <div>
            <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título de tu reseña *
            </label>
            <Input
              id="review-title"
              type="text"
              placeholder="Resume tu experiencia en una frase"
              value={newReview.title}
              onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{newReview.title.length}/100 caracteres</p>
          </div>

          {/* Comentario */}
          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tu opinión *
            </label>
            <textarea
              id="review-comment"
              rows={5}
              placeholder="Cuéntanos más sobre tu experiencia con este producto..."
              value={newReview.comment}
              onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
              maxLength={2000}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{newReview.comment.length}/2000 caracteres</p>
          </div>

          {/* Subir imágenes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Agregar fotos (opcional)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Puedes subir hasta 5 imágenes (máx 5MB cada una)
            </p>
            
            {/* Preview de imágenes seleccionadas */}
            {imagePreviewUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Botón para agregar imágenes */}
            {selectedImages.length < 5 && (
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedImages.length === 0 ? 'Haz clic para agregar fotos' : 'Agregar más fotos'}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
            <Button
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateReview}
              disabled={submitting || uploadingImages || newReview.rating === 0}
            >
              {uploadingImages ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Subiendo imágenes...
                </>
              ) : submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publicando...
                </>
              ) : (
                'Publicar reseña'
              )}
            </Button>
          </div>
        </div>
      </AnimatedModal>
    </div>
  )
}
