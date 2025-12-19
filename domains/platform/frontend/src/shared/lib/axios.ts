/**
 * Configuración de Axios con interceptors
 * 
 * Este archivo configura una instancia de Axios con:
 * - Base URL del API
 * - withCredentials: true para envío automático de httpOnly cookies
 * - Interceptors para agregar CSRF tokens
 * - Manejo de refresh tokens
 * - Manejo de errores globales
 * 
 * ✅ SEGURIDAD: La autenticación se maneja mediante httpOnly cookies
 * NO se almacenan tokens en localStorage para prevenir ataques XSS
 */

import axios, { AxiosError, AxiosResponse } from 'axios';

// Crear instancia de Axios
// IMPORTANTE: Usar rutas relativas para que funcionen a través de Next.js API Routes
// Las API Routes actúan como proxy al API Gateway interno
export const axiosInstance = axios.create({
  baseURL: '/api', // Rutas relativas que apuntan a Next.js API Routes
  // ✅ PERFORMANCE: Timeout más largo en desarrollo para compilaciones lentas de Next.js
  timeout: process.env.NODE_ENV === 'development' ? 60000 : 30000, // 60s dev, 30s prod
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para cookies httpOnly
});

// Cache para CSRF token
let csrfToken: string | null = null;
let csrfSessionId: string | null = null;

// Función para obtener CSRF token
async function getCSRFToken(): Promise<{ token: string; sessionId: string }> {
  if (csrfToken && csrfSessionId) {
    return { token: csrfToken, sessionId: csrfSessionId };
  }

  try {
    if (!csrfSessionId) {
      csrfSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';
    const response = await axios.get(`${baseUrl}/api/csrf-token`, {
      headers: { 'X-Session-ID': csrfSessionId },
      withCredentials: true,
      timeout: 5000,
    });

    csrfToken = response.data.csrfToken || response.data.token;
    csrfSessionId = response.data.sessionId || csrfSessionId;

    return { token: csrfToken!, sessionId: csrfSessionId! };
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    throw error;
  }
}

// Request interceptor - Agregar CSRF token
// ✅ SEGURIDAD: NO agregamos Authorization header con tokens de localStorage
// La autenticación se maneja automáticamente mediante httpOnly cookies
// que el navegador envía con withCredentials: true
axiosInstance.interceptors.request.use(
  async config => {
    // Para peticiones que modifican datos, añadir CSRF token
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      try {
        const { token, sessionId } = await getCSRFToken();
        config.headers['X-CSRF-Token'] = token;
        config.headers['X-Session-ID'] = sessionId;
      } catch {
        // Continuar sin CSRF token si falla
      }
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Manejar errores y refresh token
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean });
    const requestUrl = originalRequest?.url || '';

    // Lista de endpoints donde los errores 401 son esperados (usuario no autenticado o sin permisos)
    // NO intentar refresh token para estos endpoints
    const expectedUnauthorizedEndpoints = [
      '/auth/me',
      '/users/profile',
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/admin/', // Todos los endpoints de admin pueden fallar con 401 si no hay permisos
    ];

    // Verificar si el endpoint está en la lista de endpoints esperados
    const isExpectedUnauthorized = expectedUnauthorizedEndpoints.some(endpoint => 
      requestUrl.includes(endpoint)
    );

    // Si el error es 401 y no hemos intentado refresh token
    // Y NO es un endpoint donde 401 es esperado
    if (error.response?.status === 401 && !originalRequest._retry && !isExpectedUnauthorized) {
      originalRequest._retry = true;

      try {
        // Obtener CSRF token para el refresh
        const { token: csrfTokenForRefresh, sessionId: csrfSessionIdForRefresh } = await getCSRFToken();
        
        // Intentar refresh token con CSRF token
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { 
            withCredentials: true,
            headers: {
              'X-CSRF-Token': csrfTokenForRefresh,
              'X-Session-ID': csrfSessionIdForRefresh,
            }
          }
        );

        // Reintentar la petición original
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Si el refresh falla, redirigir a login solo si no estamos ya ahí
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Para endpoints donde 401 es esperado, simplemente rechazar sin intentar refresh
    if (error.response?.status === 401 && isExpectedUnauthorized) {
      return Promise.reject(error);
    }

    // Manejar otros errores
    return Promise.reject(error);
  }
);

// Tipos de error personalizados
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

// Helper para extraer mensaje de error
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;
    return apiError?.message || error.message || 'Error desconocido';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido';
};

// Helper para verificar si es error de red
export const isNetworkError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && !error.response;
};

export default axiosInstance;
