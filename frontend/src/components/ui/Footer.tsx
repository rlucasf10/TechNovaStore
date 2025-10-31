'use client'

import Link from 'next/link'

export function Footer() {
  return (
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
  )
}