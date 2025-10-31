/**
 * Hook personalizado para manejo de rate limiting
 * 
 * Proporciona utilidades para verificar límites de rate limiting,
 * manejar estados de bloqueo y mostrar countdown timers.
 * 
 * Características:
 * - Verificación de límites en tiempo real
 * - Countdown timer automático
 * - Persistencia en localStorage
 * - Callbacks para eventos de expiración
 * - Integración con componente RateLimitMessage
 * 
 * Requisitos: 23.10
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RateLimitState, RateLimitConfig } from '@/types/auth.types';

// ============================================================================
// Tipos
// ============================================================================

export interface UseRateLimitOptions {
  /** Configuración del rate limiting */
  config: RateLimitConfig;
  /** Callback cuando el bloqueo expira */
  onExpire?: () => void;
  /** Callback cuando se registra un intento */
  onAttempt?: (attempts: number) => void;
  /** Callback cuando se alcanza el límite */
  onLimitReached?: (remainingTime: number) => void;
}

export interface UseRateLimitReturn {
  /** Si está actualmente bloqueado */
  isBlocked: boolean;
  /** Tiempo restante en segundos (0 si no está bloqueado) */
  remainingTime: number;
  /** Número de intentos actuales */
  attempts: number;
  /** Verificar si una acción está permitida */
  checkLimit: () => { allowed: boolean; remainingTime?: number };
  /** Registrar un intento fallido */
  recordAttempt: () => void;
  /** Resetear el contador de intentos */
  reset: () => void;
  /** Resetear todos los rate limits (desarrollo) */
  resetAll: () => void;
  /** Obtener el estado actual */
  getState: () => RateLimitState;
}

// ============================================================================
// Configuraciones predefinidas
// ============================================================================

export const RATE_LIMIT_CONFIGS = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 15 * 60 * 1000, // 15 minutos
  },
  forgotPassword: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 60 * 60 * 1000, // 1 hora
  },
  register: {
    maxAttempts: 3,
    windowMs: 10 * 60 * 1000, // 10 minutos
    blockDurationMs: 10 * 60 * 1000, // 10 minutos
  },
  changePassword: {
    maxAttempts: 5,
    windowMs: 30 * 60 * 1000, // 30 minutos
    blockDurationMs: 30 * 60 * 1000, // 30 minutos
  },
} as const;

// ============================================================================
// Hook useRateLimit
// ============================================================================

/**
 * Hook para manejo de rate limiting con countdown timer
 * 
 * @param action - Nombre de la acción (usado como clave en localStorage)
 * @param options - Opciones de configuración
 * 
 * @example
 * // Uso básico con configuración predefinida
 * const rateLimit = useRateLimit('login', {
 *   config: RATE_LIMIT_CONFIGS.login,
 *   onExpire: () => setShowRateLimit(false),
 *   onLimitReached: (time) => setRateLimitTime(time),
 * });
 * 
 * // Verificar antes de hacer una acción
 * const handleLogin = async () => {
 *   const { allowed, remainingTime } = rateLimit.checkLimit();
 *   if (!allowed) {
 *     setRateLimitTime(remainingTime);
 *     return;
 *   }
 *   
 *   try {
 *     await authService.login(credentials);
 *     rateLimit.reset(); // Resetear en caso de éxito
 *   } catch (error) {
 *     rateLimit.recordAttempt(); // Registrar intento fallido
 *   }
 * };
 */
