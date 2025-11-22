/**
 * Caso de uso: Autenticar usuario
 * Extraído de AuthService.login()
 */

import { User } from '../shared/models/User';
import { logger } from '../shared/utils/logger';
import { generateTokens, AuthTokens } from '../shared/auth/token-generator';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Partial<User>;
  tokens: AuthTokens;
}

export class AuthenticateUser {
  async execute(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Buscar usuario
    const user = await User.findOne({ 
      where: { 
        email: email.toLowerCase(),
        is_active: true,
      } 
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Validar contraseña
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Actualizar último login
    user.last_login = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`, { userId: user.id });

    // Generar tokens
    const tokens = await generateTokens(user);

    return {
      user: user.toJSON(),
      tokens,
    };
  }
}
