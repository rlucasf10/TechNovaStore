/**
 * Tests MUY COMPLETOS para el caso de uso: Actualizar perfil de usuario
 */

import { UpdateUserProfile } from './UpdateUserProfile';
import { User } from '../shared/models/User';

jest.mock('../shared/models/User');
jest.mock('../shared/utils/logger');

describe('UpdateUserProfile', () => {
  let updateUserProfile: UpdateUserProfile;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    updateUserProfile = new UpdateUserProfile();

    mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      update: jest.fn(),
      toJSON: jest.fn().mockReturnValue({
        id: 1,
        email: 'updated@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
      }),
    };
  });

  describe('Casos exitosos', () => {
    it('should update user profile', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const updateData = {
        first_name: 'Jane',
        last_name: 'Smith',
      };

      const result = await updateUserProfile.execute(1, updateData);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.update).toHaveBeenCalledWith(updateData);
      expect(result).toBeDefined();
    });

    it('should hash password if included in update', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockResolvedValue('new_hashed_password');

      const updateData = {
        first_name: 'Jane',
        password: 'NewPassword123!',
      };

      await updateUserProfile.execute(1, updateData);

      expect(User.hashPassword).toHaveBeenCalledWith('NewPassword123!');
      expect(mockUser.update).toHaveBeenCalledWith({
        first_name: 'Jane',
        password_hash: 'new_hashed_password',
      });
    });

    it('should return null if user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await updateUserProfile.execute(999, { first_name: 'Test' });

      expect(result).toBeNull();
    });

    it('should update multiple fields', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const updateData = {
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+1234567890',
      };

      await updateUserProfile.execute(1, updateData);

      expect(mockUser.update).toHaveBeenCalledWith(updateData);
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if update fails', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      mockUser.update.mockRejectedValue(new Error('Update failed'));

      await expect(updateUserProfile.execute(1, { first_name: 'Test' })).rejects.toThrow('Update failed');
    });

    it('should throw error if password hashing fails', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.hashPassword as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(updateUserProfile.execute(1, { password: 'NewPass' })).rejects.toThrow('Hashing failed');
    });
  });
});
