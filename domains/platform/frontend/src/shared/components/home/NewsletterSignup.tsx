'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

/**
 * Componente de suscripción al newsletter
 * 
 * Permite a los usuarios suscribirse al newsletter de TechNovaStore
 * para recibir ofertas exclusivas y novedades.
 */
export function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación básica
    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Por favor, ingresa un email válido')
      return
    }

    setIsLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      // TODO: Integrar con el backend cuando esté disponible
      // const response = await fetch('/api/newsletter/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // })

      // Simulación temporal
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStatus('success')
      setMessage('¡Gracias por suscribirte! Revisa tu email para confirmar.')
      setEmail('')
    } catch (error) {
      setStatus('error')
      setMessage('Hubo un error. Por favor, intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-16 bg-gradient-to-br from-primary-600 to-primary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icono decorativo */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
          </div>

          {/* Título y descripción */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Suscríbete a nuestro newsletter
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Recibe ofertas exclusivas, novedades tecnológicas y consejos de expertos directamente en tu bandeja de entrada.
          </p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  id="main-newsletter-email"
                  name="main-newsletter-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-white"
                  aria-label="Email para newsletter principal"
                  autoComplete="email"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                disabled={isLoading}
                className="bg-white text-primary-600 hover:bg-primary-50 font-semibold px-8"
              >
                {isLoading ? 'Suscribiendo...' : 'Suscribirse'}
              </Button>
            </div>

            {/* Mensajes de estado */}
            {status === 'success' && (
              <div 
                className="mt-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg text-white text-sm"
                role="alert"
                aria-live="polite"
              >
                {message}
              </div>
            )}
            {status === 'error' && (
              <div 
                className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-white text-sm"
                role="alert"
                aria-live="assertive"
              >
                {message}
              </div>
            )}

            {/* Texto legal */}
            <p className="mt-4 text-xs text-primary-200">
              Al suscribirte, aceptas recibir emails de TechNovaStore. 
              Puedes darte de baja en cualquier momento.
            </p>
          </form>

          {/* Beneficios */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-white">
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 mb-2 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span className="text-sm font-medium">Ofertas Exclusivas</span>
            </div>
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 mb-2 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium">Lanzamientos Anticipados</span>
            </div>
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 mb-2 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm font-medium">Consejos de Expertos</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
