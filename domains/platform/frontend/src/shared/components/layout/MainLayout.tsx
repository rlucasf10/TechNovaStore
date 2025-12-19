/**
 * Main Layout Component
 * 
 * Layout principal de la aplicación que integra:
 * - Header (navegación superior con menú móvil integrado)
 * - Footer (pie de página)
 * - Contenido principal
 * 
 * Este layout se usa en todas las páginas públicas de la aplicación.
 * 
 * Nota: El Header ya incluye su propio menú móvil (sidebar), por lo que
 * no necesitamos un componente Sidebar separado aquí.
 */

'use client'

import React from 'react'
import { Header } from './Header'
import { Footer } from './Footer'

interface MainLayoutProps {
  children: React.ReactNode
  /**
   * Si es true, no muestra el header ni el footer
   * (útil para páginas de autenticación)
   */
  minimal?: boolean
}

export function MainLayout({ children, minimal = false }: MainLayoutProps) {
  if (minimal) {
    return <>{children}</>
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header con navegación y menú móvil integrado */}
      <Header />
      
      {/* Contenido principal - pt-[72px] compensa el header fixed */}
      <main className="flex-1 pt-[72px]">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}
