/**
 * Ejemplos de uso del componente SetPasswordModal
 * 
 * Este archivo muestra diferentes casos de uso del modal para establecer contraseña
 * en usuarios que se registraron con OAuth (Google, GitHub).
 */

'use client';

import React, { useState } from 'react';
import SetPasswordModal from './SetPasswordModal';
import { Button } from '@/ui/Button';

/**
 * Ejemplo 1: Uso básico del modal
 * 
 * Caso de uso: Usuario con OAuth quiere establecer una contraseña local
 */
export function BasicSetPasswordModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Ejemplo 1: Uso Básico</h3>
      <p className="text-sm text-gray-600">
        Usuario con OAuth (Google/GitHub) establece una contraseña local.
      </p>

      <Button onClick={() => setIsOpen(true)}>
        Establecer Contraseña
      </Button>

      <SetPasswordModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          console.log('✓ Contraseña establecida exitosamente');
          setIsOpen(false);
        }}
      />
    </div>
  );
}

/**
 * Ejemplo 2: Integración en Dashboard de Usuario
 * 
 * Caso de uso: Sección de "Métodos de Inicio de Sesión" en el Dashboard
 */
export function DashboardIntegrationExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);

  const handleSuccess = () => {
    setHasPassword(true);
    setIsOpen(false);
    console.log('✓ Contraseña establecida. Usuario ahora tiene múltiples métodos de autenticación.');
  };

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Ejemplo 2: Integración en Dashboard</h3>
      <p className="text-sm text-gray-600">
        Sección de "Métodos de Inicio de Sesión" en el Dashboard de Usuario.
      </p>

      {/* Simulación de la sección de métodos de autenticación */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-gray-900">Métodos de Inicio de Sesión</h4>

        {/* Método OAuth (Google) */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Google</p>
              <p className="text-xs text-gray-500">Vinculado el 1 Nov 2025</p>
            </div>
          </div>
          <span className="text-green-600 text-sm font-medium">✓ Vinculado</span>
        </div>

        {/* Método de contraseña */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Contraseña</p>
              <p className="text-xs text-gray-500">
                {hasPassword ? 'Establecida' : 'No establecida'}
              </p>
            </div>
          </div>
          {hasPassword ? (
            <Button size="sm" variant="ghost">
              Cambiar Contraseña
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setIsOpen(true)}>
              Establecer Contraseña
            </Button>
          )}
        </div>

        {/* Información adicional */}
        {!hasPassword && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-800">
              💡 <strong>Recomendación:</strong> Establece una contraseña para tener múltiples
              métodos de inicio de sesión y aumentar la seguridad de tu cuenta.
            </p>
          </div>
        )}
      </div>

      <SetPasswordModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

/**
 * Ejemplo 3: Flujo desde "Olvidé mi contraseña"
 * 
 * Caso de uso: Usuario con solo OAuth intenta usar "Olvidé mi contraseña"
 * y el sistema le ofrece establecer una contraseña
 */
export function ForgotPasswordFlowExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(true);

  const handleSuccess = () => {
    setIsOpen(false);
    setShowMessage(false);
    console.log('✓ Contraseña establecida. Usuario puede ahora usar recuperación de contraseña.');
  };

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Ejemplo 3: Flujo desde "Olvidé mi contraseña"</h3>
      <p className="text-sm text-gray-600">
        Usuario con solo OAuth intenta recuperar contraseña y se le ofrece establecer una.
      </p>

      {/* Mensaje informativo */}
      {showMessage && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-medium">
                Tu cuenta usa Google para iniciar sesión
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                No tienes una contraseña establecida. ¿Quieres establecer una contraseña para
                poder iniciar sesión con tu email además de Google?
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsOpen(true)}
                className="mt-3"
              >
                Establecer Contraseña
              </Button>
            </div>
          </div>
        </div>
      )}

      {!showMessage && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-green-800 font-medium">
                ✓ Contraseña establecida exitosamente
              </p>
              <p className="text-sm text-green-700 mt-1">
                Ahora puedes iniciar sesión con tu email y contraseña, además de Google.
              </p>
            </div>
          </div>
        </div>
      )}

      <SetPasswordModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

/**
 * Ejemplo 4: Todos los ejemplos juntos
 */
export default function SetPasswordModalExamples() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SetPasswordModal - Ejemplos de Uso
        </h1>
        <p className="text-gray-600">
          Componente para establecer contraseña en usuarios OAuth (Google, GitHub)
        </p>
      </div>

      <div className="space-y-8 divide-y divide-gray-200">
        <BasicSetPasswordModalExample />
        <div className="pt-8">
          <DashboardIntegrationExample />
        </div>
        <div className="pt-8">
          <ForgotPasswordFlowExample />
        </div>
      </div>

      {/* Información técnica */}
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Técnica</h2>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <p>
            <strong>Endpoint:</strong> POST /api/auth/set-password
          </p>
          <p>
            <strong>Requisitos:</strong> 24.6, 24.10
          </p>
          <p>
            <strong>Validaciones:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
            <li>Mínimo 8 caracteres</li>
            <li>Al menos una mayúscula</li>
            <li>Al menos una minúscula</li>
            <li>Al menos un número</li>
            <li>Al menos un carácter especial</li>
            <li>No ser una contraseña común</li>
            <li>Coincidencia de contraseñas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