export function useRateLimit(
  action: string,
  options: UseRateLimitOptions
): UseRateLimitReturn {
  const { config, onExpire, onAttempt, onLimitReached } = options;
  
  // Estados
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [attempts, setAttempts] = useState(0);
  
  // Referencias para callbacks
  const onExpireRef = useRef(onExpire);
  const onAttemptRef = useRef(onAttempt);
  const onLimitReachedRef = useRef(onLimitReached);
  
  // Actualizar referencias
  useEffect(() => {
    onExpireRef.current = onExpire;
    onAttemptRef.current = onAttempt;
    onLimitReachedRef.current = onLimitReached;
  }, [onExpire, onAttempt, onLimitReached]);

  // ============================================================================
  // Utilidades de Storage
  // ============================================================================

  const getStorageKey = useCallback(() => `rate_limit_${action}`, [action]);

  const getStoredState = useCallback((): RateLimitState => {
    if (typeof window === 'undefined') {
      return { attempts: 0, lastAttempt: 0 };
    }

    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) {
        return { attempts: 0, lastAttempt: 0 };
      }
      return JSON.parse(stored);
    } catch {
      return { attempts: 0, lastAttempt: 0 };
    }
  }, [getStorageKey]);

  const setStoredState = useCallback((state: RateLimitState) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(state));
    } catch (error) {
      console.error('Error saving rate limit state:', error);
    }
  }, [getStorageKey]);

  // ============================================================================
  // Lógica de Rate Limiting
  // ============================================================================

  const checkLimit = useCallback((): { allowed: boolean; remainingTime?: number } => {
    const state = getStoredState();
    const now = Date.now();

    // Si está bloqueado, verificar si ya pasó el tiempo de bloqueo
    if (state.blockedUntil && state.blockedUntil > now) {
      const remainingMs = state.blockedUntil - now;
      return {
        allowed: false,
        remainingTime: Math.ceil(remainingMs / 1000),
      };
    }

    // Si pasó la ventana de tiempo, resetear intentos
    if (now - state.lastAttempt > config.windowMs) {
      const resetState = { attempts: 0, lastAttempt: now };
      setStoredState(resetState);
      setAttempts(0);
      setIsBlocked(false);
      setRemainingTime(0);
      return { allowed: true };
    }

    // Verificar si excedió el límite
    if (state.attempts >= config.maxAttempts) {
      const blockedUntil = state.lastAttempt + config.blockDurationMs;
      const updatedState = { ...state, blockedUntil };
      setStoredState(updatedState);
      
      const remainingMs = blockedUntil - now;
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      setIsBlocked(true);
      setRemainingTime(remainingSeconds);
      
      // Notificar que se alcanzó el límite
      onLimitReachedRef.current?.(remainingSeconds);
      
      return {
        allowed: false,
        remainingTime: remainingSeconds,
      };
    }

    return { allowed: true };
  }, [config, getStoredState, setStoredState]);

  const recordAttempt = useCallback(() => {
    const state = getStoredState();
    const now = Date.now();
    
    const newAttempts = state.attempts + 1;
    const newState: RateLimitState = {
      attempts: newAttempts,
      lastAttempt: now,
    };
    
    setStoredState(newState);
    setAttempts(newAttempts);
    
    // Notificar el intento
    onAttemptRef.current?.(newAttempts);
    
    // Verificar si se alcanzó el límite después de este intento
    if (newAttempts >= config.maxAttempts) {
      const blockedUntil = now + config.blockDurationMs;
      const blockedState = { ...newState, blockedUntil };
      setStoredState(blockedState);
      
      const remainingSeconds = Math.ceil(config.blockDurationMs / 1000);
      setIsBlocked(true);
      setRemainingTime(remainingSeconds);
      
      // Notificar que se alcanzó el límite
      onLimitReachedRef.current?.(remainingSeconds);
    }
  }, [config, getStoredState, setStoredState]);

  const reset = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(getStorageKey());
    setAttempts(0);
    setIsBlocked(false);
    setRemainingTime(0);
  }, [getStorageKey]);

  // Función de desarrollo para resetear todos los rate limits
  const resetAll = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('rate_limit_')) {
        localStorage.removeItem(key);
      }
    });
    
    setAttempts(0);
    setIsBlocked(false);
    setRemainingTime(0);
    
    console.log('🧹 All rate limits cleared!');
  }, []);

  const getState = useCallback((): RateLimitState => {
    return getStoredState();
  }, [getStoredState]);

  // ============================================================================
  // Efectos
  // ============================================================================

  /**
   * Inicializar estado desde localStorage
   */
  useEffect(() => {
    const state = getStoredState();
    const now = Date.now();
    
    setAttempts(state.attempts);
    
    // Verificar si está bloqueado
    if (state.blockedUntil && state.blockedUntil > now) {
      const remainingMs = state.blockedUntil - now;
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      setIsBlocked(true);
      setRemainingTime(remainingSeconds);
    } else {
      setIsBlocked(false);
      setRemainingTime(0);
    }
  }, [getStoredState]);

  /**
   * Countdown timer
   */
  useEffect(() => {
    if (!isBlocked || remainingTime <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsBlocked(false);
          onExpireRef.current?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBlocked, remainingTime]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    isBlocked,
    remainingTime,
    attempts,
    checkLimit,
    recordAttempt,
    reset,
    resetAll,
    getState,
  };
}

// ============================================================================
// Hook useLoginRateLimit
// ============================================================================

/**
 * Hook especializado para rate limiting de login
 * Configuración predefinida para intentos de inicio de sesión
 */
export function useLoginRateLimit(options?: Partial<UseRateLimitOptions>): UseRateLimitReturn {
  return useRateLimit('login', {
    config: RATE_LIMIT_CONFIGS.login,
    ...options,
  });
}

// ============================================================================
// Hook useForgotPasswordRateLimit
// ============================================================================

/**
 * Hook especializado para rate limiting de recuperación de contraseña
 * Configuración predefinida para solicitudes de recuperación
 */
export function useForgotPasswordRateLimit(options?: Partial<UseRateLimitOptions>): UseRateLimitReturn {
  return useRateLimit('forgotPassword', {
    config: RATE_LIMIT_CONFIGS.forgotPassword,
    ...options,
  });
}

// ============================================================================
// Hook useRegisterRateLimit
// ============================================================================

/**
 * Hook especializado para rate limiting de registro
 * Configuración predefinida para intentos de registro
 */
export function useRegisterRateLimit(options?: Partial<UseRateLimitOptions>): UseRateLimitReturn {
  return useRateLimit('register', {
    config: RATE_LIMIT_CONFIGS.register,
    ...options,
  });
}

// ============================================================================
// Hook useChangePasswordRateLimit
// ============================================================================

/**
 * Hook especializado para rate limiting de cambio de contraseña
 * Configuración predefinida para intentos de cambio de contraseña
 */
export function useChangePasswordRateLimit(options?: Partial<UseRateLimitOptions>): UseRateLimitReturn {
  return useRateLimit('changePassword', {
    config: RATE_LIMIT_CONFIGS.changePassword,
    ...options,
  });
}

export default useRateLimit;