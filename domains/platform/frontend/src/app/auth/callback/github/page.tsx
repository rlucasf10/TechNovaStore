'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/customer';

// ⭐ AGREGAR ESTA LÍNEA
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

/**
 * Página de Callback de OAuth para GitHub
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
function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. Extraer parámetros de la URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('🔍 GitHub OAuth callback iniciado');
        console.log('   Code:', code ? `${code.substring(0, 10)}...` : 'null');
        console.log('   State:', state ? `${state.substring(0, 10)}...` : 'null');
        console.log('   Error:', errorParam);

        // 2. Manejar caso de usuario canceló autorización
        if (errorParam === 'access_denied') {
          console.log('❌ Usuario canceló la autorización');
          router.push('/login?error=oauth_cancelled&message=' + encodeURIComponent('Autenticación con GitHub cancelada'));
          return;
        }

        // Manejar otros errores del proveedor OAuth
        if (errorParam) {
          console.error('❌ Error del proveedor OAuth:', errorParam, errorDescription);
          router.push('/login?error=oauth_failed&message=' + encodeURIComponent(errorDescription || 'Error al autenticar con GitHub'));
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
          provider: 'github',
          code,
          state,
        });

        console.log('✅ Usuario autenticado con GitHub:', user.email);
        setIsProcessing(false);
        setUserName(user.firstName || user.email.split('@')[0]);
        setUserRole(user.role);

        // 6. Determinar URL de redirección
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        let finalRedirectUrl: string;
        
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          finalRedirectUrl = redirectUrl;
        } else {
          finalRedirectUrl = user.role === 'admin' ? '/dashboard/admin' : '/dashboard/usuario';
        }

        // 7. Si estamos en un popup, comunicar a la ventana padre y cerrar
        if (window.opener && !window.opener.closed) {
          console.log('🔐 Detectado popup, comunicando a ventana padre...');
          window.opener.postMessage({
            type: 'oauth-success',
            provider: 'github',
            user: user,
            redirectUrl: finalRedirectUrl,
          }, window.location.origin);
          window.close();
          return;
        }

        // 8. Si no es popup, redirigir normalmente
        console.log('🔐 Redirigiendo a:', finalRedirectUrl);
        router.push(finalRedirectUrl);
      } catch (error: any) {
        console.error('❌ Error en callback de OAuth:', error);
        setIsProcessing(false);
        
        // 7. Manejar diferentes tipos de errores
        if (error.code === 'oauth-failed') {
          setError('Error al autenticar con GitHub. Por favor, intenta de nuevo.');
        } else if (error.code === 'email-already-exists') {
          // Caso especial: email ya existe con otro método
          // Requisito 24.4: Detectar cuando email de OAuth ya existe
          setError('Este email ya está registrado. Inicia sesión para vincular GitHub a tu cuenta.');
          setTimeout(() => {
            // Redirigir a login con mensaje informativo
            router.push('/login?message=' + encodeURIComponent('Este email ya está registrado. Inicia sesión para vincular tu cuenta de GitHub.'));
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
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  // Mensaje de bienvenida - misma tarjeta, solo cambia el texto
  const displayName = userName || '';
  const displayRole = userRole || 'user';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Icono animado */}
        <div className="mb-6">
          <div className={`w-20 h-20 ${isProcessing ? 'bg-gray-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto ${!isProcessing ? 'animate-bounce' : ''}`}>
            {isProcessing ? (
              <svg className="w-10 h-10 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            ) : (
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-semibold mb-2 text-gray-900">
          {isProcessing 
            ? '¡Bienvenido!'
            : `¡Bienvenido, ${displayName}!`}
        </h2>
        
        {/* Subtítulo - cambia según estado */}
        <p className="text-gray-600 mb-6">
          {isProcessing 
            ? 'Conectando con GitHub...'
            : (displayRole === 'admin' 
                ? 'Accediendo al panel de administración...'
                : 'Redirigiendo a tu dashboard...')}
        </p>

        {/* Spinner de carga */}
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>

        {/* Badge de rol - solo cuando tenemos datos */}
        {!isProcessing && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 mb-4">
            {displayRole === 'admin' ? '👑 Administrador' : '👤 Usuario'}
          </div>
        )}
        
        {/* Indicador de seguridad */}
        <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Inicio de sesión seguro con GitHub</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal con Suspense boundary
 * Requerido por Next.js 15 para useSearchParams()
 */
export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md w-full p-8 bg-white rounded-lg shadow-md">
          <div className="mb-6 flex justify-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            Cargando...
          </h2>
        </div>
      </div>
    }>
      <GitHubCallbackContent />
    </Suspense>
  );
}
