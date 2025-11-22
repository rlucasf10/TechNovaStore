/**
 * Tests MUY COMPLETOS para el caso de uso: Autenticación OAuth
 */

import { OAuthAuthentication } from './OAuthAuthentication';
import { OAuthService } from '../shared/services/OAuthService';
import { generateTokens } from '../shared/auth/token-generator';

jest.mock('../shared/services/OAuthService');
jest.mock('../shared/auth/token-generator');
jest.mock('../shared/utils/logger');

describe('OAuthAuthentication', () => {
  let oauthAuthentication: OAuthAuthentication;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    oauthAuthentication = new OAuthAuthentication();

    mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      toJSON: jest.fn().mockReturnValue({
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      }),
    };
  });

  describe('Casos exitosos', () => {
    it('should authenticate user with Google OAuth', async () => {
      const mockUserInfo = {
        id: 'google_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: true,
      };

      (OAuthService.exchangeCodeForToken as jest.Mock).mockResolvedValue('access_token');
      (OAuthService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (OAuthService.createOrUpdateOAuthUser as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'jwt_token',
        refreshToken: 'refresh_token',
      });

      const result = await oauthAuthentication.execute({
        provider: 'google',
        code: 'auth_code',
        codeVerifier: 'verifier',
      });

      expect(OAuthService.exchangeCodeForToken).toHaveBeenCalledWith('google', 'auth_code', 'verifier');
      expect(OAuthService.getUserInfo).toHaveBeenCalledWith('google', 'access_token');
      expect(OAuthService.createOrUpdateOAuthUser).toHaveBeenCalledWith('google', mockUserInfo);
      expect(generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        user: expect.objectContaining({ id: 1 }),
        tokens: {
          accessToken: 'jwt_token',
          refreshToken: 'refresh_token',
        },
      });
    });

    it('should authenticate user with GitHub OAuth', async () => {
      const mockUserInfo = {
        id: 'github_456',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        emailVerified: true,
      };

      (OAuthService.exchangeCodeForToken as jest.Mock).mockResolvedValue('github_token');
      (OAuthService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (OAuthService.createOrUpdateOAuthUser as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'jwt',
        refreshToken: 'refresh',
      });

      const result = await oauthAuthentication.execute({
        provider: 'github',
        code: 'github_code',
      });

      expect(OAuthService.exchangeCodeForToken).toHaveBeenCalledWith('github', 'github_code', undefined);
      expect(result).toBeDefined();
    });

    it('should handle OAuth without code verifier', async () => {
      const mockUserInfo = {
        id: 'google_789',
        email: 'user@example.com',
        firstName: 'User',
        lastName: 'Test',
        emailVerified: true,
      };

      (OAuthService.exchangeCodeForToken as jest.Mock).mockResolvedValue('token');
      (OAuthService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (OAuthService.createOrUpdateOAuthUser as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'jwt',
        refreshToken: 'refresh',
      });

      await oauthAuthentication.execute({
        provider: 'google',
        code: 'code',
      });

      expect(OAuthService.exchangeCodeForToken).toHaveBeenCalledWith('google', 'code', undefined);
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if code exchange fails', async () => {
      (OAuthService.exchangeCodeForToken as jest.Mock).mockRejectedValue(
        new Error('Exchange failed')
      );

      await expect(
        oauthAuthentication.execute({
          provider: 'google',
          code: 'invalid_code',
        })
      ).rejects.toThrow('Exchange failed');
    });

    it('should throw error if getting user info fails', async () => {
      (OAuthService.exchangeCodeForToken as jest.Mock).mockResolvedValue('token');
      (OAuthService.getUserInfo as jest.Mock).mockRejectedValue(new Error('User info failed'));

      await expect(
        oauthAuthentication.execute({
          provider: 'google',
          code: 'code',
        })
      ).rejects.toThrow('User info failed');
    });

    it('should throw error if creating user fails', async () => {
      const mockUserInfo = {
        id: 'google_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: true,
      };

      (OAuthService.exchangeCodeForToken as jest.Mock).mockResolvedValue('token');
      (OAuthService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (OAuthService.createOrUpdateOAuthUser as jest.Mock).mockRejectedValue(
        new Error('Create failed')
      );

      await expect(
        oauthAuthentication.execute({
          provider: 'google',
          code: 'code',
        })
      ).rejects.toThrow('Create failed');
    });

    it('should throw error if token generation fails', async () => {
      const mockUserInfo = {
        id: 'google_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: true,
      };

      (OAuthService.exchangeCodeForToken as jest.Mock).mockResolvedValue('token');
      (OAuthService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (OAuthService.createOrUpdateOAuthUser as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockRejectedValue(new Error('Token generation failed'));

      await expect(
        oauthAuthentication.execute({
          provider: 'google',
          code: 'code',
        })
      ).rejects.toThrow('Token generation failed');
    });
  });

  describe('Validación', () => {
    it('should handle empty code', async () => {
      (OAuthService.exchangeCodeForToken as jest.Mock).mockRejectedValue(
        new Error('Code is required')
      );

      await expect(
        oauthAuthentication.execute({
          provider: 'google',
          code: '',
        })
      ).rejects.toThrow();
    });

    it('should handle invalid provider', async () => {
      (OAuthService.exchangeCodeForToken as jest.Mock).mockRejectedValue(
        new Error('Invalid provider')
      );

      await expect(
        oauthAuthentication.execute({
          provider: 'invalid' as any,
          code: 'code',
        })
      ).rejects.toThrow();
    });
  });
});
