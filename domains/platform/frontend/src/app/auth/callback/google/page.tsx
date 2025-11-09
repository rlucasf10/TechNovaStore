'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/customer';

/**
 * Página de Callback de OAuth para Google
 * 
 * Flujo:
 * 1. Extraer code y state de URL query params
 * 2. Validar state contra sessionStorage (CSRF protection)
 * 3. Enviar code al backend (POST /api/auth/oauth/callback)
 * 4. Mostrar spinner durante procesamiento
 * 5. Redirigir a dashboard si éxito
 * 6. Redirigir a login con error si falla
 * 7. Manejar caso de usuario canceló autorización
 * 
 * Requisitos: 24.2, 24.3
 */
export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. Extraer parámetros de la URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('🔍 Google OAuth callback iniciado');
        console.log('   Code:', code ? `${code.substring(0, 10)}...` : 'null');
        console.log('   State:', state ? `${state.substring(0, 10)}...` : 'null');
        console.log('   Error:', errorParam);

        // 2. Manejar caso de usuario canceló autorización
        if (errorParam === 'access_denied') {
          console.log('❌ Usuario canceló la autorización');
          router.push('/login?error=oauth_cancelled&message=' + encodeURIComponent('Autenticación con Google cancelada'));
          return;
        }

        // Manejar otros errores del proveedor OAuth
        if (errorParam) {
          console.error('❌ Error del proveedor OAuth:', errorParam, errorDescription);
          router.push('/login?error=oauth_failed&message=' + encodeURIComponent(errorDescription || 'Error al autenticar con Google'));
          return;
        }

        // 3. Verificar que tengamos los parámetros necesarios
        if (!code) {
          console.error('❌ Falta el código de autorización');
          router.push('/login?error=oauth_failed&message=' + encodeURIComponent('Código de autorización no recibido'));
          return;
        }

        if (!state) {
          console.error('❌ Falta el parámetro state');
          router.push('/login?error=oauth_failed&message=' + encodeURIComponent('Parámetro de seguridad no recibido'));
          return;
        }

        // 4. Validar state contra sessionStorage (CSRF protection)
        // La validación se hace dentro de authService.oauthCallback
        console.log('✅ Parámetros recibidos correctamente');
        console.log('📤 Enviando código al backend...');

        // 5. Enviar code al backend (POST /api/auth/oauth/callback)
        const user = await authService.oauthCallback({
          provider: 'google',
          code,
          state,
        });

        console.log('✅ Usuario autenticado con Google:', user.email);
        setIsProcessing(false);

        // 6. Redirigir a dashboard si éxito
        // Redirigir según el rol del usuario
        if (user.role === 'admin') {
          console.log('🔐 Redirigiendo a admin dashboard...');
          router.push('/admin');
        } else {
          console.log('🔐 Redirigiendo a user dashboard...');
          router.push('/dashboard');
        }
      } catch (error: any) {
        console.error('❌ Error en callback de OAuth:', error);
        setIsProcessing(false);
        
        // 7. Manejar diferentes tipos de errores
        if (error.code === 'oauth-failed') {
          setError('Error al autenticar con Google. Por favor, intenta de nuevo.');
        } else if (error.code === 'email-already-exists') {
          // Caso especial: email ya existe con otro método
          // Requisito 24.4: Detectar cuando email de OAuth ya existe
          setError('Este email ya está registrado. Inicia sesión para vincular Google a tu cuenta.');
          setTimeout(() => {
            // Redirigir a login con mensaje informativo
            router.push('/login?message=' + encodeURIComponent('Este email ya está registrado. Inicia sesión para vincular tu cuenta de Google.'));
          }, 3000);
        } else if (error.code === 'invalid-token' || error.code === 'token-expired') {
          setError('El link de autenticación ha expirado. Por favor, intenta de nuevo.');
          setTimeout(() => router.push('/login'), 3000);
        } else if (error.code === 'network-error') {
          setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
        } else {
          setError(error.message || 'Ocurrió un error inesperado. Por favor, intenta de nuevo.');
        }
      }
    };

    handleCallback();
  }, [searchParams, router]);

  // Estado de error
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md w-full p-8 bg-white rounded-lg shadow-md">
          {/* Icono de error */}
          <div className="text-red-500 text-5xl mb-4">❌</div>
          
          {/* Título */}
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            Error de Autenticación
          </h2>
          
          {/* Mensaje de error */}
          <p className="text-gray-600 mb-6">{error}</p>
          
          {/* Botón para volver al login */}
          <button
            onClick={() => router.push('/login')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  // Estado de procesamiento (spinner)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        {/* Spinner animado */}
        <div className="mb-6 flex justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        
        {/* Título */}
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">
          Completando inicio de sesión con Google...
        </h2>
        
        {/* Mensaje descriptivo */}
        <p className="text-gray-600">
          {isProcessing 
            ? 'Verificando tu cuenta y configurando tu sesión'
            : 'Redirigiendo a tu dashboard...'}
        </p>
        
        {/* Indicador de progreso adicional */}
        <div className="mt-6">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <svg className="animate-pulse h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Autenticación segura con Google</span>
          </div>
        </div>
      </div>
    </div>
  );
}
