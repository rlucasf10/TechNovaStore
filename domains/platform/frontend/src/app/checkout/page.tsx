'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/commerce'
import { useAuthStore } from '@/customer/store/auth.store'
import { CheckoutSteps } from '@/commerce'
import { Button, Loading } from '@/ui'
import { Address } from '@/types'
import { orderService } from '@/shared/services/orderService'
import { recommenderService } from '@/shared/services/recommenderService'

// Dynamic imports para componentes de checkout
// Estos componentes son pesados y solo se necesitan en pasos específicos
const ShippingForm = dynamic(
  () => import('@/commerce').then(mod => ({ default: mod.ShippingForm })),
  { 
    loading: () => <Loading />,
    ssr: true 
  }
)

const PaymentForm = dynamic(
  () => import('@/commerce').then(mod => ({ default: mod.PaymentForm })),
  { 
    loading: () => <Loading />,
    ssr: true 
  }
)

const ReviewStep = dynamic(
  () => import('@/commerce').then(mod => ({ default: mod.ReviewStep })),
  { 
    loading: () => <Loading />,
    ssr: true 
  }
)

const OrderConfirmation = dynamic(
  () => import('@/commerce').then(mod => ({ default: mod.OrderConfirmation })),
  { 
    loading: () => <Loading />,
    ssr: true 
  }
)

const OrderSummaryComponent = dynamic(
  () => import('@/commerce/components/checkout').then(mod => ({ default: mod.OrderSummary })),
  { 
    loading: () => (
      <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
    ssr: true 
  }
)

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
  { id: 3, name: 'Revisión', description: 'Confirmar pedido' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [checkoutData, setCheckoutData] = useState<Partial<CheckoutData>>({
    sameAsBilling: true,
    paymentMethod: 'card',
  })

  // Protección: Redirigir a login si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Guardar la URL actual para redirigir después del login
      router.push('/login?returnUrl=/checkout')
    }
  }, [isAuthenticated, authLoading, router])

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          role="status"
          aria-live="polite"
          aria-label="Verificando autenticación"
        >
          <Loading />
          <span className="sr-only">Verificando tu sesión, por favor espera...</span>
        </div>
      </div>
    )
  }

  // No renderizar nada si no está autenticado (se está redirigiendo)
  if (!isAuthenticated) {
    return null
  }

  // Redirect if cart is empty
  if (items.length === 0 && !orderId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <main 
          role="main" 
          aria-label="Carrito vacío"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          <div className="text-center py-12" role="alert" aria-live="polite">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Tu carrito está vacío
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Añade algunos productos antes de proceder al checkout
            </p>
            <Button 
              onClick={() => router.push('/productos')}
              aria-label="Ir a explorar productos"
            >
              Explorar Productos
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const handleStepComplete = (stepData: Partial<typeof checkoutData>) => {
    setCheckoutData(prev => ({ ...prev, ...stepData }))
    
    // Marcar el paso actual como completado
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }
    
    // Avanzar al siguiente paso
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleStepNavigation = (stepId: number) => {
    // Solo permitir navegación a pasos completados o al paso actual
    if (completedSteps.includes(stepId) || stepId === currentStep) {
      setCurrentStep(stepId)
    }
  }

  const handleProcessOrder = async () => {
    setIsProcessing(true)
    
    try {
      // Validar que haya datos de envío
      if (!checkoutData.shippingAddress) {
        throw new Error('Falta información de envío')
      }

      // Validar que haya datos de facturación
      if (!checkoutData.billingAddress) {
        throw new Error('Falta información de facturación')
      }

      // Convertir items del carrito al formato del backend
      const orderItems = orderService.convertCartItemsToOrderItems(items)

      // Crear el pedido en el backend
      // NOTA: user_id se obtiene automáticamente del token JWT en el backend
      const response = await orderService.createOrder({
        items: orderItems,
        shipping_address: checkoutData.shippingAddress,
        billing_address: checkoutData.billingAddress,
        payment_method: checkoutData.paymentMethod || 'card',
        notes: `Pedido realizado desde el frontend`,
      })

      if (response.success && response.data) {
        // Guardar información del pedido
        setOrderId(response.data.id.toString())
        setOrderNumber(response.data.order_number)
        
        // Registrar interacciones de compra para el sistema de recomendaciones
        // Usamos el SKU porque el recommender-service trabaja con SKUs
        for (const item of items) {
          recommenderService.recordInteraction(item.sku, 'purchase')
        }
        
        // Limpiar carrito
        clearCart()
        
        // Mover al paso de confirmación
        setCurrentStep(4)
      } else {
        throw new Error(response.message || 'Error al crear el pedido')
      }
    } catch (error) {
      console.error('Error processing order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar el pedido'
      
      // Mostrar error al usuario (puedes usar un toast notification aquí)
      alert(`Error: ${errorMessage}`)
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
    // Calculate estimated delivery date (7-10 business days)
    const estimatedDelivery = new Date()
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7)
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <main 
          role="main" 
          aria-label="Confirmación de pedido"
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          <div role="alert" aria-live="polite">
            <OrderConfirmation 
              orderId={orderId}
              orderNumber={orderNumber || `#${orderId}`}
              estimatedDelivery={estimatedDelivery}
            />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <main 
        role="main" 
        aria-label="Proceso de checkout"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <header className="mb-8">
          <h1 id="checkout-title" className="text-3xl font-bold text-gray-900 dark:text-gray-100">Checkout</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2" aria-describedby="checkout-title">
            Completa tu pedido en {steps.length} sencillos pasos
          </p>
        </header>

        {/* Navegación de pasos con ARIA */}
        <nav aria-label="Pasos del checkout">
          <CheckoutSteps 
            steps={steps} 
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepNavigation}
          />
        </nav>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal del formulario */}
          <section 
            className="lg:col-span-2"
            aria-labelledby="current-step-title"
            aria-live="polite"
          >
            <h2 id="current-step-title" className="sr-only">
              {currentStep === 1 && 'Paso 1: Información de envío'}
              {currentStep === 2 && 'Paso 2: Método de pago'}
              {currentStep === 3 && 'Paso 3: Revisar y confirmar pedido'}
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
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
                <ReviewStep
                  items={items}
                  shippingAddress={checkoutData.shippingAddress}
                  billingAddress={checkoutData.billingAddress}
                  paymentMethod={checkoutData.paymentMethod}
                  cardDetails={checkoutData.cardDetails}
                  onConfirm={handleProcessOrder}
                  onBack={handleBackStep}
                  onEditShipping={() => setCurrentStep(1)}
                  onEditPayment={() => setCurrentStep(2)}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          </section>

          {/* Resumen del pedido */}
          <aside 
            className="lg:col-span-1"
            aria-label="Resumen del pedido"
          >
            <OrderSummaryComponent items={items} />
          </aside>
        </div>
      </main>
    </div>
  )
}