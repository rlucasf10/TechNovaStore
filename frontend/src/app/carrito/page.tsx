'use client'

import { Header } from '@/components/ui'
import { ShoppingCart } from '@/components/cart'

export default function CarritoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🛒 Carrito de Compras</h1>
        <div className="card">
          <ShoppingCart />
        </div>
      </div>
    </div>
  )
}