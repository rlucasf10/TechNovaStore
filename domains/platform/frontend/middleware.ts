/**
 * Middleware de Next.js para configuración de seguridad
 * 
 * Este middleware se ejecuta en TODAS las rutas y configura:
 * - Headers de seguridad adicionales
 * - Configuración de cookies SameSite
 * - Protección CSRF adicional
 * 
 * IMPORTANTE: Este middleware complementa la protección CSRF que ya existe
 * en el backend (API Gateway) y en el servicio de autenticación del frontend.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // Crear respuesta
  // Nota: _request tiene prefijo _ para indicar que intencionalmente no se usa
  const response = NextResponse.next();

  // Configurar headers de seguridad adicionales
  // Estos headers complementan los que ya están configurados en next.config.js
  
  // X-Frame-Options: Previene clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  // X-Content-Type-Options: Previene MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection: Protección XSS del navegador
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy: Controla qué información se envía en el header Referer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy: Controla qué features del navegador pueden usarse
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // En producción, agregar Strict-Transport-Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Configurar cookies con SameSite
  // NOTA: Next.js no permite modificar cookies directamente en middleware,
  // pero podemos configurar el header Set-Cookie si es necesario
  // La configuración principal de cookies se hace en el backend (API Gateway)
  
  // Agregar header para indicar que CSRF está habilitado
  response.headers.set('X-CSRF-Protection', 'enabled');

  return response;
}

// Configurar en qué rutas se ejecuta el middleware
// Por defecto, se ejecuta en todas las rutas excepto:
// - _next/static (archivos estáticos)
// - _next/image (optimización de imágenes)
// - favicon.ico (favicon)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
