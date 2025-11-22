/**
 * Caso de uso: Exportar datos personales (GDPR)
 * Extraído de GdprController.exportPersonalData() y GdprService.exportUserData()
 */

import { GdprService, PersonalDataExport } from '../shared/services/GdprService';
import { logger } from '../shared/utils/logger';

export class ExportPersonalData {
  async execute(userId: number): Promise<PersonalDataExport | null> {
    const personalData = await GdprService.exportUserData(userId);
    
    if (!personalData) {
      return null;
    }

    logger.info(`Personal data export requested by user: ${userId}`, { userId });

    return personalData;
  }
}
