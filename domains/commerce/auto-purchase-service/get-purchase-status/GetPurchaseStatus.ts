/**
 * Caso de Uso: Obtener Estado de Compra
 * 
 * Obtiene el estado actual de una compra desde el proveedor:
 * - Estado de la orden (confirmed, processing, shipped, delivered)
 * - Número de tracking (si está disponible)
 * - Fecha estimada de entrega
 */

import { logger } from '../shared/utils/logger';

export interface PurchaseStatusResult {
  status: string;
  tracking_number?: string;
  estimated_delivery?: Date;
}

export class GetPurchaseStatus {
  /**
   * Obtiene el estado de compra desde el proveedor
   */
  async execute(providerName: string, providerOrderId: string): Promise<PurchaseStatusResult> {
    logger.info('Getting purchase status', {
      provider: providerName,
      providerOrderId
    });

    // Mock implementation - en producción consultaría la API real del proveedor
    const statuses = ['confirmed', 'processing', 'shipped', 'delivered'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    const result: PurchaseStatusResult = {
      status: randomStatus,
      tracking_number: randomStatus === 'shipped' || randomStatus === 'delivered' 
        ? `TRK${Date.now()}` 
        : undefined,
      estimated_delivery: randomStatus !== 'delivered' 
        ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000) 
        : undefined
    };

    logger.info('Purchase status retrieved', {
      provider: providerName,
      providerOrderId,
      status: result.status
    });

    return result;
  }
}
