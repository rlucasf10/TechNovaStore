/**
 * Caso de uso: Confirmar reset de contraseña
 * Extraído de AuthService.resetPassword()
 */

import { User } from '../shared/models/User';
import { PasswordReset } from '../shared/models/PasswordReset';
import { RefreshToken } from '../shared/models/RefreshToken';
import { logger } from '../shared/utils/logger';

export class ConfirmPasswordReset {
  async execute(token: string, newPassword: string): Promise<boolean> {
    // Validar token de reset
    const resetToken = await PasswordReset.validateToken(token);
    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Buscar usuario
    const user = await User.findByPk(resetToken.user_id);
    if (!user || !user.is_active) {
      throw new Error('Invalid reset token');
    }

    // Hash de la nueva contraseña
    const password_hash = await User.hashPassword(newPassword);

    // Actualizar contraseña del usuario
    await user.update({ password_hash });

    // Marcar token de reset como usado
    await resetToken.markAsUsed();

    // Revocar todos los refresh tokens por seguridad
    await RefreshToken.revokeAllUserTokens(user.id);

    logger.info(`Password reset completed for user: ${user.email}`, { 
      userId: user.id 
    });

    return true;
  }
}
