/**
 * Tests MUY COMPLETOS para el caso de uso: Desactivar cuenta
 */

import { DeactivateAccount } from './DeactivateAccount';
import { User } from '../shared/models/User';

jest.mock('../shared/models/User');
jest.mock('../shared/utils/logger');

describe('DeactivateAccount', () => {
  let deactivateAccount: DeactivateAccount;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    deactivateAccount = new DeactivateAccount();

    mockUser = {
      id: 1,
      email: 'test@example.com',
      is_active: true,
      save: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should deactivate user account', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await deactivateAccount.execute(1);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.is_active).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await deactivateAccount.execute(999);

      expect(result).toBe(false);
    });

    it('should deactivate already inactive user', async () => {
      mockUser.is_active = false;
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await deactivateAccount.execute(1);

      expect(mockUser.is_active).toBe(false);
      expect(result).toBe(true);
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if save fails', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      mockUser.save.mockRejectedValue(new Error('Save failed'));

      await expect(deactivateAccount.execute(1)).rejects.toThrow('Save failed');
    });

    it('should throw error if database query fails', async () => {
      (User.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(deactivateAccount.execute(1)).rejects.toThrow('Database error');
    });
  });
});
