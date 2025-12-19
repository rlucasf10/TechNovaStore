import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para extraer información del usuario de los headers
 * 
 * El API Gateway pasa la información del usuario autenticado en headers:
 * - x-user-id: ID del usuario
 * - x-user-email: Email del usuario
 * - x-user-role: Rol del usuario (user, admin)
 * 
 * Este middleware extrae esos headers y los pone en req.user
 */
export function extractUser(req: Request, _res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'] as string;
  const userEmail = req.headers['x-user-email'] as string;
  const userRole = req.headers['x-user-role'] as string;

  if (userId) {
    (req as any).user = {
      id: userId,
      email: userEmail || '',
      role: userRole || 'user',
      // Intentar obtener el nombre del header o usar un valor por defecto
      name: req.headers['x-user-name'] as string || userEmail?.split('@')[0] || 'Usuario',
      firstName: req.headers['x-user-firstname'] as string || userEmail?.split('@')[0] || 'Usuario',
    };
  }

  next();
}
