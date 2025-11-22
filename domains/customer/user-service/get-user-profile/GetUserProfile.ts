/**
 * Caso de uso: Obtener perfil de usuario
 * Extraído de UserController.getProfile() y AuthService.getUserById()
 */

import { User } from '../shared/models/User';

export class GetUserProfile {
  async execute(userId: number): Promise<Partial<User> | null> {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return null;
    }

    return user.toJSON();
  }
}
