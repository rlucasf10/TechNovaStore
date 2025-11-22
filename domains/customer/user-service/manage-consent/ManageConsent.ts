/**
 * Caso de uso: Gestionar consentimientos GDPR
 * Extraído de GdprController y GdprService
 */

import { GdprService, ConsentData } from '../shared/services/GdprService';
import { UserConsent } from '../shared/models/UserConsent';
import { logger } from '../shared/utils/logger';

export class ManageConsent {
  async getConsentStatus(userId: number): Promise<any> {
    return GdprService.getConsentStatus(userId);
  }

  async updateConsent(
    userId: number,
    consentData: ConsentData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserConsent> {
    const updatedConsent = await GdprService.updateConsent(userId, consentData, ipAddress, userAgent);
    
    logger.info(`GDPR consent updated by user: ${userId}`, { userId, consentData });

    return updatedConsent;
  }
}
