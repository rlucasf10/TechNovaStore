'use client'

import React, { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ChatProvider } from '@/contexts/ChatContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ChatWidget } from '@/components/chat'
import { ToastContainer } from '@/components/ui'
import { suppressExtensionErrors } from '@/lib/suppress-extension-errors'

export function Providers({ children }: { children: React.ReactNode }) {
  // Suppress browser extension errors on mount
  useEffect(() => {
    suppressExtensionErrors()
  }, [])
  
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error: unknown) => {
              // Don't retry on 4xx errors
              const status = (error as { response?: { status?: number } })?.response?.status
              if (status && status >= 400 && status < 500) {
                return false
              }
              return failureCount < 3
            },
          },
          mutations: {
            retry: (failureCount, error: unknown) => {
              // Don't retry on 4xx errors
              const status = (error as { response?: { status?: number } })?.response?.status
              if (status && status >= 400 && status < 500) {
                return false
              }
              return failureCount < 2
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ChatProvider>
          {children}
          {/* ChatWidget flotante */}
          <ChatWidget />
          {/* Sistema de notificaciones global */}
          <ToastContainer />
          {/* React Query Devtools (solo en desarrollo) */}
          <ReactQueryDevtools initialIsOpen={false} />
        </ChatProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}