/**
 * Tests MUY COMPLETOS para el caso de uso: Gestionar consentimientos GDPR
 */

import { ManageConsent } from './ManageConsent';
import { GdprService } from '../shared/services/GdprService';

jest.mock('../shared/services/GdprService');
jest.mock('../shared/utils/logger');

describe('ManageConsent', () => {
  let manageConsent: ManageConsent;

  beforeEach(() => {
    jest.clearAllMocks();
    manageConsent = new ManageConsent();
  });

  describe('getConsentStatus', () => {
    it('should get consent status for user', async () => {
      const mockStatus = {
        has_consent: true,
        consent_data: {
          necessary_cookies: true,
          analytics_cookies: false,
        },
        last_updated: new Date(),
      };

      (GdprService.getConsentStatus as jest.Mock).mockResolvedValue(mockStatus);

      const result = await manageConsent.getConsentStatus(1);

      expect(GdprService.getConsentStatus).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStatus);
    });

    it('should handle user without consent', async () => {
      const mockStatus = {
        has_consent: false,
        consent_data: null,
        last_updated: null,
      };

      (GdprService.getConsentStatus as jest.Mock).mockResolvedValue(mockStatus);

      const result = await manageConsent.getConsentStatus(1);

      expect(result.has_consent).toBe(false);
    });
  });

  describe('updateConsent', () => {
    it('should update consent preferences', async () => {
      const consentData = {
        necessary_cookies: true,
        analytics_cookies: true,
        marketing_cookies: false,
        data_processing: true,
        email_marketing: false,
        third_party_sharing: false,
      };

      const mockConsent = {
        id: 1,
        user_id: 1,
        consent_data: consentData,
        created_at: new Date(),
      };

      (GdprService.updateConsent as jest.Mock).mockResolvedValue(mockConsent);

      const result = await manageConsent.updateConsent(1, consentData);

      expect(GdprService.updateConsent).toHaveBeenCalledWith(1, consentData, undefined, undefined);
      expect(result).toEqual(mockConsent);
    });

    it('should update consent with IP and user agent', async () => {
      const consentData = {
        necessary_cookies: true,
        analytics_cookies: true,
        marketing_cookies: false,
        data_processing: true,
        email_marketing: false,
        third_party_sharing: false,
      };

      const mockConsent = { id: 1, user_id: 1, consent_data: consentData };

      (GdprService.updateConsent as jest.Mock).mockResolvedValue(mockConsent);

      await manageConsent.updateConsent(1, consentData, '192.168.1.1', 'Mozilla/5.0');

      expect(GdprService.updateConsent).toHaveBeenCalledWith(
        1,
        consentData,
        '192.168.1.1',
        'Mozilla/5.0'
      );
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if getConsentStatus fails', async () => {
      (GdprService.getConsentStatus as jest.Mock).mockRejectedValue(new Error('Get failed'));

      await expect(manageConsent.getConsentStatus(1)).rejects.toThrow('Get failed');
    });

    it('should throw error if updateConsent fails', async () => {
      const consentData = {
        necessary_cookies: true,
        analytics_cookies: true,
        marketing_cookies: false,
        data_processing: true,
        email_marketing: false,
        third_party_sharing: false,
      };

      (GdprService.updateConsent as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(manageConsent.updateConsent(1, consentData)).rejects.toThrow('Update failed');
    });
  });
});
