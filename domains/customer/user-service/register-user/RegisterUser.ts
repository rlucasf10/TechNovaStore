/**
 * Caso de uso: Registrar nuevo usuario
 * Extraído de AuthService.register()
 */

import { User, UserCreationAttributes } from '../shared/models/User';
import { logger } from '../shared/utils/logger';
import { generateTokens, AuthTokens } from '../shared/auth/token-generator';

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  role: 'customer' | 'admin';
}

export interface AuthResponse {
  user: Partial<User>;
  tokens: AuthTokens;
}

export class RegisterUser {
  async execute(userData: RegisterData): Promise<AuthResponse> {
    const { password, ...userInfo } = userData;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash de la contraseña
    const password_hash = await User.hashPassword(password);

    // Crear usuario
    const user = await User.create({
      ...userInfo,
      password_hash,
      is_active: true,
      email_verified: false,
      auth_methods: [
        {
          type: 'password' as const,
          linkedAt: new Date(),
        },
      ],
    } as UserCreationAttributes);

    logger.info(`User registered: ${user.email}`, { userId: user.id });

    // Generar tokens
    const tokens = await generateTokens(user);

    return {
      user: user.toJSON(),
      tokens,
    };
  }
}
