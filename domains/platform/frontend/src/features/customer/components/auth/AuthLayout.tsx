'use client';

import React from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackToHome?: boolean;
}

/**
 * Layout compartido para todas las páginas de autenticación
 * Proporciona un diseño centrado, consistente y responsive
 */
export default function AuthLayout({
  children,
  title,
  subtitle,
  showBackToHome = true,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Fondo decorativo con patrón de tecnología */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Header con logo */}
      <header className="relative z-10 py-6 px-4">
        <div className="container mx-auto max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-900 hover:text-primary-600 transition-colors"
          >
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">TN</span>
            </div>
            <span className="text-xl font-bold">TechNovaStore</span>
          </Link>
        </div>
      </header>

      {/* Contenido principal centrado */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Botón de volver al inicio (opcional) */}
          {showBackToHome && (
            <div className="mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Volver al inicio
              </Link>
            </div>
          )}

          {/* Card de autenticación */}
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
            {/* Título y subtítulo */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-gray-600 text-sm">{subtitle}</p>
              )}
            </div>

            {/* Contenido del formulario */}
            {children}
          </div>

          {/* Footer con enlaces legales */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Al continuar, aceptas nuestros{' '}
              <Link
                href="/terminos"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Términos de Servicio
              </Link>{' '}
              y{' '}
              <Link
                href="/privacy-policy"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Política de Privacidad
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer simple */}
      <footer className="relative z-10 py-6 px-4 text-center text-sm text-gray-500">
        <p>© 2025 TechNovaStore. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
