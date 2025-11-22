/**
 * Tests MUY COMPLETOS para el caso de uso: Cancelar eliminación de cuenta (GDPR)
 */

import { CancelAccountDeletion } from './CancelAccountDeletion';
import { GdprService } from '../shared/services/GdprService';

jest.mock('../shared/services/GdprService');
jest.mock('../shared/utils/logger');

describe('CancelAccountDeletion', () => {
  let cancelAccountDeletion: CancelAccountDeletion;

  beforeEach(() => {
    jest.clearAllMocks();
    cancelAccountDeletion = new CancelAccountDeletion();
  });

  describe('Casos exitosos', () => {
    it('should cancel account deletion', async () => {
      (GdprService.cancelAccountDeletion as jest.Mock).mockResolvedValue(true);

      const result = await cancelAccountDeletion.execute(1);

      expect(GdprService.cancelAccountDeletion).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should return false if no active deletion request', async () => {
      (GdprService.cancelAccountDeletion as jest.Mock).mockResolvedValue(false);

      const result = await cancelAccountDeletion.execute(1);

      expect(result).toBe(false);
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if cancellation fails', async () => {
      (GdprService.cancelAccountDeletion as jest.Mock).mockRejectedValue(new Error('Cancel failed'));

      await expect(cancelAccountDeletion.execute(1)).rejects.toThrow('Cancel failed');
    });
  });
});
