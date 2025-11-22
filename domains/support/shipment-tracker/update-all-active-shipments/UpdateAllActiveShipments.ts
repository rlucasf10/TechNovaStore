/**
 * Caso de uso: Actualizar todos los envíos activos
 * Extraído del método updateAllActiveShipments() de ShipmentTracker
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { Order } from '../shared/models/Order';
import { UpdateTrackingInfo } from '../update-tracking-info/UpdateTrackingInfo';

export class UpdateAllActiveShipments {
  constructor(private updateTrackingInfo: UpdateTrackingInfo) {}

  async execute(): Promise<void> {
    try {
      console.log('Starting bulk tracking update for active shipments...');

      // Get all orders that are shipped but not delivered (LÓGICA ORIGINAL)
      const activeOrders = await Order.findAll({
        where: {
          status: ['confirmed', 'processing', 'shipped']
        }
      });

      console.log(`Found ${activeOrders.length} active shipments to update`);

      const updatePromises = activeOrders.map(async (order: Order) => {
        try {
          await this.updateTrackingInfo.execute(order.orderNumber);
        } catch (error) {
          console.error(`Failed to update tracking for order ${order.orderNumber}:`, error);
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

      console.log('Bulk tracking update completed');
    } catch (error) {
      console.error('Error in bulk tracking update:', error);
      throw error;
    }
  }
}
