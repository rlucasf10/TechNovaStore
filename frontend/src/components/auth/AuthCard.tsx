'use client';

import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

/**
 * Card reutilizable para contenido de autenticación
 * Puede usarse dentro de AuthLayout o de forma independiente
 */
export default function AuthCard({
  children,
  title,
  subtitle,
  footer,
}: AuthCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header del card (opcional) */}
      {(title || subtitle) && (
        <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
          {title && (
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          )}
          {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
        </div>
      )}

      {/* Contenido principal */}
      <div className="px-8 py-6">{children}</div>

      {/* Footer del card (opcional) */}
      {footer && (
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
}
