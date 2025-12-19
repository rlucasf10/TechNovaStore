import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/ui'

interface OrderConfirmationProps {
  orderId: string
  orderNumber?: string
  estimatedDelivery?: Date
  email?: string
}

export function OrderConfirmation({ 
  orderId, 
  orderNumber,
  estimatedDelivery,
  email 
}: OrderConfirmationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    setIsAnimating(true)
  }, [])

  // Calculate estimated delivery date (7-10 business days from now)
  const getEstimatedDeliveryDate = () => {
    if (estimatedDelivery) {
      return estimatedDelivery
    }
    const date = new Date()
    date.setDate(date.getDate() + 7) // Default: 7 days
    return date
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const deliveryDate = getEstimatedDeliveryDate()
  const displayOrderNumber = orderNumber || orderId

  return (
    <div className="text-center py-12">
      {/* Success Icon with Animation */}
      <div 
        className={`w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center transition-all duration-500 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        }`}
      >
        <svg 
          className={`w-10 h-10 text-green-600 transition-all duration-700 delay-200 ${
            isAnimating ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M5 13l4 4L19 7"
            className={isAnimating ? 'animate-draw-check' : ''}
          />
        </svg>
      </div>

      {/* Success Message */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        ¡Pedido Confirmado!
      </h1>
      
      <p className="text-lg text-gray-600 mb-2">
        Tu pedido ha sido procesado exitosamente
      </p>
      
      <p className="text-sm text-gray-500 mb-2">
        Número de pedido: <span className="font-medium text-gray-900">{displayOrderNumber}</span>
      </p>

      {/* Estimated Delivery Date */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2 text-blue-900">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-sm font-medium">Entrega estimada</p>
            <p className="text-base font-bold">{formatDate(deliveryDate)}</p>
          </div>
        </div>
      </div>

      {/* Email Confirmation Notice */}
      {email && (
        <div className="bg-gray-50 rounded-lg p-4 mb-8 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Confirmación enviada</p>
              <p className="text-sm text-gray-600">
                Hemos enviado un email de confirmación a <span className="font-medium">{email}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
        <h3 className="font-medium text-gray-900 mb-4">¿Qué sigue?</h3>
        
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-xs font-medium text-primary-600">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Confirmación por email</p>
              <p>Recibirás un email con los detalles de tu pedido</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-xs font-medium text-primary-600">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Procesamiento automático</p>
              <p>Nuestro sistema procesará tu pedido automáticamente</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-xs font-medium text-primary-600">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Seguimiento de envío</p>
              <p>Te notificaremos cuando tu pedido sea enviado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <Link href={`/pedidos/${orderId}`}>
          <Button size="lg" className="w-full sm:w-auto">
            Ver Detalles del Pedido
          </Button>
        </Link>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/productos">
            <Button variant="secondary" className="w-full sm:w-auto">
              Seguir Comprando
            </Button>
          </Link>
          
          <Link href="/dashboard/usuario">
            <Button variant="secondary" className="w-full sm:w-auto">
              Mis Pedidos
            </Button>
          </Link>
        </div>
      </div>

      {/* Support Info */}
      <div className="mt-12 pt-8 border-t">
        <p className="text-sm text-gray-500 mb-4">
          ¿Necesitas ayuda con tu pedido?
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
          <Link href="/contacto" className="text-primary-600 hover:text-primary-700">
            Contactar Soporte
          </Link>
          
          <Link href="/ayuda/pedidos" className="text-primary-600 hover:text-primary-700">
            Centro de Ayuda
          </Link>
          
          <Link href="/seguimiento" className="text-primary-600 hover:text-primary-700">
            Seguir Pedido
          </Link>
        </div>
      </div>
    </div>
  )
}