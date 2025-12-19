/**
 * Caso de uso: Autenticación OAuth
 * Extraído de OAuthService y AuthController.oauthCallback()
 * 
 * NOTA IMPORTANTE: Este caso de uso genera tokens JWT después de una autenticación
 * OAuth exitosa. Los tokens serán establecidos como httpOnly cookies por el controlador.
 * NO se debe almacenar el token en localStorage en el frontend, ya que las cookies
 * httpOnly son más seguras y protegen contra ataques XSS.
 */

import { OAuthService, OAuthUserInfo } from '../shared/services/OAuthService';
import { OAuthProvider } from '../shared/config/oauth';
import { User } from '../shared/models/User';
import { generateTokens, AuthTokens } from '../shared/auth/token-generator';
import { logger } from '../shared/utils/logger';

export interface OAuthCallbackData {
  provider: OAuthProvider;
  code: string;
  codeVerifier?: string;
}

export interface AuthResponse {
  user: Partial<User>;
  tokens: AuthTokens;
}

export class OAuthAuthentication {
  async execute(data: OAuthCallbackData): Promise<AuthResponse> {
    const { provider, code, codeVerifier } = data;

    logger.info(`OAuth callback received for ${provider}`);

    // 1. Intercambiar código por access token
    const accessToken = await OAuthService.exchangeCodeForToken(
      provider,
      code,
      codeVerifier
    );

    // 2. Obtener información del usuario del proveedor
    const userInfo = await OAuthService.getUserInfo(provider, accessToken);

    // 3. Crear o actualizar usuario en nuestra base de datos
    const user = await OAuthService.createOrUpdateOAuthUser(provider, userInfo);

    // 4. Generar nuestros propios tokens JWT
    const tokens = await generateTokens(user);

    logger.info(`OAuth login successful for user: ${user.email}`, { 
      userId: user.id, 
      provider 
    });

    return {
      user: user.toJSON(),
      tokens,
    };
  }
}
