/**
 * Caso de uso: Solicitar reset de contraseña
 * Extraído de AuthService.requestPasswordReset()
 */

import { User } from '../shared/models/User';
import { PasswordReset } from '../shared/models/PasswordReset';
import { logger } from '../shared/utils/logger';

export class RequestPasswordReset {
  async execute(email: string): Promise<string> {
    const user = await User.findOne({ 
      where: { 
        email: email.toLowerCase(),
        is_active: true,
      } 
    });

    if (!user) {
      // No revelar si el email existe por seguridad
      throw new Error('If the email exists, a password reset link has been sent');
    }

    // Crear token de reset de contraseña
    const resetToken = await PasswordReset.createResetToken(user.id);

    logger.info(`Password reset requested for user: ${user.email}`, { 
      userId: user.id,
      resetTokenId: resetToken.id 
    });

    return resetToken.token;
  }
}
