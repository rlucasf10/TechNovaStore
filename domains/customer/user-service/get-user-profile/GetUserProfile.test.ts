/**
 * Tests MUY COMPLETOS para el caso de uso: Obtener perfil de usuario
 */

import { GetUserProfile } from './GetUserProfile';
import { User } from '../shared/models/User';

jest.mock('../shared/models/User');

describe('GetUserProfile', () => {
  let getUserProfile: GetUserProfile;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    getUserProfile = new GetUserProfile();

    mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'customer',
      toJSON: jest.fn().mockReturnValue({
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'customer',
      }),
    };
  });

  describe('Casos exitosos', () => {
    it('should return user profile for valid user id', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserProfile.execute(1);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.toJSON).toHaveBeenCalled();
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'customer',
      });
    });

    it('should not include password in returned data', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue({
        ...mockUser,
        password_hash: 'hashed_password',
      });

      const result = await getUserProfile.execute(1);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should return null if user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await getUserProfile.execute(999);

      expect(result).toBeNull();
    });
  });

  describe('Manejo de errores', () => {
    it('should handle database errors', async () => {
      (User.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getUserProfile.execute(1)).rejects.toThrow('Database error');
    });

    it('should handle invalid user id', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await getUserProfile.execute(-1);

      expect(result).toBeNull();
    });
  });
});
