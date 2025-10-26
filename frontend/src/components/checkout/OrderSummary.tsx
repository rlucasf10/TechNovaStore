import React from 'react'
import Image from 'next/image'
import { CartItem } from '@/types'
import { formatPrice } from '@/lib/utils'

interface OrderSummaryProps {
  items: CartItem[]
}

export function OrderSummary({ items }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + (item.product.our_price * item.quantity), 0)
  const shippingCost = subtotal > 50 ? 0 : 5.99 // Free shipping over €50
  const tax = subtotal * 0.21 // 21% IVA in Spain
  const total = subtotal + shippingCost + tax

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen del Pedido</h3>
      
      {/* Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
              {item.product.images && item.product.images.length > 0 ? (
                <Image
                  src={item.product.images[0]}
                  alt={item.product.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.product.name}
              </p>
              <p className="text-xs text-gray-500">
                Cantidad: {item.quantity}
              </p>
            </div>
            
            <div className="text-sm font-medium text-gray-900">
              {formatPrice(item.product.our_price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatPrice(subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Envío</span>
          <span className="text-gray-900">
            {shippingCost === 0 ? (
              <span className="text-green-600">Gratis</span>
            ) : (
              formatPrice(shippingCost)
            )}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">IVA (21%)</span>
          <span className="text-gray-900">{formatPrice(tax)}</span>
        </div>
        
        {subtotal < 50 && (
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            Añade {formatPrice(50 - subtotal)} más para envío gratuito
          </div>
        )}
        
        <div className="border-t pt-2">
          <div className="flex justify-between text-base font-medium">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Compra 100% segura
        </div>
      </div>
    </div>
  )
}