import { Metadata } from 'next'
import { GdprDashboard } from '@/components/dashboard/GdprDashboard'

export const metadata: Metadata = {
  title: 'Configuración de Privacidad | TechNovaStore',
  description: 'Gestiona tus preferencias de privacidad, exporta tus datos y controla tu información personal.',
}

export default function PrivacyDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Configuración de Privacidad
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona tus preferencias de privacidad y datos personales según GDPR y LOPD
          </p>
        </div>
        
        <GdprDashboard />
      </div>
    </div>
  )
}