'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CheckoutData } from '@/app/checkout/page'

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

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleCardInputChange = (field: string, value: string) => {
    let formattedValue = value

    // Format card number with spaces
    if (field === 'number') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
      if (formattedValue.length > 19) return // Max 16 digits + 3 spaces
    }

    // Format expiry month/year
    if (field === 'expiryMonth' || field === 'expiryYear') {
      formattedValue = value.replace(/\D/g, '')
      if (field === 'expiryMonth' && formattedValue.length > 2) return
      if (field === 'expiryYear' && formattedValue.length > 4) return
    }

    // Format CVV
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '')
      if (formattedValue.length > 4) return
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

    if (!cardDetails.name.trim()) {
      newErrors.name = 'Nombre del titular es obligatorio'
    }

    const cardNumber = cardDetails.number.replace(/\s/g, '')
    if (!cardNumber) {
      newErrors.number = 'Número de tarjeta es obligatorio'
    } else if (cardNumber.length < 13 || cardNumber.length > 19) {
      newErrors.number = 'Número de tarjeta inválido'
    }

    if (!cardDetails.expiryMonth) {
      newErrors.expiryMonth = 'Mes es obligatorio'
    } else {
      const month = parseInt(cardDetails.expiryMonth)
      if (month < 1 || month > 12) {
        newErrors.expiryMonth = 'Mes inválido'
      }
    }

    if (!cardDetails.expiryYear) {
      newErrors.expiryYear = 'Año es obligatorio'
    } else {
      const year = parseInt(cardDetails.expiryYear)
      const currentYear = new Date().getFullYear()
      if (year < currentYear || year > currentYear + 20) {
        newErrors.expiryYear = 'Año inválido'
      }
    }

    if (!cardDetails.cvv) {
      newErrors.cvv = 'CVV es obligatorio'
    } else if (cardDetails.cvv.length < 3 || cardDetails.cvv.length > 4) {
      newErrors.cvv = 'CVV inválido'
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
        ...(paymentMethod === 'card' && { cardDetails }),
      }
      
      onComplete(submitData)
    }
  }

  const getCardType = (number: string) => {
    const cleanNumber = number.replace(/\s/g, '')
    if (cleanNumber.startsWith('4')) return 'visa'
    if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) return 'mastercard'
    if (cleanNumber.startsWith('3')) return 'amex'
    return 'unknown'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-6">Método de Pago</h2>
        
        {/* Payment Method Selection */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center">
            <input
              id="payment-card"
              type="radio"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value as 'card')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="payment-card" className="ml-3 flex items-center">
              <span className="text-sm font-medium text-gray-700">Tarjeta de Crédito/Débito</span>
              <div className="ml-2 flex space-x-1">
                <span className="text-xs text-gray-500">Visa, MC</span>
              </div>
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="payment-paypal"
              type="radio"
              value="paypal"
              checked={paymentMethod === 'paypal'}
              onChange={(e) => setPaymentMethod(e.target.value as 'paypal')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="payment-paypal" className="ml-3 flex items-center">
              <span className="text-sm font-medium text-gray-700">PayPal</span>
              <span className="ml-2 text-xs text-blue-600 font-medium">PP</span>
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="payment-transfer"
              type="radio"
              value="transfer"
              checked={paymentMethod === 'transfer'}
              onChange={(e) => setPaymentMethod(e.target.value as 'transfer')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="payment-transfer" className="ml-3">
              <span className="text-sm font-medium text-gray-700">Transferencia Bancaria</span>
              <p className="text-xs text-gray-500">Recibirás los datos bancarios por email</p>
            </label>
          </div>
        </div>

        {/* Card Details Form */}
        {paymentMethod === 'card' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <Input
              label="Nombre del titular *"
              value={cardDetails.name}
              onChange={(e) => handleCardInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="Como aparece en la tarjeta"
            />
            
            <div className="relative">
              <Input
                label="Número de tarjeta *"
                value={cardDetails.number}
                onChange={(e) => handleCardInputChange('number', e.target.value)}
                error={errors.number}
                placeholder="1234 5678 9012 3456"
              />
              {cardDetails.number && (
                <div className="absolute right-3 top-8">
                  {getCardType(cardDetails.number) === 'visa' && (
                    <span className="text-xs font-medium text-blue-600">VISA</span>
                  )}
                  {getCardType(cardDetails.number) === 'mastercard' && (
                    <span className="text-xs font-medium text-red-600">MC</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Mes *"
                value={cardDetails.expiryMonth}
                onChange={(e) => handleCardInputChange('expiryMonth', e.target.value)}
                error={errors.expiryMonth}
                placeholder="MM"
              />
              
              <Input
                label="Año *"
                value={cardDetails.expiryYear}
                onChange={(e) => handleCardInputChange('expiryYear', e.target.value)}
                error={errors.expiryYear}
                placeholder="YYYY"
              />
              
              <Input
                label="CVV *"
                value={cardDetails.cvv}
                onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                error={errors.cvv}
                placeholder="123"
              />
            </div>
            
            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
              <p className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Tus datos están protegidos con encriptación SSL de 256 bits
              </p>
            </div>
          </div>
        )}

        {/* PayPal Info */}
        {paymentMethod === 'paypal' && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Serás redirigido a PayPal para completar el pago de forma segura.
            </p>
          </div>
        )}

        {/* Transfer Info */}
        {paymentMethod === 'transfer' && (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Importante:</strong> Tu pedido se procesará una vez recibamos la transferencia.
            </p>
            <p className="text-sm text-yellow-700">
              Recibirás un email con los datos bancarios y el número de referencia.
            </p>
          </div>
        )}
      </div>

      <div className="flex space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
        >
          Volver
        </Button>
        <Button type="submit" className="flex-1">
          Continuar
        </Button>
      </div>
    </form>
  )
}