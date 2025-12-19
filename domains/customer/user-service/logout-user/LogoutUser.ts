import { Request, Response } from 'express';
import { logger } from '../shared/utils/logger';
import { clearAuthCookie } from '../../../../shared/infrastructure/utils/src/cookie.utils';

/**
 * Caso de uso: Cerrar sesión de usuario
 * 
 * NOTA IMPORTANTE: Este caso de uso maneja el logout del usuario invalidando
 * la cookie httpOnly estableciendo su maxAge a 0.
 * NO se debe usar localStorage para almacenar tokens, ya que usamos httpOnly cookies
 * que son más seguras y protegen contra ataques XSS.
 * 
 * Este endpoint sirve para:
 * - Registrar el evento de logout para auditoría
 * - Invalidar la cookie httpOnly (usando clearAuthCookie)
 * - Invalidar refresh tokens si se implementa
 * - Limpiar sesiones activas si se implementa
 */
export class LogoutUser {
  async execute(req: Request, res: Response): Promise<void> {
    try {
      // Obtener información del usuario autenticado (si está disponible)
      const user = (req as any).user;
      
      if (user) {
        logger.info('User logged out', {
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString()
        });
      }

      // Invalidar la cookie httpOnly antes de responder
      clearAuthCookie(res);

      // En el futuro, aquí se podría:
      // 1. Invalidar el refresh token en la base de datos
      // 2. Agregar el access token a una blacklist en Redis
      // 3. Limpiar sesiones activas

      res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });

    } catch (error) {
      logger.error('Error during logout:', error);
      
      // Incluso si hay un error, invalidamos la cookie y devolvemos éxito
      // porque el cliente debe poder cerrar sesión de todas formas
      clearAuthCookie(res);
      
      res.status(200).json({
        success: true,
        message: 'Sesión cerrada'
      });
    }
  }
}
