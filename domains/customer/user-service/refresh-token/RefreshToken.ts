/**
 * Caso de uso: Renovar token de acceso
 * Extraído de AuthService.refreshToken()
 * 
 * NOTA IMPORTANTE: Este caso de uso genera nuevos tokens JWT que serán establecidos
 * como httpOnly cookies por el controlador. El token actual se lee desde la cookie
 * httpOnly, NO desde localStorage. Las cookies httpOnly son más seguras y protegen
 * contra ataques XSS.
 */

import { User } from '../shared/models/User';
import { RefreshToken } from '../shared/models/RefreshToken';
import { generateTokens, AuthTokens } from '../shared/auth/token-generator';

export class RefreshTokenUseCase {
  async execute(
    refreshTokenString: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    try {
      // Validar refresh token en base de datos
      const refreshToken = await RefreshToken.validateToken(refreshTokenString);
      if (!refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Buscar usuario
      const user = await User.findByPk(refreshToken.user_id);
      if (!user || !user.is_active) {
        throw new Error('Invalid refresh token');
      }

      // Revocar el refresh token antiguo
      await refreshToken.revoke();

      // Generar nuevos tokens
      return generateTokens(user, deviceInfo, ipAddress);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}
