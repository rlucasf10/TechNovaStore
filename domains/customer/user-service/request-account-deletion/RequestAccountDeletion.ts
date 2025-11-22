/**
 * Caso de uso: Solicitar eliminación de cuenta (GDPR)
 * Extraído de GdprController.requestAccountDeletion() y GdprService.requestAccountDeletion()
 */

import { GdprService } from '../shared/services/GdprService';
import { AccountDeletionRequest } from '../shared/models/AccountDeletionRequest';
import { logger } from '../shared/utils/logger';

export class RequestAccountDeletion {
  async execute(userId: number, reason?: string): Promise<AccountDeletionRequest | null> {
    const deletionRequest = await GdprService.requestAccountDeletion(userId, reason);
    
    if (!deletionRequest) {
      return null;
    }

    logger.info(`Account deletion requested by user: ${userId}`, { 
      userId, 
      reason,
      requestId: deletionRequest.id 
    });

    return deletionRequest;
  }
}
