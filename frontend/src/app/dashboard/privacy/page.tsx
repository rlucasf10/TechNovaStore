'use client'

import { GdprDashboard } from '@/components/dashboard'
import { ProtectedRoute } from '@/components/auth'

// NOTA: metadata no funciona en client components
// Se movería a un layout.tsx si se necesita metadata

export default function PrivacyDashboardPage() {
  return (
    <ProtectedRoute>
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
    </ProtectedRoute>
  )
}