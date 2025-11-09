'use client'

import { useState, useEffect, useRef, MouseEvent } from 'react'
import Image from 'next/image'

interface ProductGalleryProps {
  images: string[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const imageRef = useRef<HTMLDivElement>(null)
  const thumbnailContainerRef = useRef<HTMLDivElement>(null)

  const displayImages = images.length > 0 ? images : ['/placeholder-product.svg']

  // Cerrar lightbox con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false)
        setIsZoomed(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isLightboxOpen])

  // Prevenir scroll del body cuando el lightbox está abierto
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isLightboxOpen])

  // Manejar zoom con posición del mouse
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setZoomPosition({ x, y })
  }

  const handleImageClick = () => {
    if (isLightboxOpen) {
      setIsZoomed(!isZoomed)
    } else {
      setIsLightboxOpen(true)
    }
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    setIsZoomed(false)
    if (direction === 'prev') {
      setSelectedImage(prev => prev === 0 ? displayImages.length - 1 : prev - 1)
    } else {
      setSelectedImage(prev => prev === displayImages.length - 1 ? 0 : prev + 1)
    }
  }

  // Navegación con teclado en lightbox
  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateImage('prev')
      } else if (e.key === 'ArrowRight') {
        navigateImage('next')
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [isLightboxOpen, selectedImage])

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div 
          ref={imageRef}
          className="aspect-square overflow-hidden rounded-lg bg-gray-100 relative cursor-pointer group"
          onClick={handleImageClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setIsZoomed(false)}
        >
          <Image
            src={displayImages[selectedImage]}
            alt={`${productName} - Imagen ${selectedImage + 1}`}
            width={600}
            height={600}
            className="h-full w-full object-cover object-center transition-opacity duration-200 group-hover:opacity-90"
            priority={selectedImage === 0}
            loading={selectedImage === 0 ? 'eager' : 'lazy'}
          />
          
          {/* Zoom Indicator */}
          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
            Click para ampliar
          </div>

          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigateImage('prev')
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2.5 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Imagen anterior"
              >
                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigateImage('next')
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2.5 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Imagen siguiente"
              >
                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Image Counter */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium">
              {selectedImage + 1} / {displayImages.length}
            </div>
          )}
        </div>

        {/* Thumbnail Images con scroll horizontal */}
        {displayImages.length > 1 && (
          <div className="relative">
            <div 
              ref={thumbnailContainerRef}
              className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2"
              style={{ scrollbarWidth: 'thin' }}
            >
              {displayImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedImage(index)
                    setIsZoomed(false)
                  }}
                  className={`flex-shrink-0 w-20 h-20 overflow-hidden rounded-md bg-gray-100 border-2 transition-all ${
                    selectedImage === index 
                      ? 'border-primary-500 ring-2 ring-primary-200' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  aria-label={`Ver imagen ${index + 1}`}
                >
                  <Image
                    src={image}
                    alt={`${productName} - Miniatura ${index + 1}`}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => {
            setIsLightboxOpen(false)
            setIsZoomed(false)
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => {
              setIsLightboxOpen(false)
              setIsZoomed(false)
            }}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors z-10"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium z-10">
            {selectedImage + 1} / {displayImages.length}
          </div>

          {/* Zoom Indicator */}
          <div className="absolute top-4 left-4 bg-white/10 text-white px-4 py-2 rounded-md text-sm font-medium z-10">
            {isZoomed ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
                Click para alejar
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
                Click para ampliar
              </span>
            )}
          </div>

          {/* Main Image Container */}
          <div 
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center px-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className={`relative w-full h-full flex items-center justify-center overflow-hidden ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={handleImageClick}
              onMouseMove={handleMouseMove}
            >
              <Image
                src={displayImages[selectedImage]}
                alt={`${productName} - Imagen ${selectedImage + 1}`}
                width={1200}
                height={1200}
                className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
                  isZoomed ? 'scale-200' : 'scale-100'
                }`}
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }
                    : undefined
                }
                priority
              />
            </div>

            {/* Navigation Arrows */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateImage('prev')
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-colors"
                  aria-label="Imagen anterior"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateImage('next')
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-colors"
                  aria-label="Imagen siguiente"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Navigation */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl">
              <div className="flex gap-2 overflow-x-auto px-4 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-white/10">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImage(index)
                      setIsZoomed(false)
                    }}
                    className={`flex-shrink-0 w-16 h-16 overflow-hidden rounded-md border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-white ring-2 ring-white/50' 
                        : 'border-white/30 hover:border-white/60'
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <Image
                      src={image}
                      alt={`${productName} - Miniatura ${index + 1}`}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover object-center"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard Hints */}
          <div className="absolute bottom-4 right-4 bg-white/10 text-white px-4 py-2 rounded-md text-xs space-y-1">
            <div>← → Navegar</div>
            <div>ESC Cerrar</div>
          </div>
        </div>
      )}
    </>
  )
}