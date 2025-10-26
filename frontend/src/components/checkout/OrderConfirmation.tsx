import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface OrderConfirmationProps {
  orderId: string
}

export function OrderConfirmation({ orderId }: OrderConfirmationProps) {
  return (
    <div className="text-center py-12">
      {/* Success Icon */}
      <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Success Message */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        ¡Pedido Confirmado!
      </h1>
      
      <p className="text-lg text-gray-600 mb-2">
        Tu pedido ha sido procesado exitosamente
      </p>
      
      <p className="text-sm text-gray-500 mb-8">
        Número de pedido: <span className="font-medium text-gray-900">{orderId}</span>
      </p>

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
            <Button variant="outline" className="w-full sm:w-auto">
              Seguir Comprando
            </Button>
          </Link>
          
          <Link href="/cuenta/pedidos">
            <Button variant="outline" className="w-full sm:w-auto">
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