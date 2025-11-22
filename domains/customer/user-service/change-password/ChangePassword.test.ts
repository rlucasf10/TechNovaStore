/**
 * Tests MUY COMPLETOS para el caso de uso: Cambiar contraseña
 */

import { ChangePassword } from './ChangePassword';
import { User } from '../shared/models/User';

jest.mock('../shared/models/User');
jest.mock('../shared/utils/logger');

describe('ChangePassword', () => {
  let changePassword: ChangePassword;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    changePassword = new ChangePassword();

    mockUser = {
      id: 1,
      email: 'test@example.com',
      validatePassword: jest.fn(),
      update: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should change password with valid current password', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      (User.hashPassword as jest.Mock).mockResolvedValue('new_hashed_password');

      const result = await changePassword.execute(1, 'CurrentPass123!', 'NewPass123!');

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.validatePassword).toHaveBeenCalledWith('CurrentPass123!');
      expect(User.hashPassword).toHaveBeenCalledWith('NewPass123!');
      expect(mockUser.update).toHaveBeenCalledWith({ password_hash: 'new_hashed_password' });
      expect(result).toBe(true);
    });

    it('should hash new password before storing', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      (User.hashPassword as jest.Mock).mockResolvedValue('$2b$10$hashed');

      await changePassword.execute(1, 'OldPass', 'NewPass123!');

      expect(User.hashPassword).toHaveBeenCalledWith('NewPass123!');
      expect(mockUser.update).toHaveBeenCalledWith({ password_hash: '$2b$10$hashed' });
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(changePassword.execute(999, 'Current', 'New')).rejects.toThrow('User not found');
    });

    it('should throw error if current password is incorrect', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(false);

      await expect(changePassword.execute(1, 'WrongPass', 'NewPass123!')).rejects.toThrow(
        'Current password is incorrect'
      );

      expect(mockUser.update).not.toHaveBeenCalled();
    });

    it('should throw error if password hashing fails', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      (User.hashPassword as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(changePassword.execute(1, 'Current', 'New')).rejects.toThrow('Hashing failed');
    });

    it('should throw error if update fails', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');
      mockUser.update.mockRejectedValue(new Error('Update failed'));

      await expect(changePassword.execute(1, 'Current', 'New')).rejects.toThrow('Update failed');
    });
  });

  describe('Validación', () => {
    it('should handle same current and new password', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');

      await changePassword.execute(1, 'SamePass123!', 'SamePass123!');

      expect(mockUser.update).toHaveBeenCalled();
    });

    it('should handle special characters in passwords', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      (User.hashPassword as jest.Mock).mockResolvedValue('hashed');

      await changePassword.execute(1, 'Old!@#$%', 'New!@#$%^&*()');

      expect(User.hashPassword).toHaveBeenCalledWith('New!@#$%^&*()');
    });
  });
});
