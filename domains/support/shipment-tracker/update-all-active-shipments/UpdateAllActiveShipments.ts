/**
 * Caso de uso: Actualizar todos los envíos activos
 * Extraído del método updateAllActiveShipments() de ShipmentTracker
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { Order } from '../shared/models/Order';
import { UpdateTrackingInfo } from '../update-tracking-info/UpdateTrackingInfo';
import { logger } from '../shared/utils/logger';

export class UpdateAllActiveShipments {
  constructor(private updateTrackingInfo: UpdateTrackingInfo) {}

  async execute(): Promise<void> {
    try {
      logger.info('Starting bulk tracking update for active shipments', { component: 'bulk-update' });

      // Get all orders that are shipped but not delivered (LÓGICA ORIGINAL)
      const activeOrders = await Order.findAll({
        where: {
          status: ['confirmed', 'processing', 'shipped']
        }
      });

      logger.info('Found active shipments to update', { 
        count: activeOrders.length,
        component: 'bulk-update'
      });

      const updatePromises = activeOrders.map(async (order: Order) => {
        try {
          await this.updateTrackingInfo.execute(order.orderNumber);
        } catch (error) {
          logger.error('Failed to update tracking for order', { 
            orderNumber: order.orderNumber,
            error: error instanceof Error ? error.message : String(error),
            component: 'bulk-update'
          });
        }
      });

      // Process updates in batches to avoid overwhelming APIs (LÓGICA ORIGINAL)
      const batchSize = 10;
      for (let i = 0; i < updatePromises.length; i += batchSize) {
        const batch = updatePromises.slice(i, i + batchSize);
        await Promise.all(batch);
        
        // Add delay between batches to respect rate limits (LÓGICA ORIGINAL)
        if (i + batchSize < updatePromises.length) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      logger.info('Bulk tracking update completed', { component: 'bulk-update' });
    } catch (error) {
      logger.error('Error in bulk tracking update', { 
        error: error instanceof Error ? error.message : String(error),
        component: 'bulk-update'
      });
      throw error;
    }
  }
}
