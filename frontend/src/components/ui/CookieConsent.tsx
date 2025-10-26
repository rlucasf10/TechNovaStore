'use client'

import { useState, useEffect } from 'react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface ConsentData {
  necessary_cookies: boolean
  analytics_cookies: boolean
  marketing_cookies: boolean
  data_processing: boolean
  email_marketing: boolean
  third_party_sharing: boolean
}

interface CookieConsentProps {
  onConsentUpdate?: (_consent: ConsentData) => void
  className?: string
}

export function CookieConsent({ onConsentUpdate, className }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consent, setConsent] = useState<ConsentData>({
    necessary_cookies: true, // Always true, required for basic functionality
    analytics_cookies: false,
    marketing_cookies: false,
    data_processing: false,
    email_marketing: false,
    third_party_sharing: false,
  })

  useEffect(() => {
    // Check if user has already given consent
    const existingConsent = localStorage.getItem('cookie-consent')
    if (!existingConsent) {
      setIsVisible(true)
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted: ConsentData = {
      necessary_cookies: true,
      analytics_cookies: true,
      marketing_cookies: true,
      data_processing: true,
      email_marketing: true,
      third_party_sharing: true,
    }
    
    saveConsent(allAccepted)
  }

  const handleAcceptNecessary = () => {
    const necessaryOnly: ConsentData = {
      necessary_cookies: true,
      analytics_cookies: false,
      marketing_cookies: false,
      data_processing: false,
      email_marketing: false,
      third_party_sharing: false,
    }
    
    saveConsent(necessaryOnly)
  }

  const handleCustomConsent = () => {
    saveConsent(consent)
  }

  const saveConsent = async (consentData: ConsentData) => {
    try {
      // Save to localStorage
      localStorage.setItem('cookie-consent', JSON.stringify({
        ...consentData,
        timestamp: new Date().toISOString(),
      }))

      // Send to backend if user is authenticated
      const token = localStorage.getItem('auth-token')
      if (token) {
        await fetch('/api/gdpr/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ consent_data: consentData }),
        })
      }

      // Call callback if provided
      onConsentUpdate?.(consentData)
      
      // Hide the banner
      setIsVisible(false)
    } catch (error) {
      console.error('Error saving consent:', error)
    }
  }

  const handleConsentChange = (key: keyof ConsentData, value: boolean) => {
    setConsent(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg',
      className
    )}>
      <div className="max-w-7xl mx-auto p-4">
        {!showDetails ? (
          // Simple consent banner
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Configuración de Cookies y Privacidad
              </h3>
              <p className="text-sm text-gray-600">
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia, 
                personalizar contenido y analizar nuestro tráfico. Puedes elegir qué 
                cookies aceptar según tus preferencias.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(true)}
              >
                Personalizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcceptNecessary}
              >
                Solo Necesarias
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAcceptAll}
              >
                Aceptar Todas
              </Button>
            </div>
          </div>
        ) : (
          // Detailed consent form
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Configuración Detallada de Privacidad
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Necessary Cookies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">
                    Cookies Necesarias
                  </label>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Esenciales para el funcionamiento básico del sitio web. No se pueden desactivar.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">
                    Cookies de Análisis
                  </label>
                  <input
                    type="checkbox"
                    checked={consent.analytics_cookies}
                    onChange={(e) => handleConsentChange('analytics_cookies', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">
                    Cookies de Marketing
                  </label>
                  <input
                    type="checkbox"
                    checked={consent.marketing_cookies}
                    onChange={(e) => handleConsentChange('marketing_cookies', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Utilizadas para mostrar anuncios relevantes y medir la efectividad de campañas.
                </p>
              </div>

              {/* Data Processing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">
                    Procesamiento de Datos
                  </label>
                  <input
                    type="checkbox"
                    checked={consent.data_processing}
                    onChange={(e) => handleConsentChange('data_processing', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Consentimiento para procesar tus datos personales según nuestra política de privacidad.
                </p>
              </div>

              {/* Email Marketing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">
                    Marketing por Email
                  </label>
                  <input
                    type="checkbox"
                    checked={consent.email_marketing}
                    onChange={(e) => handleConsentChange('email_marketing', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Recibir ofertas especiales y noticias por correo electrónico.
                </p>
              </div>

              {/* Third Party Sharing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">
                    Compartir con Terceros
                  </label>
                  <input
                    type="checkbox"
                    checked={consent.third_party_sharing}
                    onChange={(e) => handleConsentChange('third_party_sharing', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Permitir compartir datos con socios comerciales para mejorar nuestros servicios.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcceptNecessary}
              >
                Solo Necesarias
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCustomConsent}
              >
                Guardar Preferencias
              </Button>
            </div>

            <div className="text-xs text-gray-500 pt-2">
              <p>
                Al continuar navegando, aceptas nuestra{' '}
                <a href="/privacy-policy" className="text-primary-600 hover:underline">
                  Política de Privacidad
                </a>{' '}
                y{' '}
                <a href="/terms" className="text-primary-600 hover:underline">
                  Términos de Servicio
                </a>
                . Cumplimos con GDPR y LOPD.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}