'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { campaignService } from '@/shared/services'
import type { Campaign } from '@/shared/types'

interface HeroSectionProps {
  // Props opcionales para override manual
  title?: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  backgroundImage?: string
  useDynamicCampaign?: boolean // Por defecto true
}

export default function HeroSection({
  title: titleProp,
  subtitle: subtitleProp,
  ctaText: ctaTextProp,
  ctaLink = '/productos',
  backgroundImage = '/images/hero-tech-background.jpg',
  useDynamicCampaign = true
}: HeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  // const [loading, setLoading] = useState(true) // TODO: Usar para mostrar skeleton
  
  // Obtener campaña activa desde el servicio (silencioso si no hay campaña)
  useEffect(() => {
    if (useDynamicCampaign) {
      campaignService.getActiveCampaign()
        .then(setCampaign)
        .catch(() => {
          // Silenciar error: es normal que no haya campaña activa
          setCampaign(null)
        })
        // .finally(() => setLoading(false))
    // } else {
    //   setLoading(false)
    }
  }, [useDynamicCampaign])
  
  // Usar valores de campaña o props
  const title = titleProp || campaign?.frontendConfig.hero.title || 'Tecnología de Vanguardia al Mejor Precio'
  const subtitle = subtitleProp || campaign?.frontendConfig.hero.subtitle || 'Descubre los últimos productos en informática y tecnología con comparación automática de precios y entrega rápida'
  const ctaText = ctaTextProp || campaign?.frontendConfig.hero.ctaText || 'Explorar Productos'
  const badge = campaign?.frontendConfig.hero.badge

  useEffect(() => {
    // Activar animación fade-in después de montar el componente
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <section 
      className="relative w-full h-[400px] md:h-[500px] overflow-hidden"
    >
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt="Hero background"
          fill
          className="object-cover"
          priority
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSI1MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE5MjAiIGhlaWdodD0iNTAwIiBmaWxsPSIjMTExODI3Ii8+PC9zdmc+"
        />
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Contenido */}
      <div
        className={`relative z-10 h-full flex items-center justify-center transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge de campaña (si existe) */}
          {badge && (
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold animate-pulse" role="status">
                {badge}
              </span>
            </div>
          )}

          {/* Título */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg">
            {title}
          </h1>

          {/* Subtítulo */}
          <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-6 md:mb-8 max-w-3xl mx-auto drop-shadow-md">
            {subtitle}
          </p>

          {/* CTA Button */}
          <Link
            href={ctaLink}
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {ctaText}
          </Link>

          {/* Indicador de scroll (opcional) */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
            <svg
              className="w-6 h-6 text-white/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
