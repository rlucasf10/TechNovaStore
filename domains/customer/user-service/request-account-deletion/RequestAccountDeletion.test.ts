/**
 * Tests MUY COMPLETOS para el caso de uso: Solicitar eliminación de cuenta (GDPR)
 */

import { RequestAccountDeletion } from './RequestAccountDeletion';
import { GdprService } from '../shared/services/GdprService';

jest.mock('../shared/services/GdprService');
jest.mock('../shared/utils/logger');

describe('RequestAccountDeletion', () => {
  let requestAccountDeletion: RequestAccountDeletion;

  beforeEach(() => {
    jest.clearAllMocks();
    requestAccountDeletion = new RequestAccountDeletion();
  });

  describe('Casos exitosos', () => {
    it('should request account deletion', async () => {
      const mockRequest = {
        id: 1,
        user_id: 1,
        reason: 'User request',
        status: 'pending',
        scheduled_deletion_date: new Date(),
      };

      (GdprService.requestAccountDeletion as jest.Mock).mockResolvedValue(mockRequest);

      const result = await requestAccountDeletion.execute(1, 'User request');

      expect(GdprService.requestAccountDeletion).toHaveBeenCalledWith(1, 'User request');
      expect(result).toEqual(mockRequest);
    });

    it('should handle deletion request without reason', async () => {
      const mockRequest = {
        id: 1,
        user_id: 1,
        status: 'pending',
        scheduled_deletion_date: new Date(),
      };

      (GdprService.requestAccountDeletion as jest.Mock).mockResolvedValue(mockRequest);

      const result = await requestAccountDeletion.execute(1);

      expect(GdprService.requestAccountDeletion).toHaveBeenCalledWith(1, undefined);
      expect(result).toBeDefined();
    });

    it('should return null if user not found', async () => {
      (GdprService.requestAccountDeletion as jest.Mock).mockResolvedValue(null);

      const result = await requestAccountDeletion.execute(999);

      expect(result).toBeNull();
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if request fails', async () => {
      (GdprService.requestAccountDeletion as jest.Mock).mockRejectedValue(new Error('Request failed'));

      await expect(requestAccountDeletion.execute(1)).rejects.toThrow('Request failed');
    });
  });
});
