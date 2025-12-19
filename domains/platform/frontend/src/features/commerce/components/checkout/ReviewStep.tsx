import { useState } from 'react'
import Image from 'next/image'
import { type CartItem } from '@/commerce'
import { Button } from '@/ui'
import { formatPrice } from '@/lib/utils'
import { type Address } from '@/types'

interface ReviewStepProps {
  items: CartItem[]
  shippingAddress?: Address
  billingAddress?: Address
  paymentMethod?: 'card' | 'paypal' | 'transfer'
  cardDetails?: {
    number: string
    name: string
  }
  onConfirm: () => void
  onBack: () => void
  onEditShipping: () => void
  onEditPayment: () => void
  isProcessing?: boolean
}

export function ReviewStep({
  items,
  shippingAddress,
  paymentMethod,
  cardDetails,
  onConfirm,
  onBack,
  onEditShipping,
  onEditPayment,
  isProcessing = false,
}: ReviewStepProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shippingCost = subtotal > 50 ? 0 : 5.99
  const tax = subtotal * 0.21 // 21% IVA
  const total = subtotal + shippingCost + tax

  const handleConfirm = () => {
    if (!acceptedTerms) {
      return
    }
    onConfirm()
  }

  // Mask card number for display
  const getMaskedCardNumber = (number: string) => {
    if (!number) return ''
    const last4 = number.slice(-4)
    return `•••• •••• •••• ${last4}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Revisión Final</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Revisa tu pedido antes de confirmar la compra
        </p>
      </div>

      {/* Products Summary */}
      <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Productos ({items.length})
          </h3>
        </div>
        
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cantidad: {item.quantity}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Dirección de Envío</h3>
          <button
            type="button"
            onClick={onEditShipping}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            disabled={isProcessing}
          >
            Editar
          </button>
        </div>
        
        {shippingAddress ? (
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>{shippingAddress.street}</p>
            <p>
              {shippingAddress.city}, {shippingAddress.postal_code}
            </p>
            <p>
              {shippingAddress.state}, {shippingAddress.country}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No se ha proporcionado dirección de envío</p>
        )}
      </div>

      {/* Payment Method */}
      <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Método de Pago</h3>
          <button
            type="button"
            onClick={onEditPayment}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            disabled={isProcessing}
          >
            Editar
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {paymentMethod === 'card' && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Tarjeta de Crédito/Débito</p>
                {cardDetails && (
                  <>
                    <p className="text-xs text-gray-500">{getMaskedCardNumber(cardDetails.number)}</p>
                    <p className="text-xs text-gray-500">{cardDetails.name}</p>
                  </>
                )}
              </div>
            </div>
          )}
          
          {paymentMethod === 'paypal' && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.633h8.14c2.97 0 4.968 1.238 5.46 3.39.246 1.073.163 2.02-.24 2.82-.403.8-1.11 1.44-2.05 1.85-.94.41-2.13.62-3.55.62H11.3l-.82 5.19a.641.641 0 0 1-.633.74H7.076z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">PayPal</p>
                <p className="text-xs text-gray-500">Pago seguro con PayPal</p>
              </div>
            </div>
          )}
          
          {paymentMethod === 'transfer' && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Transferencia Bancaria</p>
                <p className="text-xs text-gray-500">Recibirás instrucciones por email</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Desglose de Costos</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="text-gray-900 dark:text-gray-100">{formatPrice(subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Envío</span>
            <span className="text-gray-900 dark:text-gray-100">
              {shippingCost === 0 ? (
                <span className="text-green-600 dark:text-green-400 font-medium">Gratis</span>
              ) : (
                formatPrice(shippingCost)
              )}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">IVA (21%)</span>
            <span className="text-gray-900 dark:text-gray-100">{formatPrice(tax)}</span>
          </div>
          
          {subtotal < 50 && shippingCost > 0 && (
            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
              💡 Añade {formatPrice(50 - subtotal)} más para envío gratuito
            </div>
          )}
          
          <div className="border-t border-gray-200 dark:border-slate-700 pt-2 mt-2">
            <div className="flex justify-between text-base font-semibold">
              <span className="text-gray-900 dark:text-gray-100">Total</span>
              <span className="text-gray-900 dark:text-gray-100">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            disabled={isProcessing}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Acepto los{' '}
            <a
              href="/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
            >
              términos y condiciones
            </a>
            {' '}y la{' '}
            <a
              href="/politica-privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
            >
              política de privacidad
            </a>
          </span>
        </label>
        
        {!acceptedTerms && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-7">
            Debes aceptar los términos y condiciones para continuar
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={isProcessing}
          className="sm:w-auto"
        >
          Volver
        </Button>
        
        <Button
          onClick={handleConfirm}
          disabled={!acceptedTerms || isProcessing}
          loading={isProcessing}
          className="flex-1 sm:flex-initial"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando pedido...
            </span>
          ) : (
            'Confirmar Pedido'
          )}
        </Button>
      </div>

      {/* Security Notice */}
      <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 pt-2">
        <svg className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Compra 100% segura con cifrado SSL
      </div>
    </div>
  )
}
