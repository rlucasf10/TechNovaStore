'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useUser } from '@/hooks/useUser'

function CartButton() {
  const { itemCount } = useCart()
  
  return (
    <Link href="/carrito" className="text-gray-700 hover:text-primary-600 transition-colors flex items-center">
      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
      Carrito ({itemCount})
    </Link>
  )
}

export function Header() {
  const { user } = useUser()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              TechNovaStore
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="/productos" className="text-gray-700 hover:text-primary-600 transition-colors">
              Productos
            </Link>
            <Link href="/categorias" className="text-gray-700 hover:text-primary-600 transition-colors">
              Categorías
            </Link>
            <Link href="/ofertas" className="text-gray-700 hover:text-primary-600 transition-colors">
              Ofertas
            </Link>
            <Link href="/contacto" className="text-gray-700 hover:text-primary-600 transition-colors">
              Contacto
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <CartButton />
            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard" 
                  className="text-gray-700 hover:text-primary-600 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Mi Cuenta
                </Link>
                <button 
                  onClick={() => {
                    localStorage.removeItem('auth_token')
                    window.location.href = '/'
                  }}
                  className="text-gray-700 hover:text-red-600 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-primary">
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}