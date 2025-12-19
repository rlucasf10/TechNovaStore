'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/layout'
import { useCartStore } from '@/commerce'
import { useAuth } from '@/customer'
import { Button, Breadcrumbs } from '@/ui'

// Dynamic import para el componente pesado del carrito
const ShoppingCart = dynamic(
  () => import('@/commerce').then(mod => ({ default: mod.ShoppingCart })),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4 p-4 bg-gray-100 dark:bg-slate-700 rounded-lg">
            <div className="w-24 h-24 bg-gray-200 dark:bg-slate-600 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }
)

export default function CarritoPage() {
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)

  const handleClearCart = () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      clearCart()
    }
  }

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Carrito de Compras' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      
      {/* Breadcrumbs - pt-[72px] compensa el header fixed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pt-[88px]">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" aria-labelledby="cart-heading">
        {/* Header con título y botón limpiar */}
        <div className="flex items-center justify-between mb-8">
          <h1 id="cart-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Carrito de Compras
            {items.length > 0 && (
              <span className="ml-3 text-lg font-normal text-gray-500 dark:text-gray-400">
                ({items.length} {items.length === 1 ? 'producto' : 'productos'})
              </span>
            )}
          </h1>
          
          {items.length > 0 && (
            <Button
              variant="ghost"
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label="Vaciar carrito de compras"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar Carrito
            </Button>
          )}
        </div>

        {/* Layout: 70% lista + 30% resumen */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Lista de productos (70%) */}
          <section className="lg:col-span-8" aria-labelledby="cart-items-heading">
            <h2 id="cart-items-heading" className="sr-only">Productos en el carrito</h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <ShoppingCart showCheckoutButton={false} />
            </div>
          </section>

          {/* Resumen del carrito (30%) */}
          {items.length > 0 && (
            <aside className="lg:col-span-4 mt-8 lg:mt-0" aria-labelledby="cart-summary-heading">
              <h2 id="cart-summary-heading" className="sr-only">Resumen del pedido</h2>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 sticky top-24">
                <ShoppingCartSummary />
              </div>
            </aside>
          )}
        </div>

        {/* Badges de seguridad */}
        {items.length > 0 && (
          <section className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6" aria-labelledby="security-badges-heading">
            <h2 id="security-badges-heading" className="sr-only">Garantías de seguridad</h2>
            <SecurityBadges />
          </section>
        )}
      </main>
    </div>
  )
}

function ShoppingCartSummary() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const items = useCartStore((state) => state.items)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  
  const subtotal = getTotalPrice()
  const shippingCost = subtotal > 50 ? 0 : 5.99
  const tax = subtotal * 0.21
  const total = subtotal + shippingCost + tax

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Guardar la URL de retorno para volver después del login
      console.log('🛒 Guardando redirectAfterLogin en sessionStorage:', '/checkout')
      sessionStorage.setItem('redirectAfterLogin', '/checkout')
      console.log('🛒 Verificando que se guardó:', sessionStorage.getItem('redirectAfterLogin'))
      router.push('/login')
    } else {
      router.push('/checkout')
    }
  }

  return (
    <div className="space-y-6" role="complementary">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Resumen del Pedido</h2>
      
      {/* Desglose de precios */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Subtotal ({items.length} productos)</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{formatPrice(subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Envío</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {shippingCost === 0 ? (
              <span className="text-green-600 dark:text-green-400 font-semibold">¡Gratis!</span>
            ) : (
              formatPrice(shippingCost)
            )}
          </span>
        </div>
        
        {subtotal < 50 && (
          <div className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-3 rounded-lg flex items-start">
            <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Añade {formatPrice(50 - subtotal)} más para envío gratuito</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">IVA (21%)</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{formatPrice(tax)}</span>
        </div>
        
        <div className="border-t dark:border-slate-700 pt-3">
          <div className="flex justify-between">
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Total</span>
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Código de descuento */}
      <div className="border-t dark:border-slate-700 pt-4">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
            <span>¿Tienes un código de descuento?</span>
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-3 space-y-2">
            <input
              id="discount-code"
              name="discount-code"
              type="text"
              placeholder="Código de descuento"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm placeholder-gray-400 dark:placeholder-gray-500"
              aria-label="Código de descuento"
            />
            <Button variant="secondary" size="sm" className="w-full">
              Aplicar
            </Button>
          </div>
        </details>
      </div>

      {/* Botones de acción */}
      <div className="space-y-3 border-t dark:border-slate-700 pt-4">
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleCheckout}
          aria-label="Proceder al proceso de pago"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Proceder al Checkout
        </Button>
        <Link href="/productos" className="block">
          <Button variant="secondary" className="w-full" aria-label="Volver al catálogo de productos">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Continuar Comprando
          </Button>
        </Link>
      </div>
    </div>
  )
}

function SecurityBadges() {
  const badges = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Pago Seguro',
      description: 'Encriptación SSL de 256 bits',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Compra Protegida',
      description: 'Garantía de devolución de 30 días',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      title: 'Envío Rápido',
      description: 'Entrega en 24-48 horas',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Soporte 24/7',
      description: 'Asistencia siempre disponible',
    },
  ]

  return (
    <div role="region" aria-label="Garantías de seguridad">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">Compra con Confianza</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list">
        {badges.map((badge, index) => (
          <div key={index} className="flex flex-col items-center text-center p-3" role="listitem">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 mb-2">
              {badge.icon}
            </div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{badge.title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}