/**
 * Utilidades para manejo de cookies httpOnly en autenticación
 * 
 * Este módulo proporciona funciones para establecer, leer e invalidar
 * cookies httpOnly que contienen tokens JWT de autenticación.
 * 
 * Las cookies httpOnly son más seguras que localStorage porque:
 * - No son accesibles desde JavaScript (protección contra XSS)
 * - Se envían automáticamente en cada petición
 * - Pueden configurarse con flags de seguridad (Secure, SameSite)
 */

import { Request, Response } from 'express';

/**
 * Configuración de cookies por entorno
 */
interface CookieConfig {
  name: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  domain?: string;
  path: string;
}

/**
 * Obtener configuración de cookies según el entorno
 * 
 * Configuración de máxima seguridad:
 * - httpOnly: true (no accesible desde JavaScript)
 * - secure: true en producción (solo HTTPS)
 * - sameSite: 'strict' (máxima protección CSRF)
 * - maxAge: 24 horas
 * 
 * @returns Configuración de cookie
 */
export const getCookieConfig = (): CookieConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN;
  
  return {
    name: 'auth_token',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    domain: isProduction && domain ? domain : undefined,
    path: '/',
  };
};

/**
 * Establecer cookie httpOnly con el token JWT
 * 
 * Configuración de seguridad:
 * - httpOnly: true (protección XSS)
 * - secure: true en producción (solo HTTPS)
 * - sameSite: 'strict' (protección CSRF)
 * - maxAge: 24 horas
 * 
 * @param res - Objeto Response de Express
 * @param token - Token JWT a almacenar en la cookie
 */
export const setAuthCookie = (res: Response, token: string): void => {
  const config = getCookieConfig();
  
  res.cookie(config.name, token, {
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    maxAge: config.maxAge,
    domain: config.domain,
    path: config.path,
  });
};

/**
 * Invalidar cookie httpOnly
 * 
 * Invalida la cookie de autenticación estableciendo su maxAge a 0.
 * Mantiene los mismos flags para que el navegador la identifique correctamente.
 * 
 * @param res - Objeto Response de Express
 */
export const clearAuthCookie = (res: Response): void => {
  const config = getCookieConfig();
  
  res.cookie(config.name, '', {
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    maxAge: 0,
    domain: config.domain,
    path: config.path,
  });
};

/**
 * Leer token desde cookie httpOnly
 * 
 * Lee el token de autenticación desde:
 * 1. Cookie httpOnly (prioridad)
 * 2. Authorization header (fallback para APIs)
 * 
 * @param req - Objeto Request de Express
 * @returns Token JWT o null si no se encuentra
 */
export const getAuthToken = (req: Request): string | null => {
  const config = getCookieConfig();
  const token = req.cookies?.[config.name];
  
  if (token) {
    return token;
  }
  
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};
