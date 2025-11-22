/**
 * Caso de uso: Actualizar perfil de usuario
 * Extraído de UserController.updateProfile() y AuthService.updateUser()
 */

import { User, UserCreationAttributes } from '../shared/models/User';
import { logger } from '../shared/utils/logger';

export class UpdateUserProfile {
  async execute(
    userId: number,
    updateData: Partial<UserCreationAttributes & { password?: string }>
  ): Promise<Partial<User> | null> {
    const user = await User.findByPk(userId);
    if (!user) {
      return null;
    }

    // Si se está actualizando la contraseña, hashearla
    if (updateData.password) {
      updateData.password_hash = await User.hashPassword(updateData.password);
      delete updateData.password;
    }

    await user.update(updateData);
    
    logger.info(`User profile updated: ${user.email}`, { userId: user.id });

    return user.toJSON();
  }
}
