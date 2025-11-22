/**
 * Caso de uso: Obtener información de seguimiento de un pedido
 * Extraído del método getTrackingInfo() de ShipmentTracker
 */

import { Order } from '../shared/models/Order';
import { TrackingProvider, TrackingInfo } from '../shared/types/tracking';

export class GetTrackingInfo {
  constructor(private providers: Map<string, TrackingProvider>) {}

  async execute(orderNumber: string): Promise<TrackingInfo | null> {
    try {
      const order = await Order.findOne({ where: { orderNumber } });
      if (!order) {
        throw new Error(`Order ${orderNumber} not found`);
      }

      if (!order.trackingNumber) {
        return null;
      }

      // Get tracking info from the provider (usando providerName si existe)
      const providerName = order.providerName || 'Amazon'; // Default a Amazon si no hay provider
      const provider = this.providers.get(providerName);
      
      if (!provider) {
        console.log(`Provider ${providerName} not found`);
        return null;
      }

      const result = await provider.getTrackingInfo(order.trackingNumber);
      if (result.success && result.trackingInfo) {
        return result.trackingInfo;
      }

      return null;
    } catch (error) {
      console.error(`Error getting tracking info for order ${orderNumber}:`, error);
      throw error;
    }
  }
}
