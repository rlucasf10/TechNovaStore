'use client'

// @ts-ignore - React import necesario para JSX en global-error durante SSR
import React from 'react'

/**
 * Global Error Boundary - Captura errores críticos a nivel de aplicación
 * En Next.js 16, este componente DEBE incluir <html> y <body>
 * porque reemplaza completamente el layout raíz cuando hay un error
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '1rem'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h2 style={{ color: '#111827', marginBottom: '1rem' }}>
              Error del Sistema
            </h2>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
              Ha ocurrido un error crítico. Por favor, recarga la página.
            </p>
            {error?.digest && (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Código: {error.digest}
              </p>
            )}
            <button
              onClick={() => reset()}
              type="button"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}