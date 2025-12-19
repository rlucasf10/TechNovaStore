'use client'

import React, { useState } from 'react'
import { Button, Input } from '@/ui'
import { CheckoutData } from '@/app/checkout/page'
import { 
  validateCardNumberLuhn, 
  detectCardType, 
  formatCardNumber,
  validateExpiryMonth,
  validateExpiryYear,
  validateCVV,
  getCardTypeName,
  getMaxCVVLength
} from '../../utils/cardValidation'
import { AcceptedCards, SecurityBadges, CardIcon } from './CardIcons'
import { secureLogger } from '@/shared/lib/security'

interface PaymentFormProps {
  initialData: Partial<CheckoutData>
  onComplete: (_data: Partial<CheckoutData>) => void
  onBack: () => void
}

export function PaymentForm({ initialData, onComplete, onBack }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'transfer'>(
    initialData.paymentMethod || 'card'
  )
  
  const [cardDetails, setCardDetails] = useState({
    number: initialData.cardDetails?.number || '',
    expiryMonth: initialData.cardDetails?.expiryMonth || '',
    expiryYear: initialData.cardDetails?.expiryYear || '',
    cvv: initialData.cardDetails?.cvv || '',
    name: initialData.cardDetails?.name || '',
  })

  const [saveCard, setSaveCard] = useState(false)
  const [showCVV, setShowCVV] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const cardType = detectCardType(cardDetails.number)
  const maxCVVLength = getMaxCVVLength(cardType)

  const handleCardInputChange = (field: string, value: string) => {
    let formattedValue = value

    // Format card number with spaces
    if (field === 'number') {
      const cleanValue = value.replace(/\s/g, '')
      // Limitar a 19 dígitos (máximo para tarjetas)
      if (cleanValue.length > 19) return
      formattedValue = formatCardNumber(cleanValue)
    }

    // Format expiry month
    if (field === 'expiryMonth') {
      formattedValue = value.replace(/\D/g, '')
      if (formattedValue.length > 2) return
      // Auto-format: si escribe "1" y luego otro número > 2, agregar "0" al inicio
      if (formattedValue.length === 2) {
        const month = parseInt(formattedValue)
        if (month > 12) {
          formattedValue = '0' + formattedValue[0]
        }
      }
    }

    // Format expiry year
    if (field === 'expiryYear') {
      formattedValue = value.replace(/\D/g, '')
      if (formattedValue.length > 4) return
    }

    // Format CVV (enmascarado)
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '')
      if (formattedValue.length > maxCVVLength) return
    }

    setCardDetails(prev => ({
      ...prev,
      [field]: formattedValue,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  const validateCardForm = () => {
    const newErrors: Record<string, string> = {}

    // Validar nombre del titular
    if (!cardDetails.name.trim()) {
      newErrors.name = 'Nombre del titular es obligatorio'
    } else if (cardDetails.name.trim().length < 3) {
      newErrors.name = 'Nombre debe tener al menos 3 caracteres'
    }

    // Validar número de tarjeta con algoritmo de Luhn
    const cardNumber = cardDetails.number.replace(/\s/g, '')
    if (!cardNumber) {
      newErrors.number = 'Número de tarjeta es obligatorio'
    } else if (!validateCardNumberLuhn(cardNumber)) {
      newErrors.number = 'Número de tarjeta inválido (verificación Luhn falló)'
    }

    // Validar mes de expiración
    if (!cardDetails.expiryMonth) {
      newErrors.expiryMonth = 'Mes es obligatorio'
    } else if (!validateExpiryMonth(cardDetails.expiryMonth)) {
      newErrors.expiryMonth = 'Mes inválido (debe ser 01-12)'
    }

    // Validar año de expiración
    if (!cardDetails.expiryYear) {
      newErrors.expiryYear = 'Año es obligatorio'
    } else if (!validateExpiryYear(cardDetails.expiryYear, cardDetails.expiryMonth)) {
      const currentYear = new Date().getFullYear()
      const year = parseInt(cardDetails.expiryYear)
      if (year < currentYear) {
        newErrors.expiryYear = 'La tarjeta ha expirado'
      } else if (year === currentYear) {
        newErrors.expiryYear = 'La tarjeta expira este mes'
      } else {
        newErrors.expiryYear = 'Año inválido'
      }
    }

    // Validar CVV
    if (!cardDetails.cvv) {
      newErrors.cvv = 'CVV es obligatorio'
    } else if (!validateCVV(cardDetails.cvv, cardType)) {
      newErrors.cvv = `CVV debe tener ${maxCVVLength} dígitos`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    let isValid = true

    if (paymentMethod === 'card') {
      isValid = validateCardForm()
    }

    if (isValid) {
      const submitData: Partial<CheckoutData> = {
        paymentMethod,
        ...(paymentMethod === 'card' && { 
          cardDetails: {
            ...cardDetails,
            // SEGURIDAD: En producción, aquí se tokenizaría la tarjeta con Stripe/PayPal
            // y solo se enviaría el token, no los datos reales
            // NUNCA almacenar estos datos en localStorage
          }
        }),
      }
      
      // Log seguro (sin datos sensibles)
      secureLogger.log('✅ Formulario de pago validado', {
        paymentMethod,
        hasCardDetails: paymentMethod === 'card',
        // NO loguear cardDetails completos
      })
      
      onComplete(submitData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Método de Pago</h2>
        
        {/* Tarjetas Aceptadas */}
        <div className="mb-6">
          <AcceptedCards />
        </div>
        
        {/* Payment Method Selection */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center p-4 border-2 rounded-lg hover:border-primary-500 transition-colors cursor-pointer"
               style={{ borderColor: paymentMethod === 'card' ? 'var(--primary-500)' : 'var(--gray-200)' }}>
            <input
              id="payment-card"
              type="radio"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value as 'card')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="payment-card" className="ml-3 flex items-center flex-1 cursor-pointer">
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Tarjeta de Crédito/Débito</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pago seguro con encriptación SSL</p>
              </div>
              <div className="flex space-x-1">
                <CardIcon type="visa" className="w-8 h-5" />
                <CardIcon type="mastercard" className="w-8 h-5" />
                <CardIcon type="amex" className="w-8 h-5" />
              </div>
            </label>
          </div>
          
          <div className="flex items-center p-4 border-2 rounded-lg hover:border-primary-500 transition-colors cursor-pointer"
               style={{ borderColor: paymentMethod === 'paypal' ? 'var(--primary-500)' : 'var(--gray-200)' }}>
            <input
              id="payment-paypal"
              type="radio"
              value="paypal"
              checked={paymentMethod === 'paypal'}
              onChange={(e) => setPaymentMethod(e.target.value as 'paypal')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="payment-paypal" className="ml-3 flex items-center flex-1 cursor-pointer">
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">PayPal</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pago rápido y seguro con tu cuenta PayPal</p>
              </div>
              <svg className="w-16 h-6" viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8h8c4 0 6 2 6 6s-2 6-6 6h-4l-1 4H12l3-16z" fill="#003087"/>
                <path d="M16 12h4c2 0 3 1 3 3s-1 3-3 3h-2l-1 4h-3l2-10z" fill="#009cde"/>
              </svg>
            </label>
          </div>
          
          <div className="flex items-center p-4 border-2 rounded-lg hover:border-primary-500 transition-colors cursor-pointer"
               style={{ borderColor: paymentMethod === 'transfer' ? 'var(--primary-500)' : 'var(--gray-200)' }}>
            <input
              id="payment-transfer"
              type="radio"
              value="transfer"
              checked={paymentMethod === 'transfer'}
              onChange={(e) => setPaymentMethod(e.target.value as 'transfer')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="payment-transfer" className="ml-3 flex-1 cursor-pointer">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Transferencia Bancaria</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Recibirás los datos bancarios por email</p>
            </label>
          </div>
        </div>

        {/* Card Details Form */}
        {paymentMethod === 'card' && (
          <div className="space-y-5 p-6 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
            <Input
              label="Nombre del titular *"
              value={cardDetails.name}
              onChange={(e) => handleCardInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="Como aparece en la tarjeta"
              autoComplete="cc-name"
            />
            
            <div className="relative">
              <Input
                label="Número de tarjeta *"
                value={cardDetails.number}
                onChange={(e) => handleCardInputChange('number', e.target.value)}
                error={errors.number}
                placeholder="1234 5678 9012 3456"
                autoComplete="cc-number"
                inputMode="numeric"
              />
              {cardDetails.number && cardType !== 'unknown' && (
                <div className="absolute right-3 top-9">
                  <CardIcon type={cardType as 'visa' | 'mastercard' | 'amex' | 'discover'} className="w-10 h-6" />
                </div>
              )}
              {cardDetails.number && cardType !== 'unknown' && (
                <p className="text-xs text-gray-600 mt-1">
                  {getCardTypeName(cardType)} detectada
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Input
                  label="Mes *"
                  value={cardDetails.expiryMonth}
                  onChange={(e) => handleCardInputChange('expiryMonth', e.target.value)}
                  error={errors.expiryMonth}
                  placeholder="MM"
                  autoComplete="cc-exp-month"
                  inputMode="numeric"
                  maxLength={2}
                />
              </div>
              
              <div>
                <Input
                  label="Año *"
                  value={cardDetails.expiryYear}
                  onChange={(e) => handleCardInputChange('expiryYear', e.target.value)}
                  error={errors.expiryYear}
                  placeholder="YYYY"
                  autoComplete="cc-exp-year"
                  inputMode="numeric"
                  maxLength={4}
                />
              </div>
              
              <div className="relative">
                <Input
                  label={`CVV * (${maxCVVLength} dígitos)`}
                  value={cardDetails.cvv}
                  onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                  error={errors.cvv}
                  placeholder={cardType === 'amex' ? '1234' : '123'}
                  autoComplete="cc-csc"
                  inputMode="numeric"
                  type={showCVV ? 'text' : 'password'}
                  maxLength={maxCVVLength}
                />
                <button
                  type="button"
                  onClick={() => setShowCVV(!showCVV)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                  title={showCVV ? 'Ocultar CVV' : 'Mostrar CVV'}
                >
                  {showCVV ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  {cardType === 'amex' ? 'Código de 4 dígitos en el frente' : 'Código de 3 dígitos en el reverso'}
                </p>
              </div>
            </div>

            {/* Opción de guardar tarjeta */}
            <div className="flex items-center pt-2">
              <input
                id="save-card"
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="save-card" className="ml-2 text-sm text-gray-700">
                Guardar esta tarjeta para futuras compras
              </label>
            </div>
            
            {/* Badges de Seguridad */}
            <div className="pt-4 border-t border-gray-200">
              <SecurityBadges />
            </div>
          </div>
        )}

        {/* PayPal Info */}
        {paymentMethod === 'paypal' && (
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Pago seguro con PayPal
                </p>
                <p className="text-sm text-blue-800">
                  Serás redirigido a PayPal para completar el pago de forma segura. 
                  No necesitas compartir tus datos bancarios con nosotros.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Info */}
        {paymentMethod === 'transfer' && (
          <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-900 mb-2">
                  Importante: Procesamiento manual
                </p>
                <p className="text-sm text-yellow-800 mb-2">
                  Tu pedido se procesará una vez recibamos la transferencia bancaria.
                </p>
                <p className="text-sm text-yellow-700">
                  Recibirás un email con:
                </p>
                <ul className="text-sm text-yellow-700 list-disc list-inside mt-1 space-y-1">
                  <li>Datos bancarios completos</li>
                  <li>Número de referencia único</li>
                  <li>Instrucciones detalladas</li>
                </ul>
                <p className="text-xs text-yellow-600 mt-3">
                  Tiempo estimado de procesamiento: 1-2 días hábiles
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
        >
          ← Volver
        </Button>
        <Button type="submit" className="flex-1">
          Continuar a Revisión →
        </Button>
      </div>
    </form>
  )
}