/**
 * Tests MUY COMPLETOS para el caso de uso: Exportar datos personales (GDPR)
 */

import { ExportPersonalData } from './ExportPersonalData';
import { GdprService } from '../shared/services/GdprService';

jest.mock('../shared/services/GdprService');
jest.mock('../shared/utils/logger');

describe('ExportPersonalData', () => {
  let exportPersonalData: ExportPersonalData;

  beforeEach(() => {
    jest.clearAllMocks();
    exportPersonalData = new ExportPersonalData();
  });

  describe('Casos exitosos', () => {
    it('should export personal data for valid user', async () => {
      const mockData = {
        user_profile: { id: 1, email: 'test@example.com' },
        consent_history: [],
        deletion_requests: [],
        export_metadata: {
          exported_at: '2024-01-01T00:00:00.000Z',
          data_retention_policy: 'Policy',
          contact_info: 'privacy@technovastore.com',
        },
      };

      (GdprService.exportUserData as jest.Mock).mockResolvedValue(mockData);

      const result = await exportPersonalData.execute(1);

      expect(GdprService.exportUserData).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockData);
    });

    it('should return null if user not found', async () => {
      (GdprService.exportUserData as jest.Mock).mockResolvedValue(null);

      const result = await exportPersonalData.execute(999);

      expect(result).toBeNull();
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if export fails', async () => {
      (GdprService.exportUserData as jest.Mock).mockRejectedValue(new Error('Export failed'));

      await expect(exportPersonalData.execute(1)).rejects.toThrow('Export failed');
    });
  });
});
