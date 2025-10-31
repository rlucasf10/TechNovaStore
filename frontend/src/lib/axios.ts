/**
 * Configuración de Axios con interceptors
 * 
 * Este archivo configura una instancia de Axios con:
 * - Base URL del API
 * - Interceptors para agregar tokens automáticamente
 * - Manejo de refresh tokens
 * - Manejo de errores globales
 */

import axios, { AxiosError, AxiosResponse } from 'axios';

// Crear instancia de Axios
export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para cookies httpOnly
});

// Request interceptor - Agregar token de autenticación
axiosInstance.interceptors.request.use(
  config => {
    // El token se envía automáticamente en cookies httpOnly
    // No es necesario agregarlo manualmente al header
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

    // Si el error es 401 y no hemos intentado refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar refresh token
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Reintentar la petición original
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Si el refresh falla, redirigir a login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
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
