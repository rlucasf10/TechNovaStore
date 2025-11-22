/**
 * Caso de uso: Validar token de acceso
 * Extraído de AuthService.validateAccessToken()
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../shared/models/User';

export interface TokenValidationResult {
  valid: boolean;
  user?: Partial<User>;
  error?: string;
}

export class ValidateAccessToken {
  async execute(token: string): Promise<TokenValidationResult> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      // Buscar usuario para asegurar que aún existe y está activo
      const user = await User.findByPk(decoded.id);
      if (!user || !user.is_active) {
        return { valid: false, error: 'User not found or inactive' };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'Token expired' };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'Invalid token' };
      }
      return { valid: false, error: 'Token validation failed' };
    }
  }
}
