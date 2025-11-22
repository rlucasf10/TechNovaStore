/**
 * Caso de Uso: Cancelar Compra
 * 
 * Intenta cancelar una compra con el proveedor:
 * - Verifica si la cancelación es posible
 * - Envía solicitud de cancelación al proveedor
 * - Retorna resultado de la cancelación
 */

import { logger } from '../shared/utils/logger';

export interface CancelPurchaseResult {
  success: boolean;
  message: string;
}

export class CancelPurchase {
  /**
   * Intenta cancelar una compra con el proveedor
   */
  async execute(providerName: string, providerOrderId: string): Promise<CancelPurchaseResult> {
    logger.info('Attempting to cancel purchase', {
      provider: providerName,
      providerOrderId
    });

    // Mock implementation - en producción consultaría la API real del proveedor
    const canCancel = Math.random() > 0.3; // 70% de probabilidad de cancelación exitosa
    
    const result: CancelPurchaseResult = {
      success: canCancel,
      message: canCancel 
        ? 'Purchase cancelled successfully' 
        : 'Cannot cancel - order already processed'
    };

    if (result.success) {
      logger.info('Purchase cancelled successfully', {
        provider: providerName,
        providerOrderId
      });
    } else {
      logger.warn('Purchase cancellation failed', {
        provider: providerName,
        providerOrderId,
        reason: result.message
      });
    }

    return result;
  }
}
