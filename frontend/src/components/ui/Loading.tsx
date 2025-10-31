import { cn } from '@/lib/utils'

interface LoadingProps {
  /** Tamaño del spinner */
  size?: 'sm' | 'md' | 'lg'
  /** Clases CSS adicionales */
  className?: string
}

interface LoadingOverlayProps {
  /** Tamaño del spinner */
  size?: 'sm' | 'md' | 'lg'
  /** Texto a mostrar debajo del spinner */
  text?: string
  /** Si el overlay es transparente o con fondo sólido */
  transparent?: boolean
}

export function Loading({ size = 'md', className }: LoadingProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <svg
        className={cn('animate-spin text-primary-600', sizes[size])}
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Cargando"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

/**
 * LoadingOverlay - Overlay de carga que cubre toda la pantalla o un contenedor
 * 
 * Útil para bloquear la interacción mientras se procesa una acción
 */
export function LoadingOverlay({ 
  size = 'lg', 
  text = 'Cargando...', 
  transparent = false 
}: LoadingOverlayProps) {
  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        transparent 
          ? 'bg-black/30 backdrop-blur-sm' 
          : 'bg-white'
      )}
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <Loading size={size} />
        {text && (
          <p className={cn(
            'mt-4 font-medium',
            transparent ? 'text-white' : 'text-gray-600'
          )}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loading size="lg" />
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  )
}