'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { CheckoutSteps, ShippingForm, PaymentForm, OrderSummary, OrderConfirmation } from '@/components/checkout'
import { Button } from '@/components/ui'
import { Address } from '@/types'

export interface CheckoutData {
  shippingAddress: Address
  billingAddress: Address
  paymentMethod: 'card' | 'paypal' | 'transfer'
  cardDetails?: {
    number: string
    expiryMonth: string
    expiryYear: string
    cvv: string
    name: string
  }
  sameAsBilling: boolean
}

const steps = [
  { id: 1, name: 'Envío', description: 'Dirección de entrega' },
  { id: 2, name: 'Pago', description: 'Método de pago' },
  { id: 3, name: 'Confirmación', description: 'Revisar pedido' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [checkoutData, setCheckoutData] = useState<Partial<CheckoutData>>({
    sameAsBilling: true,
    paymentMethod: 'card',
  })

  // Redirect if cart is empty
  if (items.length === 0 && !orderId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Tu carrito está vacío
            </h1>
            <p className="text-gray-600 mb-6">
              Añade algunos productos antes de proceder al checkout
            </p>
            <Button onClick={() => router.push('/productos')}>
              Explorar Productos
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleStepComplete = (stepData: Partial<typeof checkoutData>) => {
    setCheckoutData(prev => ({ ...prev, ...stepData }))
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleProcessOrder = async () => {
    setIsProcessing(true)
    
    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate order ID
      const newOrderId = `TNS-${Date.now()}`
      setOrderId(newOrderId)
      
      // Clear cart
      clearCart()
      
      // Move to confirmation step
      setCurrentStep(4)
    } catch (error) {
      console.error('Error processing order:', error)
      // Handle error (show notification, etc.)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (orderId && currentStep === 4) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <OrderConfirmation orderId={orderId} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">
            Completa tu pedido en {steps.length} sencillos pasos
          </p>
        </div>

        <CheckoutSteps steps={steps} currentStep={currentStep} />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {currentStep === 1 && (
                <ShippingForm
                  initialData={checkoutData}
                  onComplete={handleStepComplete}
                />
              )}
              
              {currentStep === 2 && (
                <PaymentForm
                  initialData={checkoutData}
                  onComplete={handleStepComplete}
                  onBack={handleBackStep}
                />
              )}
              
              {currentStep === 3 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Confirmar Pedido</h2>
                  
                  {/* Order Review */}
                  <div className="space-y-6">
                    {/* Shipping Address */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Dirección de Envío</h3>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {checkoutData.shippingAddress && (
                          <>
                            <p>{checkoutData.shippingAddress.street}</p>
                            <p>{checkoutData.shippingAddress.city}, {checkoutData.shippingAddress.postal_code}</p>
                            <p>{checkoutData.shippingAddress.state}, {checkoutData.shippingAddress.country}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Método de Pago</h3>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {checkoutData.paymentMethod === 'card' && 'Tarjeta de Crédito/Débito'}
                        {checkoutData.paymentMethod === 'paypal' && 'PayPal'}
                        {checkoutData.paymentMethod === 'transfer' && 'Transferencia Bancaria'}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4 pt-6 border-t">
                      <Button
                        variant="secondary"
                        onClick={handleBackStep}
                        disabled={isProcessing}
                      >
                        Volver
                      </Button>
                      <Button
                        onClick={handleProcessOrder}
                        loading={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary items={items} />
          </div>
        </div>
      </div>
    </div>
  )
}