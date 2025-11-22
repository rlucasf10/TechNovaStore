/**
 * Utilidad para mapear estados de tracking a estados de pedido
 * Extraído del método privado mapTrackingStatusToOrderStatus() de ShipmentTracker
 */

import { ShipmentStatus } from '../types/tracking';

export class StatusMapper {
  static mapTrackingStatusToOrderStatus(
    trackingStatus: ShipmentStatus
  ): 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' {
    const statusMap: { 
      [key in ShipmentStatus]: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' 
    } = {
      'label_created': 'confirmed',
      'picked_up': 'processing',
      'in_transit': 'shipped',
      'out_for_delivery': 'shipped',
      'delivered': 'delivered',
      'exception': 'processing',
      'returned': 'cancelled',
      'cancelled': 'cancelled'
    };

    return statusMap[trackingStatus] || 'processing';
  }
}
