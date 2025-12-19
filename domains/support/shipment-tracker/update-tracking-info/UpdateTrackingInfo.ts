/**
 * Caso de uso: Actualizar información de seguimiento de un pedido
 * Extraído del método updateTrackingInfo() de ShipmentTracker
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { Order } from '../shared/models/Order';
import { TrackingProvider, ShipmentUpdate } from '../shared/types/tracking';
import { NotificationService } from '../shared/clients/NotificationService';
import { StatusMapper } from '../shared/utils/StatusMapper';
import { DelayChecker } from '../shared/utils/DelayChecker';
import { logger } from '../shared/utils/logger';

export class UpdateTrackingInfo {
  constructor(
    private providers: Map<string, TrackingProvider>,
    private notificationService: NotificationService
  ) {}

  async execute(orderNumber: string): Promise<ShipmentUpdate | null> {
    try {
      const order = await Order.findOne({ where: { orderNumber } });
      if (!order) {
        throw new Error(`Order ${orderNumber} not found`);
      }

      if (!order.trackingNumber) {
        logger.debug('No tracking number found for order', { orderNumber });
        return null;
      }

      // Update tracking info from provider (LÓGICA ORIGINAL adaptada)
      const providerName = order.providerName || 'Amazon'; // Default a Amazon si no hay provider
      const provider = this.providers.get(providerName);
      
      if (!provider) {
        logger.warn('Provider not found', { providerName, orderNumber });
        return null;
      }

      try {
        const result = await provider.getTrackingInfo(order.trackingNumber);
        
        if (result.success && result.trackingInfo) {
          const trackingInfo = result.trackingInfo;
          
          // Check if status has changed (LÓGICA ORIGINAL)
          const statusChanged = order.status !== StatusMapper.mapTrackingStatusToOrderStatus(trackingInfo.status);
          
          // Update order with new tracking information (LÓGICA ORIGINAL)
          if (trackingInfo.estimatedDeliveryDate && !order.estimatedDelivery) {
            order.estimatedDelivery = trackingInfo.estimatedDeliveryDate;
          }

          if (trackingInfo.actualDeliveryDate) {
            await order.updateStatus('delivered');
          } else if (statusChanged) {
            await order.updateStatus(StatusMapper.mapTrackingStatusToOrderStatus(trackingInfo.status));
          }

          await order.save();

          const latestUpdate: ShipmentUpdate = {
            orderId: order.id,
            trackingNumber: order.trackingNumber,
            provider: providerName,
            status: trackingInfo.status,
            estimatedDeliveryDate: trackingInfo.estimatedDeliveryDate,
            actualDeliveryDate: trackingInfo.actualDeliveryDate,
            events: trackingInfo.events
          };

          // Send notification if status changed (LÓGICA ORIGINAL)
          if (statusChanged) {
            await this.notificationService.sendShipmentUpdate(order, trackingInfo);
          }

          // Check for delivery delays (LÓGICA ORIGINAL)
          await DelayChecker.checkForDelays(order, trackingInfo, this.notificationService);

          return latestUpdate;
        } else if (result.rateLimited) {
          logger.warn('Rate limited for provider, skipping update', { providerName, orderNumber });
        }
      } catch (error) {
        logger.error('Error updating tracking for provider', { 
          providerName, 
          orderNumber,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      return null;
    } catch (error) {
      logger.error('Error updating tracking info for order', { 
        orderNumber,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
