/**
 * Tests MUY COMPLETOS para el caso de uso: Renovar token de acceso
 * Basados en la lógica original de AuthService.refreshToken()
 */

import { RefreshTokenUseCase } from './RefreshToken';
import { User } from '../shared/models/User';
import { RefreshToken } from '../shared/models/RefreshToken';
import { generateTokens } from '../shared/auth/token-generator';

// Mocks
jest.mock('../shared/models/User');
jest.mock('../shared/models/RefreshToken');
jest.mock('../shared/auth/token-generator');

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let mockUser: any;
  let mockRefreshToken: any;

  beforeEach(() => {
    jest.clearAllMocks();
    refreshTokenUseCase = new RefreshTokenUseCase();

    mockUser = {
      id: 1,
      email: 'test@example.com',
      is_active: true,
    };

    mockRefreshToken = {
      id: 1,
      user_id: 1,
      token: 'valid_refresh_token',
      revoke: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should refresh tokens with valid refresh token', async () => {
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });

      const result = await refreshTokenUseCase.execute('valid_refresh_token');

      expect(RefreshToken.validateToken).toHaveBeenCalledWith('valid_refresh_token');
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockRefreshToken.revoke).toHaveBeenCalled();
      expect(generateTokens).toHaveBeenCalledWith(mockUser, undefined, undefined);
      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
    });

    it('should pass device info to token generation', async () => {
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await refreshTokenUseCase.execute('valid_token', 'iPhone 12', '192.168.1.1');

      expect(generateTokens).toHaveBeenCalledWith(mockUser, 'iPhone 12', '192.168.1.1');
    });

    it('should revoke old refresh token before generating new ones', async () => {
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await refreshTokenUseCase.execute('valid_token');

      expect(mockRefreshToken.revoke).toHaveBeenCalled();
      expect(generateTokens).toHaveBeenCalled();
    });

    it('should handle refresh token with device info only', async () => {
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await refreshTokenUseCase.execute('valid_token', 'Android Phone');

      expect(generateTokens).toHaveBeenCalledWith(mockUser, 'Android Phone', undefined);
    });

    it('should handle refresh token with IP address only', async () => {
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await refreshTokenUseCase.execute('valid_token', undefined, '10.0.0.1');

      expect(generateTokens).toHaveBeenCalledWith(mockUser, undefined, '10.0.0.1');
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if refresh token is invalid', async () => {
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(null);

      await expect(refreshTokenUseCase.execute('invalid_token')).rejects.toThrow('Invalid refresh token');

      expect(User.findByPk).not.toHaveBeenCalled();
      expect(generateTokens).not.toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(refreshTokenUseCase.execute('valid_token')).rejects.toThrow('Invalid refresh token');

      expect(generateTokens).not.toHaveBeenCalled();
    });

    it('should throw error if user is inactive', async () => {
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (User.findByPk as jest.Mock).mockResolvedValue({ ...mockUser, is_active: false });

      await expect(refreshTokenUseCase.execute('valid_token')).rejects.toThrow('Invalid refresh token');

      expect(generateTokens).not.toHaveBeenCalled();
    });

    it('should throw error if token validation throws', async () => {
      (RefreshToken.validateToken as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(refreshTokenUseCase.execute('token')).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if token revocation fails', async () => {
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      mockRefreshToken.revoke.mockRejectedValue(new Error('Revoke failed'));

      await expect(refreshTokenUseCase.execute('valid_token')).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if new token generation fails', async () => {
      const mockRefreshTokenLocal = {
        ...mockRefreshToken,
        revoke: jest.fn().mockResolvedValue(undefined),
      };
      
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(mockRefreshTokenLocal);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockRejectedValue(new Error('Generation failed'));

      // El try-catch en el código convierte todos los errores en "Invalid refresh token"
      await expect(refreshTokenUseCase.execute('valid_token')).rejects.toThrow();
      
      // Verificar que se intentó revocar y generar tokens
      expect(mockRefreshTokenLocal.revoke).toHaveBeenCalled();
      expect(generateTokens).toHaveBeenCalled();
    });

    it('should handle expired refresh token', async () => {
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(null);

      await expect(refreshTokenUseCase.execute('expired_token')).rejects.toThrow('Invalid refresh token');
    });

    it('should handle malformed refresh token', async () => {
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(null);

      await expect(refreshTokenUseCase.execute('malformed')).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('Seguridad', () => {
    it('should not reveal specific error details', async () => {
      (RefreshToken.validateToken as jest.Mock).mockRejectedValue(new Error('Token expired'));

      await expect(refreshTokenUseCase.execute('token')).rejects.toThrow('Invalid refresh token');
    });

    it('should use generic error message for all failures', async () => {
      const scenarios = [
        () => (RefreshToken.validateToken as jest.Mock).mockResolvedValue(null),
        () => {
          (RefreshToken.validateToken as jest.Mock).mockResolvedValue(mockRefreshToken);
          (User.findByPk as jest.Mock).mockResolvedValue(null);
        },
        () => {
          (RefreshToken.validateToken as jest.Mock).mockResolvedValue(mockRefreshToken);
          (User.findByPk as jest.Mock).mockResolvedValue({ ...mockUser, is_active: false });
        },
      ];

      for (const setup of scenarios) {
        jest.clearAllMocks();
        setup();
        
        try {
          await refreshTokenUseCase.execute('token');
          fail('Should have thrown error');
        } catch (error: any) {
          expect(error.message).toBe('Invalid refresh token');
        }
      }
    });
  });

  describe('Validación de entrada', () => {
    it('should handle empty refresh token', async () => {
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(null);

      await expect(refreshTokenUseCase.execute('')).rejects.toThrow('Invalid refresh token');
    });

    it('should handle very long device info', async () => {
      const longDeviceInfo = 'A'.repeat(1000);
      
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await refreshTokenUseCase.execute('valid_token', longDeviceInfo);

      expect(generateTokens).toHaveBeenCalledWith(mockUser, longDeviceInfo, undefined);
    });

    it('should handle IPv6 addresses', async () => {
      (RefreshToken.validateToken as jest.Mock).mockResolvedValue(mockRefreshToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (generateTokens as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await refreshTokenUseCase.execute('valid_token', undefined, '2001:0db8:85a3:0000:0000:8a2e:0370:7334');

      expect(generateTokens).toHaveBeenCalledWith(
        mockUser,
        undefined,
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      );
    });
  });
});
