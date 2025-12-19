'use client'

import React, { useState, useEffect, lazy, Suspense } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ChatProvider } from '@/support'
import { ThemeProvider } from '@/shared/contexts/ThemeContext'
import { ToastContainer } from '@/ui'
import { suppressExtensionErrors } from '@/lib/suppress-extension-errors'
import { createQueryClient } from '@/lib/react-query.config'

// Lazy load de componentes pesados no críticos
// Estos componentes se cargan después de que la página principal esté lista
const ChatWidget = lazy(() => 
  import(/* webpackChunkName: "chat-widget" */ '@/support').then(mod => ({ default: mod.ChatWidget }))
)
const TechnicalComparator = lazy(() => 
  import(/* webpackChunkName: "technical-comparator" */ '@/catalog').then(mod => ({ default: mod.TechnicalComparator }))
)

// React Query Devtools solo en desarrollo
const ReactQueryDevtools = process.env.NODE_ENV === 'development' 
  ? lazy(() => import(/* webpackChunkName: "react-query-devtools" */ '@tanstack/react-query-devtools').then(mod => ({ default: mod.ReactQueryDevtools })))
  : () => null

export function Providers({ children }: { children: React.ReactNode }) {
  // Suppress browser extension errors on mount
  useEffect(() => {
    suppressExtensionErrors()
  }, [])
  
  // Crear QueryClient con configuración optimizada centralizada
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ChatProvider>
          {children}
          {/* Sistema de notificaciones global (crítico) */}
          <ToastContainer />
          {/* Componentes no críticos con lazy loading */}
          <Suspense fallback={null}>
            {/* ChatWidget flotante */}
            <ChatWidget />
            {/* Comparador Técnico (modal global) */}
            <TechnicalComparator />
            {/* React Query Devtools (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools 
                initialIsOpen={false}
                buttonPosition="bottom-left"
              />
            )}
          </Suspense>
        </ChatProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}