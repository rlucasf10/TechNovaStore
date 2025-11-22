/**
 * Caso de uso: Obtener estado del envío
 * Extraído del método getShipmentStatus() de ShipmentTracker
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { ShipmentStatus } from '../shared/types/tracking';
import { GetTrackingInfo } from '../get-tracking-info/GetTrackingInfo';

export class GetShipmentStatus {
  constructor(private getTrackingInfo: GetTrackingInfo) {}

  async execute(orderNumber: string): Promise<{
    status: ShipmentStatus;
    lastUpdate: Date;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
  } | null> {
    try {
      const trackingInfo = await this.getTrackingInfo.execute(orderNumber);
      if (!trackingInfo) {
        return null;
      }

      // Construir resultado con la misma estructura que el método original
      const result: {
        status: ShipmentStatus;
        lastUpdate: Date;
        estimatedDelivery?: Date;
        actualDelivery?: Date;
      } = {
        status: trackingInfo.status,
        lastUpdate: trackingInfo.lastUpdated
      };

      if (trackingInfo.estimatedDeliveryDate) {
        result.estimatedDelivery = trackingInfo.estimatedDeliveryDate;
      }

      if (trackingInfo.actualDeliveryDate) {
        result.actualDelivery = trackingInfo.actualDeliveryDate;
      }

      return result;
    } catch (error) {
      console.error(`Error getting shipment status for order ${orderNumber}:`, error);
      throw error;
    }
  }
}
