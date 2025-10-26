'use client'

import Link from 'next/link'
import { Header } from '@/components/ui'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Tu Tienda de Tecnología
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Los mejores productos tecnológicos con precios competitivos y entrega rápida
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/productos" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200">
                Ver Productos
              </Link>
              <Link href="/ofertas" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors duration-200">
                Ofertas Especiales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir TechNovaStore?
            </h2>
            <p className="text-lg text-gray-600">
              Ofrecemos la mejor experiencia de compra en tecnología
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Entrega Rápida</h3>
              <p className="text-gray-600">
                Recibe tus productos en tiempo récord con nuestro sistema de envío optimizado
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Mejores Precios</h3>
              <p className="text-gray-600">
                Comparamos precios automáticamente para ofrecerte siempre las mejores ofertas
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Soporte 24/7</h3>
              <p className="text-gray-600">
                Nuestro chatbot inteligente y equipo de soporte están disponibles las 24 horas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">TechNovaStore</h3>
              <p className="text-gray-400">
                Tu tienda de confianza para productos tecnológicos con la mejor relación calidad-precio.
              </p>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Productos</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/categorias/ordenadores" className="hover:text-white transition-colors">Ordenadores</Link></li>
                <li><Link href="/categorias/moviles" className="hover:text-white transition-colors">Móviles</Link></li>
                <li><Link href="/categorias/componentes" className="hover:text-white transition-colors">Componentes</Link></li>
                <li><Link href="/categorias/accesorios" className="hover:text-white transition-colors">Accesorios</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/ayuda" className="hover:text-white transition-colors">Centro de Ayuda</Link></li>
                <li><Link href="/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
                <li><Link href="/seguimiento" className="hover:text-white transition-colors">Seguir Pedido</Link></li>
                <li><Link href="/devoluciones" className="hover:text-white transition-colors">Devoluciones</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
                <li><Link href="/terminos" className="hover:text-white transition-colors">Términos de Uso</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Política de Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TechNovaStore. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}