/**
 * Caso de uso: Desactivar cuenta
 * Extraído de UserController.deleteAccount() y AuthService.deactivateUser()
 */

import { User } from '../shared/models/User';
import { logger } from '../shared/utils/logger';

export class DeactivateAccount {
  async execute(userId: number): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) {
      return false;
    }

    user.is_active = false;
    await user.save();
    
    logger.info(`User deactivated: ${user.email}`, { userId: user.id });
    return true;
  }
}
