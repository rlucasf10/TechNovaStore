/**
 * Página de Acceso Denegado (Unauthorized)
 * 
 * Se muestra cuando un usuario autenticado intenta acceder a una ruta
 * que requiere permisos de administrador pero no los tiene.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icono */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Acceso Denegado
        </h1>

        {/* Descripción */}
        <p className="text-lg text-gray-600 mb-2">
          No tienes permisos para acceder a esta página.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Esta sección está reservada para administradores del sistema.
        </p>

        {/* Código de error */}
        <div className="bg-gray-100 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-500 font-mono">
            Error 403 - Forbidden
          </p>
        </div>

        {/* Acciones */}
        <div className="space-y-3">
          {/* Botón principal: Volver al Dashboard */}
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Ir al Dashboard
          </Link>

          {/* Botón secundario: Volver atrás */}
          <button
            onClick={() => router.back()}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver Atrás
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Si crees que deberías tener acceso a esta página,{' '}
            <Link
              href="/contacto"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              contacta con soporte
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
