/**
 * Tests MUY COMPLETOS para el caso de uso: Confirmar reset de contraseña
 * Basados en la lógica original de AuthService.resetPassword()
 */

import { ConfirmPasswordReset } from './ConfirmPasswordReset';
import { User } from '../shared/models/User';
import { PasswordReset } from '../shared/models/PasswordReset';
import { RefreshToken } from '../shared/models/RefreshToken';

jest.mock('../shared/models/User');
jest.mock('../shared/models/PasswordReset');
jest.mock('../shared/models/RefreshToken');
jest.mock('../shared/utils/logger');

describe('ConfirmPasswordReset', () => {
  let confirmPasswordReset: ConfirmPasswordReset;
  let mockUser: any;
  let mockResetToken: any;

  beforeEach(() => {
    jest.clearAllMocks();
    confirmPasswordReset = new ConfirmPasswordReset();

    mockUser = {
      id: 1,
      email: 'test@example.com',
      is_active: true,
      update: jest.fn(),
    };

    mockResetToken = {
      id: 1,
      user_id: 1,
      token: 'valid_reset_token',
      markAsUsed: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should reset password with valid token', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('new_hashed_password');
      (RefreshToken.revokeAllUserTokens as jest.Mock).mockResolvedValue(5);

      const result = await confirmPasswordReset.execute('valid_token', 'NewPassword123!');

      expect(PasswordReset.validateToken).toHaveBeenCalledWith('valid_token');
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(User.hashPassword).toHaveBeenCalledWith('NewPassword123!');
      expect(mockUser.update).toHaveBeenCalledWith({ password_hash: 'new_hashed_password' });
      expect(mockResetToken.markAsUsed).toHaveBeenCalled();
      expect(RefreshToken.revokeAllUserTokens).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should hash new password before storing', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('$2b$10$hashed');
      (RefreshToken.revokeAllUserTokens as jest.Mock).mockResolvedValue(0);

      await confirmPasswordReset.execute('token', 'PlainPassword123!');

      expect(User.hashPassword).toHaveBeenCalledWith('PlainPassword123!');
      expect(mockUser.update).toHaveBeenCalledWith({ password_hash: '$2b$10$hashed' });
    });

    it('should mark reset token as used', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (RefreshToken.revokeAllUserTokens as jest.Mock).mockResolvedValue(0);

      await confirmPasswordReset.execute('token', 'NewPass123!');

      expect(mockResetToken.markAsUsed).toHaveBeenCalled();
    });

    it('should revoke all user refresh tokens for security', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (RefreshToken.revokeAllUserTokens as jest.Mock).mockResolvedValue(3);

      await confirmPasswordReset.execute('token', 'NewPass123!');

      expect(RefreshToken.revokeAllUserTokens).toHaveBeenCalledWith(1);
    });

    it('should handle password with special characters', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (RefreshToken.revokeAllUserTokens as jest.Mock).mockResolvedValue(0);

      await confirmPasswordReset.execute('token', 'P@ssw0rd!#$%');

      expect(User.hashPassword).toHaveBeenCalledWith('P@ssw0rd!#$%');
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'A'.repeat(100) + '123!';
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed_long');
      (RefreshToken.revokeAllUserTokens as jest.Mock).mockResolvedValue(0);

      await confirmPasswordReset.execute('token', longPassword);

      expect(User.hashPassword).toHaveBeenCalledWith(longPassword);
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if reset token is invalid', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(null);

      await expect(confirmPasswordReset.execute('invalid_token', 'NewPass123!')).rejects.toThrow(
        'Invalid or expired reset token'
      );

      expect(User.findByPk).not.toHaveBeenCalled();
      expect(User.hashPassword).not.toHaveBeenCalled();
    });

    it('should throw error if reset token is expired', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(null);

      await expect(confirmPasswordReset.execute('expired_token', 'NewPass123!')).rejects.toThrow(
        'Invalid or expired reset token'
      );
    });

    it('should throw error if user not found', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(confirmPasswordReset.execute('token', 'NewPass123!')).rejects.toThrow(
        'Invalid reset token'
      );

      expect(mockUser.update).not.toHaveBeenCalled();
    });

    it('should throw error if user is inactive', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue({ ...mockUser, is_active: false });

      await expect(confirmPasswordReset.execute('token', 'NewPass123!')).rejects.toThrow(
        'Invalid reset token'
      );
    });

    it('should throw error if password hashing fails', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(confirmPasswordReset.execute('token', 'NewPass123!')).rejects.toThrow('Hashing failed');

      expect(mockUser.update).not.toHaveBeenCalled();
    });

    it('should throw error if user update fails', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      mockUser.update.mockRejectedValue(new Error('Update failed'));

      await expect(confirmPasswordReset.execute('token', 'NewPass123!')).rejects.toThrow('Update failed');
    });

    it('should throw error if marking token as used fails', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      mockResetToken.markAsUsed.mockRejectedValue(new Error('Mark failed'));

      await expect(confirmPasswordReset.execute('token', 'NewPass123!')).rejects.toThrow('Mark failed');
    });

    it('should throw error if revoking tokens fails', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (RefreshToken.revokeAllUserTokens as jest.Mock).mockRejectedValue(new Error('Revoke failed'));

      await expect(confirmPasswordReset.execute('token', 'NewPass123!')).rejects.toThrow('Revoke failed');
    });
  });

  describe('Seguridad', () => {
    it('should not allow reusing same reset token', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (RefreshToken.revokeAllUserTokens as jest.Mock).mockResolvedValue(0);

      await confirmPasswordReset.execute('token', 'NewPass123!');

      expect(mockResetToken.markAsUsed).toHaveBeenCalled();
    });

    it('should revoke all sessions after password reset', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (RefreshToken.revokeAllUserTokens as jest.Mock).mockResolvedValue(5);

      await confirmPasswordReset.execute('token', 'NewPass123!');

      expect(RefreshToken.revokeAllUserTokens).toHaveBeenCalledWith(1);
    });

    it('should not reveal if token belongs to inactive user', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue({ ...mockUser, is_active: false });

      await expect(confirmPasswordReset.execute('token', 'NewPass123!')).rejects.toThrow(
        'Invalid reset token'
      );
    });
  });

  describe('Validación de entrada', () => {
    it('should handle empty token', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(null);

      await expect(confirmPasswordReset.execute('', 'NewPass123!')).rejects.toThrow();
    });

    it('should handle empty password', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (RefreshToken.revokeAllUserTokens as jest.Mock).mockResolvedValue(0);

      await confirmPasswordReset.execute('token', '');

      expect(User.hashPassword).toHaveBeenCalledWith('');
    });

    it('should handle unicode characters in password', async () => {
      (PasswordReset.validateToken as jest.Mock).mockResolvedValue(mockResetToken);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (RefreshToken.revokeAllUserTokens as jest.Mock).mockResolvedValue(0);

      await confirmPasswordReset.execute('token', 'Contraseña123!');

      expect(User.hashPassword).toHaveBeenCalledWith('Contraseña123!');
    });
  });
});
