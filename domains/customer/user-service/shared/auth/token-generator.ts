/**
 * Generador de tokens JWT
 * Extraído de AuthService.generateTokens()
 */

import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generar tokens de acceso y refresh para un usuario
 */
export async function generateTokens(
  user: User,
  deviceInfo?: string,
  ipAddress?: string
): Promise<AuthTokens> {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessTokenExpiry,
  } as any);

  // Crear refresh token en base de datos
  const refreshTokenRecord = await RefreshToken.createToken(
    user.id,
    config.jwt.refreshTokenExpiry,
    deviceInfo,
    ipAddress
  );

  return {
    accessToken,
    refreshToken: refreshTokenRecord.token,
  };
}
