import Link from 'next/link'
import { Button } from '@/components/ui/Button'

// Página 404 dinámica

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mt-4">
          Página no encontrada
        </h2>
        <p className="text-gray-600 mt-4 mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <Link href="/">
          <Button size="lg">
            Volver al Inicio
          </Button>
        </Link>
      </div>
    </div>
  )
}
