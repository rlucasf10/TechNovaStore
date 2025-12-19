import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { CookieConsent } from '@/ui'
import { ComparisonFloatingButton } from '@/features/catalog/components/products/ComparisonFloatingButton'
import { SkipLinks } from '@/shared/components/ui/SkipLinks'
import { WebVitalsReporter } from '@/shared/components/analytics/WebVitalsReporter'
import { WebVitalsDebugger } from '@/shared/components/analytics/WebVitalsDebugger'
import '@/middleware/errorHandler' // Import error handler to suppress browser extension errors

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3020'),
  title: {
    default: 'TechNovaStore - Tienda de Tecnología e Informática',
    template: '%s | TechNovaStore',
  },
  description: 'Tu tienda online de productos tecnológicos e informáticos con los mejores precios. Envío rápido, garantía y atención personalizada.',
  keywords: ['tecnología', 'informática', 'electrónicos', 'gadgets', 'ordenadores', 'móviles', 'componentes PC', 'periféricos', 'laptops', 'smartphones'],
  authors: [{ name: 'TechNovaStore' }],
  creator: 'TechNovaStore',
  publisher: 'TechNovaStore',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'http://localhost:3020',
    siteName: 'TechNovaStore',
    title: 'TechNovaStore - Tienda de Tecnología e Informática',
    description: 'Tu tienda online de productos tecnológicos con los mejores precios',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@technovastore',
    creator: '@technovastore',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Script para prevenir FOUC (Flash of Unstyled Content) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme-storage');
                  if (theme) {
                    var parsed = JSON.parse(theme);
                    var themeValue = parsed.state?.theme || 'system';
                    var resolvedTheme = themeValue;
                    
                    if (themeValue === 'system') {
                      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                    
                    if (resolvedTheme === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        {/* Skip links para navegación por teclado - WCAG 2.1 AA */}
        <SkipLinks />
        
        {/* Web Vitals Reporter - Monitoreo de performance */}
        <WebVitalsReporter />
        
        {/* Web Vitals Debugger - Solo visible en desarrollo */}
        <WebVitalsDebugger />
        
        <Providers>
          {/* Main content area - Landmark principal */}
          <div id="main-content" role="main" tabIndex={-1}>
            {children}
          </div>
          <CookieConsent />
          <ComparisonFloatingButton />
          {/* ChatWidget se renderiza en Providers */}
        </Providers>
      </body>
    </html>
  )
}