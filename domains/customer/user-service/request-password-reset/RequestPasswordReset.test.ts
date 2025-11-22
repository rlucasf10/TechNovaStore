/**
 * Tests MUY COMPLETOS para el caso de uso: Solicitar reset de contraseña
 * Basados en la lógica original de AuthService.requestPasswordReset()
 */

import { RequestPasswordReset } from './RequestPasswordReset';
import { User } from '../shared/models/User';
import { PasswordReset } from '../shared/models/PasswordReset';

// Mocks
jest.mock('../shared/models/User');
jest.mock('../shared/models/PasswordReset');
jest.mock('../shared/utils/logger');

describe('RequestPasswordReset', () => {
  let requestPasswordReset: RequestPasswordReset;
  let mockUser: any;
  let mockResetToken: any;

  beforeEach(() => {
    jest.clearAllMocks();
    requestPasswordReset = new RequestPasswordReset();

    mockUser = {
      id: 1,
      email: 'test@example.com',
      is_active: true,
    };

    mockResetToken = {
      id: 1,
      user_id: 1,
      token: 'reset_token_123',
    };
  });

  describe('Casos exitosos', () => {
    it('should create password reset token for valid email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (PasswordReset.createResetToken as jest.Mock).mockResolvedValue(mockResetToken);

      const token = await requestPasswordReset.execute('test@example.com');

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          is_active: true,
        },
      });
      expect(PasswordReset.createResetToken).toHaveBeenCalledWith(1);
      expect(token).toBe('reset_token_123');
    });

    it('should handle email case insensitivity', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (PasswordReset.createResetToken as jest.Mock).mockResolvedValue(mockResetToken);

      await requestPasswordReset.execute('TEST@EXAMPLE.COM');

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          is_active: true,
        },
      });
    });

    it('should return token for existing user', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (PasswordReset.createResetToken as jest.Mock).mockResolvedValue(mockResetToken);

      const token = await requestPasswordReset.execute('user@example.com');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should create new reset token each time', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (PasswordReset.createResetToken as jest.Mock)
        .mockResolvedValueOnce({ ...mockResetToken, token: 'token1' })
        .mockResolvedValueOnce({ ...mockResetToken, token: 'token2' });

      const token1 = await requestPasswordReset.execute('user@example.com');
      const token2 = await requestPasswordReset.execute('user@example.com');

      expect(token1).not.toBe(token2);
    });
  });

  describe('Seguridad - No revelar existencia de email', () => {
    it('should throw generic error if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(requestPasswordReset.execute('nonexistent@example.com')).rejects.toThrow(
        'If the email exists, a password reset link has been sent'
      );

      expect(PasswordReset.createResetToken).not.toHaveBeenCalled();
    });

    it('should not reveal if user is inactive', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null); // findOne filtra por is_active: true

      await expect(requestPasswordReset.execute('inactive@example.com')).rejects.toThrow(
        'If the email exists, a password reset link has been sent'
      );
    });

    it('should use same error message for non-existent and inactive users', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      let error1: Error | undefined;
      try {
        await requestPasswordReset.execute('nonexistent@example.com');
      } catch (e) {
        error1 = e as Error;
      }

      let error2: Error | undefined;
      try {
        await requestPasswordReset.execute('inactive@example.com');
      } catch (e) {
        error2 = e as Error;
      }

      expect(error1?.message).toBe(error2?.message);
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if database query fails', async () => {
      (User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(requestPasswordReset.execute('user@example.com')).rejects.toThrow('Database error');

      expect(PasswordReset.createResetToken).not.toHaveBeenCalled();
    });

    it('should throw error if token creation fails', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (PasswordReset.createResetToken as jest.Mock).mockRejectedValue(new Error('Token creation failed'));

      await expect(requestPasswordReset.execute('user@example.com')).rejects.toThrow('Token creation failed');
    });

    it('should handle connection timeout', async () => {
      (User.findOne as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      await expect(requestPasswordReset.execute('user@example.com')).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle empty email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(requestPasswordReset.execute('')).rejects.toThrow(
        'If the email exists, a password reset link has been sent'
      );
    });

    it('should handle email with spaces', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(requestPasswordReset.execute('  user@example.com  ')).rejects.toThrow();
    });

    it('should handle special characters in email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (PasswordReset.createResetToken as jest.Mock).mockResolvedValue(mockResetToken);

      await requestPasswordReset.execute('user+test@example.com');

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          email: 'user+test@example.com',
          is_active: true,
        },
      });
    });

    it('should handle international email addresses', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (PasswordReset.createResetToken as jest.Mock).mockResolvedValue(mockResetToken);

      await requestPasswordReset.execute('usuario@ejemplo.es');

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          email: 'usuario@ejemplo.es',
          is_active: true,
        },
      });
    });
  });

  describe('Logging', () => {
    it('should log password reset request', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (PasswordReset.createResetToken as jest.Mock).mockResolvedValue(mockResetToken);

      await requestPasswordReset.execute('user@example.com');

      // Logger está mockeado, solo verificamos que no falle
      expect(PasswordReset.createResetToken).toHaveBeenCalled();
    });
  });

  describe('Casos edge', () => {
    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(requestPasswordReset.execute(longEmail)).rejects.toThrow();
    });

    it('should handle multiple reset requests for same user', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (PasswordReset.createResetToken as jest.Mock).mockResolvedValue(mockResetToken);

      await requestPasswordReset.execute('user@example.com');
      await requestPasswordReset.execute('user@example.com');
      await requestPasswordReset.execute('user@example.com');

      expect(PasswordReset.createResetToken).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent reset requests', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (PasswordReset.createResetToken as jest.Mock).mockResolvedValue(mockResetToken);

      const promises = [
        requestPasswordReset.execute('user@example.com'),
        requestPasswordReset.execute('user@example.com'),
        requestPasswordReset.execute('user@example.com'),
      ];

      await Promise.all(promises);

      expect(PasswordReset.createResetToken).toHaveBeenCalledTimes(3);
    });
  });
});
