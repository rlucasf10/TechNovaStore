/**
 * Ejemplos de uso del componente SocialLoginButtons
 * Estos ejemplos muestran diferentes casos de uso y configuraciones
 */

'use client';

import React, { useState } from 'react';
import { SocialLoginButtons } from './SocialLoginButtons';
import AuthDivider from './AuthDivider';
import { Card } from '@/ui/Card';

// ============================================================================
// Ejemplo 1: Uso Básico
// ============================================================================

export function BasicExample() {
  return (
    <Card className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Iniciar Sesión</h2>
      
      {/* Botones de OAuth */}
      <SocialLoginButtons />
      
      {/* Divider */}
      <AuthDivider text="o" />
      
      {/* Formulario de email/password */}
      <form className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-md"
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full px-4 py-2 border rounded-md"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          Iniciar Sesión
        </button>
      </form>
    </Card>
  );
}

// ============================================================================
// Ejemplo 2: Con Manejo de Errores
// ============================================================================

export function WithErrorHandlingExample() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuthStart = (provider: string) => {
    setIsLoading(true);
    setError(null);
    console.log(`Iniciando OAuth con ${provider}`);
  };

  const handleOAuthError = (error: Error) => {
    setIsLoading(false);
    setError(error.message);
    console.error('Error de OAuth:', error);
  };

  return (
    <Card className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Iniciar Sesión</h2>
      
      {/* Mostrar error si existe */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Botones de OAuth con callbacks */}
      <SocialLoginButtons
        onOAuthStart={handleOAuthStart}
        onError={handleOAuthError}
        disabled={isLoading}
      />
    </Card>
  );
}

// ============================================================================
// Ejemplo 3: Página de Registro
// ============================================================================

export function RegisterPageExample() {
  return (
    <Card className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-2">Crear Cuenta</h2>
      <p className="text-gray-600 mb-6">
        Regístrate para empezar a comprar
      </p>
      
      {/* OAuth primero (más rápido) */}
      <SocialLoginButtons redirectTo="/dashboard" />
      
      {/* Divider */}
      <AuthDivider text="o registrarse con email" />
      
      {/* Formulario de registro */}
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre"
            className="px-4 py-2 border rounded-md"
          />
          <input
            type="text"
            placeholder="Apellido"
            className="px-4 py-2 border rounded-md"
          />
        </div>
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-md"
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full px-4 py-2 border rounded-md"
        />
        <label className="flex items-center space-x-2">
          <input type="checkbox" required />
          <span className="text-sm text-gray-600">
            Acepto los términos y condiciones
          </span>
        </label>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          Crear Cuenta
        </button>
      </form>
      
      <p className="text-center text-sm text-gray-600 mt-4">
        ¿Ya tienes cuenta?{' '}
        <a href="/login" className="text-blue-600 hover:underline">
          Inicia sesión
        </a>
      </p>
    </Card>
  );
}

// ============================================================================
// Ejemplo 4: Con Redirección Personalizada
// ============================================================================

export function WithCustomRedirectExample() {
  const [redirectTo, setRedirectTo] = useState('/dashboard');

  return (
    <Card className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Iniciar Sesión</h2>
      
      {/* Selector de redirección */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Redirigir después de login:
        </label>
        <select
          value={redirectTo}
          onChange={(e) => setRedirectTo(e.target.value)}
          className="w-full px-4 py-2 border rounded-md"
        >
          <option value="/dashboard">Dashboard</option>
          <option value="/profile">Perfil</option>
          <option value="/orders">Mis Pedidos</option>
          <option value="/cart">Carrito</option>
        </select>
      </div>
      
      {/* Botones de OAuth con redirección personalizada */}
      <SocialLoginButtons redirectTo={redirectTo} />
    </Card>
  );
}

// ============================================================================
// Ejemplo 5: Estado Deshabilitado
// ============================================================================

export function DisabledStateExample() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simular procesamiento
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <Card className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Iniciar Sesión</h2>
      
      {isProcessing && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md">
          Procesando autenticación...
        </div>
      )}
      
      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <input
          type="email"
          placeholder="Email"
          disabled={isProcessing}
          className="w-full px-4 py-2 border rounded-md disabled:opacity-50"
        />
        <input
          type="password"
          placeholder="Contraseña"
          disabled={isProcessing}
          className="w-full px-4 py-2 border rounded-md disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isProcessing ? 'Procesando...' : 'Iniciar Sesión'}
        </button>
      </form>
      
      <AuthDivider text="o" />
      
      {/* Botones de OAuth deshabilitados durante procesamiento */}
      <SocialLoginButtons disabled={isProcessing} />
    </Card>
  );
}

// ============================================================================
// Ejemplo 6: Con Notificaciones
// ============================================================================

export function WithNotificationsExample() {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const handleOAuthStart = (provider: string) => {
    setNotification({
      type: 'info',
      message: `Redirigiendo a ${provider}...`,
    });
  };

  const handleOAuthError = (error: Error) => {
    setNotification({
      type: 'error',
      message: `Error: ${error.message}`,
    });
  };

  return (
    <Card className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Iniciar Sesión</h2>
      
      {/* Notificación */}
      {notification && (
        <div
          className={`mb-4 p-3 rounded-md ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-700'
              : notification.type === 'error'
              ? 'bg-red-50 text-red-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          {notification.message}
        </div>
      )}
      
      {/* Botones de OAuth */}
      <SocialLoginButtons
        onOAuthStart={handleOAuthStart}
        onError={handleOAuthError}
      />
    </Card>
  );
}

// ============================================================================
// Ejemplo 7: Layout Completo de Autenticación
// ============================================================================

export function FullAuthLayoutExample() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            TechNovaStore
          </h1>
          <p className="text-gray-600">
            {mode === 'login'
              ? 'Inicia sesión en tu cuenta'
              : 'Crea tu cuenta gratis'}
          </p>
        </div>
        
        {/* Botones de OAuth */}
        <div className="mb-6">
          <SocialLoginButtons redirectTo="/dashboard" />
        </div>
        
        {/* Divider */}
        <AuthDivider
          text={mode === 'login' ? 'o inicia sesión con email' : 'o regístrate con email'}
        />
        
        {/* Formulario */}
        <form className="space-y-4">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                className="px-4 py-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Apellido"
                className="px-4 py-2 border rounded-md"
              />
            </div>
          )}
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-md"
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full px-4 py-2 border rounded-md"
          />
          {mode === 'login' && (
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span className="text-sm text-gray-600">Recordarme</span>
              </label>
              <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}
          {mode === 'register' && (
            <label className="flex items-center space-x-2">
              <input type="checkbox" required />
              <span className="text-sm text-gray-600">
                Acepto los términos y condiciones
              </span>
            </label>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>
        </form>
        
        {/* Toggle entre login y registro */}
        <p className="text-center text-sm text-gray-600 mt-6">
          {mode === 'login' ? (
            <>
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-blue-600 hover:underline"
              >
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-blue-600 hover:underline"
              >
                Inicia sesión
              </button>
            </>
          )}
        </p>
      </Card>
    </div>
  );
}

// ============================================================================
// Exportar todos los ejemplos
// ============================================================================

export default {
  BasicExample,
  WithErrorHandlingExample,
  RegisterPageExample,
  WithCustomRedirectExample,
  DisabledStateExample,
  WithNotificationsExample,
  FullAuthLayoutExample,
};
