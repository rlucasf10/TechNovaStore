/**
 * Servicio de OAuth 2.0
 * Maneja el intercambio de código por token y obtención de información del usuario
 */

import axios from 'axios';
import crypto from 'crypto';
import { OAuthProvider, getOAuthConfig } from '../config/oauth';
import { User } from '../models/User';
import { logger } from '../utils/logger';

export interface OAuthUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  avatar?: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export class OAuthService {
  /**
   * Intercambiar código de autorización por access token
   */
  static async exchangeCodeForToken(
    provider: OAuthProvider,
    code: string,
    codeVerifier?: string
  ): Promise<string> {
    const config = getOAuthConfig(provider);

    try {
      const params: any = {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      };

      // Agregar code_verifier si se proporcionó (PKCE)
      if (codeVerifier) {
        params.code_verifier = codeVerifier;
      }

      const response = await axios.post<OAuthTokenResponse>(
        config.tokenUrl,
        params,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!response.data.access_token) {
        throw new Error('No access token received from provider');
      }

      logger.info(`OAuth token exchange successful for ${provider}`);
      return response.data.access_token;
    } catch (error: any) {
      logger.error(`OAuth token exchange failed for ${provider}:`, error.response?.data || error.message);
      throw new Error(`Failed to exchange code for token: ${error.message}`);
    }
  }

  /**
   * Obtener información del usuario del proveedor OAuth
   */
  static async getUserInfo(
    provider: OAuthProvider,
    accessToken: string
  ): Promise<OAuthUserInfo> {
    const config = getOAuthConfig(provider);

    try {
      const response = await axios.get(config.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const data = response.data;

      // Normalizar datos según el proveedor
      if (provider === 'google') {
        return this.normalizeGoogleUserInfo(data);
      } else if (provider === 'github') {
        return this.normalizeGitHubUserInfo(data, accessToken);
      }

      throw new Error(`Unsupported provider: ${provider}`);
    } catch (error: any) {
      logger.error(`Failed to get user info from ${provider}:`, error.response?.data || error.message);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  /**
   * Normalizar información de usuario de Google
   * Nota: Google puede no devolver apellido si el usuario no lo tiene configurado
   */
  private static normalizeGoogleUserInfo(data: any): OAuthUserInfo {
    // Extraer nombre y apellido, manejando casos donde no existan
    let firstName = data.given_name || '';
    let lastName = data.family_name || '';
    
    // Si no hay given_name, intentar extraer del name completo
    if (!firstName && data.name) {
      const nameParts = data.name.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || lastName;
    }
    
    // Si aún no hay nombre, usar valor por defecto
    if (!firstName) {
      firstName = 'Usuario';
    }
    
    // El apellido puede quedar vacío - es válido
    
    return {
      id: data.id,
      email: data.email,
      firstName,
      lastName,
      emailVerified: data.verified_email || false,
      avatar: data.picture,
    };
  }

  /**
   * Normalizar información de usuario de GitHub
   */
  private static async normalizeGitHubUserInfo(
    data: any,
    accessToken: string
  ): Promise<OAuthUserInfo> {
    // GitHub no siempre retorna el email en el perfil público
    let email = data.email;

    // Si no hay email, obtenerlo de la API de emails
    if (!email) {
      try {
        const emailsResponse = await axios.get('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });

        // Buscar el email primario y verificado
        const primaryEmail = emailsResponse.data.find(
          (e: any) => e.primary && e.verified
        );
        email = primaryEmail?.email || emailsResponse.data[0]?.email;
      } catch (error) {
        logger.error('Failed to get GitHub user emails:', error);
      }
    }

    if (!email) {
      throw new Error('No email found in GitHub account');
    }

    // Separar nombre completo en nombre y apellido
    const nameParts = (data.name || data.login || 'Usuario').split(' ');
    const firstName = nameParts[0] || 'Usuario';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      id: data.id.toString(),
      email,
      firstName,
      lastName,
      emailVerified: true, // GitHub requiere email verificado
      avatar: data.avatar_url,
    };
  }

  /**
   * Crear o actualizar usuario desde OAuth
   */
  static async createOrUpdateOAuthUser(
    provider: OAuthProvider,
    userInfo: OAuthUserInfo
  ): Promise<User> {
    const providerIdField = provider === 'google' ? 'google_id' : 'github_id';

    try {
      // Buscar usuario existente por provider ID
      let user = await User.findOne({
        where: { [providerIdField]: userInfo.id },
      });

      if (user) {
        // Usuario existente con este proveedor
        logger.info(`Existing OAuth user found: ${user.email}`, { userId: user.id, provider });
        
        // Actualizar avatar si cambió
        if (userInfo.avatar && user.avatar !== userInfo.avatar) {
          user.avatar = userInfo.avatar;
        }
        
        // Actualizar última vez usado
        await user.updateAuthMethodLastUsed(provider);
        user.last_login = new Date();
        await user.save();
        
        return user;
      }

      // Buscar usuario existente por email
      user = await User.findOne({
        where: { email: userInfo.email.toLowerCase() },
      });

      if (user) {
        // Usuario existe con el mismo email, vincular proveedor OAuth
        logger.info(`Linking ${provider} to existing user: ${user.email}`, { userId: user.id });
        
        // Actualizar provider ID
        user[providerIdField] = userInfo.id;
        
        // Actualizar avatar si no tiene uno o si cambió
        if (userInfo.avatar && (!user.avatar || user.avatar !== userInfo.avatar)) {
          user.avatar = userInfo.avatar;
        }
        
        // Agregar método de autenticación
        await user.addAuthMethod(provider, userInfo.id);
        
        // Verificar email si el proveedor lo confirma
        if (userInfo.emailVerified && !user.email_verified) {
          user.email_verified = true;
        }
        
        user.last_login = new Date();
        await user.save();
        
        return user;
      }

      // Crear nuevo usuario
      logger.info(`Creating new OAuth user: ${userInfo.email}`, { provider });
      
      user = await User.create({
        email: userInfo.email.toLowerCase(),
        password_hash: null, // Usuario OAuth sin contraseña
        first_name: userInfo.firstName,
        last_name: userInfo.lastName,
        avatar: userInfo.avatar, // Guardar imagen de perfil de OAuth
        [providerIdField]: userInfo.id,
        email_verified: userInfo.emailVerified,
        role: 'customer',
        is_active: true,
        auth_methods: [
          {
            type: provider,
            providerId: userInfo.id,
            linkedAt: new Date(),
          },
        ],
      });

      logger.info(`New OAuth user created: ${user.email}`, { userId: user.id, provider });
      return user;
    } catch (error: any) {
      logger.error(`Failed to create/update OAuth user:`, error);
      throw new Error(`Failed to create/update user: ${error.message}`);
    }
  }

  /**
   * Validar code challenge (PKCE)
   */
  static validatePKCE(codeVerifier: string, codeChallenge: string): boolean {
    try {
      // Calcular el challenge desde el verifier
      const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64');
      const calculatedChallenge = hash
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      return calculatedChallenge === codeChallenge;
    } catch (error) {
      logger.error('PKCE validation error:', error);
      return false;
    }
  }
}

export default OAuthService;
