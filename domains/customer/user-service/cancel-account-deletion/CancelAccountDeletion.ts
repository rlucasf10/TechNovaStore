/**
 * Caso de uso: Cancelar eliminación de cuenta (GDPR)
 * Extraído de GdprController.cancelAccountDeletion() y GdprService.cancelAccountDeletion()
 */

import { GdprService } from '../shared/services/GdprService';
import { logger } from '../shared/utils/logger';

export class CancelAccountDeletion {
  async execute(userId: number): Promise<boolean> {
    const cancelled = await GdprService.cancelAccountDeletion(userId);
    
    if (!cancelled) {
      return false;
    }

    logger.info(`Account deletion cancelled by user: ${userId}`, { userId });

    return true;
  }
}
