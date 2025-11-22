/**
 * Caso de uso: Cambiar contraseña
 * Extraído de UserController.changePassword()
 */

import { User } from '../shared/models/User';
import { logger } from '../shared/utils/logger';

export class ChangePassword {
  async execute(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Validar contraseña actual
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Actualizar contraseña
    const password_hash = await User.hashPassword(newPassword);
    await user.update({ password_hash });

    logger.info(`Password changed for user: ${user.email}`, { userId: user.id });

    return true;
  }
}
