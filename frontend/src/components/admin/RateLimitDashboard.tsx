/**
 * Componente RateLimitDashboard
 * 
 * Dashboard de administración para monitorear el estado de rate limiting
 * de todos los usuarios del sistema.
 * 
 * Características:
 * - Vista general de usuarios bloqueados
 * - Estadísticas de intentos fallidos
 * - Capacidad de resetear límites manualmente
 * - Alertas de seguridad
 * 
 * Requisitos: 23.10 (vista de administración)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { RateLimitStatus } from '@/components/auth';

// ============================================================================
// Tipos
// ============================================================================

interface RateLimitStats {
  totalBlockedUsers: number;
  loginAttempts24h: number;
  forgotPasswordRequests24h: number;
  mostBlockedAction: string;
  averageBlockDuration: number;
}

interface BlockedUser {
  id: string;
  email: string;
  action: string;
  blockedUntil: Date;
  attempts: number;
  lastAttempt: Date;
}

// ============================================================================
// Componente RateLimitDashboard
// ============================================================================

export function RateLimitDashboard() {
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================================
  // Efectos
  // ============================================================================

  useEffect(() => {
    loadRateLimitData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadRateLimitData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // Funciones
  // ============================================================================

  const loadRateLimitData = async () => {
    try {
      setIsLoading(true);
      
      // NOTA: En una implementación real, estos datos vendrían del backend
      // Por ahora, simulamos datos para demostrar la funcionalidad
      
      // Simular estadísticas
      const mockStats: RateLimitStats = {
        totalBlockedUsers: 3,
        loginAttempts24h: 47,
        forgotPasswordRequests24h: 12,
        mostBlockedAction: 'login',
        averageBlockDuration: 15 * 60, // 15 minutos
      };
      
      // Simular usuarios bloqueados
      const mockBlockedUsers: BlockedUser[] = [
        {
          id: '1',
          email: 'usuario1@example.com',
          action: 'login',
          blockedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
          attempts: 5,
          lastAttempt: new Date(Date.now() - 2 * 60 * 1000), // hace 2 minutos
        },
        {
          id: '2',
          email: 'usuario2@example.com',
          action: 'forgotPassword',
          blockedUntil: new Date(Date.now() + 45 * 60 * 1000), // 45 minutos
          attempts: 3,
          lastAttempt: new Date(Date.now() - 15 * 60 * 1000), // hace 15 minutos
        },
      ];
      
      setStats(mockStats);
      setBlockedUsers(mockBlockedUsers);
    } catch (error) {
      console.error('Error loading rate limit data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetUserRateLimit = async (userId: string, action: string) => {
    try {
      // NOTA: En una implementación real, esto haría una llamada al backend
      console.log(`Resetting rate limit for user ${userId}, action ${action}`);
      
      // Simular reset exitoso
      setBlockedUsers(prev => prev.filter(user => !(user.id === userId && user.action === action)));
      
      // Mostrar notificación de éxito (en una implementación real)
      alert(`Rate limit reset exitoso para ${action}`);
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      alert('Error al resetear rate limit');
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getTimeUntilUnblock = (blockedUntil: Date): string => {
    const now = new Date();
    const diff = Math.max(0, Math.floor((blockedUntil.getTime() - now.getTime()) / 1000));
    return formatTime(diff);
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Monitoreo de Rate Limiting
        </h2>
        <button
          onClick={loadRateLimitData}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Estadísticas generales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Usuarios Bloqueados
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalBlockedUsers}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Intentos de Login (24h)
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.loginAttempts24h}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Recuperaciones (24h)
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.forgotPasswordRequests24h}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Duración Promedio
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatTime(stats.averageBlockDuration)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de usuarios bloqueados */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Usuarios Actualmente Bloqueados
          </h3>
          
          {blockedUsers.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios bloqueados</h3>
              <p className="mt-1 text-sm text-gray-500">
                Todos los usuarios pueden acceder normalmente.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Intentos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Se desbloquea en
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blockedUsers.map((user) => (
                    <tr key={`${user.id}-${user.action}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {user.action === 'login' ? 'Inicio de sesión' : 'Recuperación'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.attempts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTimeUntilUnblock(user.blockedUntil)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => resetUserRateLimit(user.id, user.action)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Desbloquear
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Estado del sistema */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Configuración del Sistema
          </h3>
          <RateLimitStatus
            actions={['login', 'forgotPassword', 'register', 'changePassword']}
            allowReset={true}
          />
        </div>
      </div>
    </div>
  );
}

export default RateLimitDashboard;