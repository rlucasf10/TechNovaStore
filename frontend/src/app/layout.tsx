import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { CookieConsent } from '@/components/ui/CookieConsent'
import '@/middleware/errorHandler' // Import error handler to suppress browser extension errors

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TechNovaStore - Tienda de Tecnología',
  description: 'Tu tienda online de productos tecnológicos e informáticos con los mejores precios',
  keywords: 'tecnología, informática, electrónicos, gadgets, ordenadores, móviles',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  )
}