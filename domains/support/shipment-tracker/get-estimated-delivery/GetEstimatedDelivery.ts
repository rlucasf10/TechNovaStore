/**
 * Caso de uso: Obtener fecha estimada de entrega
 * Extraído del método getEstimatedDelivery() de ShipmentTracker
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { Order } from '../shared/models/Order';
import { TrackingProvider, DeliveryEstimate } from '../shared/types/tracking';

export class GetEstimatedDelivery {
  constructor(private providers: Map<string, TrackingProvider>) {}

  async execute(orderNumber: string): Promise<DeliveryEstimate | null> {
    try {
      const order = await Order.findOne({ where: { orderNumber } });
      if (!order) {
        throw new Error(`Order ${orderNumber} not found`);
      }

      if (!order.trackingNumber) {
        return null;
      }

      // Get delivery estimate from the provider (LÓGICA ORIGINAL adaptada)
      const providerName = order.providerName || 'Amazon'; // Default a Amazon si no hay provider
      const provider = this.providers.get(providerName);
      
      if (!provider) {
        console.log(`Provider ${providerName} not found`);
        return null;
      }

      try {
        const estimate = await provider.getEstimatedDelivery(
          order.trackingNumber,
          order.shippingAddress.city,
          order.shippingAddress.city
        );
        return estimate;
      } catch (error) {
        console.error(`Error getting delivery estimate from ${providerName}:`, error);
        return null;
      }
    } catch (error) {
      console.error(`Error getting delivery estimate for order ${orderNumber}:`, error);
      throw error;
    }
  }
}
