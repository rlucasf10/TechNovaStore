import { Order } from '../models/Order';
import { 
  TrackingProvider, 
  TrackingInfo, 
  ShipmentUpdate, 
  ShipmentStatus,
  DeliveryEstimate 
} from '../types/tracking';
import {
  AmazonTrackingProvider,
  AliExpressTrackingProvider,
  eBayTrackingProvider,
  BanggoodTrackingProvider,
  NeweggTrackingProvider
} from '../providers';
import { NotificationService } from './NotificationService';

export class ShipmentTracker {
  private providers: Map<string, TrackingProvider>;
  private notificationService: NotificationService;

  constructor() {
    this.providers = new Map();
    this.notificationService = new NotificationService();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize all tracking providers
    this.providers.set('Amazon', new AmazonTrackingProvider(process.env.AMAZON_API_KEY));
    this.providers.set('AliExpress', new AliExpressTrackingProvider(process.env.ALIEXPRESS_API_KEY));
    this.providers.set('eBay', new eBayTrackingProvider(process.env.EBAY_API_KEY));
    this.providers.set('Banggood', new BanggoodTrackingProvider(process.env.BANGGOOD_API_KEY));
    this.providers.set('Newegg', new NeweggTrackingProvider(process.env.NEWEGG_API_KEY));
  }

  async getTrackingInfo(orderNumber: string): Promise<TrackingInfo | null> {
    try {
      const order = await Order.findOne({ where: { orderNumber } });
      if (!order) {
        throw new Error(`Order ${orderNumber} not found`);
      }

      if (!order.trackingNumbers || Object.keys(order.trackingNumbers).length === 0) {
        return null;
      }

      // Get tracking info from the first available provider
      for (const [providerName, trackingNumber] of Object.entries(order.trackingNumbers)) {
        const provider = this.providers.get(providerName);
        if (!provider || typeof trackingNumber !== 'string') continue;

        const result = await provider.getTrackingInfo(trackingNumber);
        if (result.success && result.trackingInfo) {
          return result.trackingInfo;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error getting tracking info for order ${orderNumber}:`, error);
      throw error;
    }
  }

  async updateTrackingInfo(orderNumber: string): Promise<ShipmentUpdate | null> {
    try {
      const order = await Order.findOne({ where: { orderNumber } });
      if (!order) {
        throw new Error(`Order ${orderNumber} not found`);
      }

      if (!order.trackingNumbers || Object.keys(order.trackingNumbers).length === 0) {
        console.log(`No tracking numbers found for order ${orderNumber}`);
        return null;
      }

      let latestUpdate: ShipmentUpdate | null = null;

      // Update tracking info from all providers
      for (const [providerName, trackingNumber] of Object.entries(order.trackingNumbers)) {
        const provider = this.providers.get(providerName);
        if (!provider || typeof trackingNumber !== 'string') continue;

        try {
          const result = await provider.getTrackingInfo(trackingNumber);
          
          if (result.success && result.trackingInfo) {
            const trackingInfo = result.trackingInfo;
            
            // Check if status has changed
            const statusChanged = order.status !== this.mapTrackingStatusToOrderStatus(trackingInfo.status);
            
            // Update order with new tracking information
            if (trackingInfo.estimatedDeliveryDate && !order.estimatedDeliveryDate) {
              order.estimatedDeliveryDate = trackingInfo.estimatedDeliveryDate;
            }

            if (trackingInfo.actualDeliveryDate && !order.actualDeliveryDate) {
              order.actualDeliveryDate = trackingInfo.actualDeliveryDate;
              await order.updateStatus('delivered');
            } else if (statusChanged) {
              await order.updateStatus(this.mapTrackingStatusToOrderStatus(trackingInfo.status));
            }

            await order.save();

            latestUpdate = {
              orderId: order.id,
              trackingNumber: trackingNumber,
              provider: providerName,
              status: trackingInfo.status,
              estimatedDeliveryDate: trackingInfo.estimatedDeliveryDate,
              actualDeliveryDate: trackingInfo.actualDeliveryDate,
              events: trackingInfo.events
            };

            // Send notification if status changed
            if (statusChanged) {
              await this.notificationService.sendShipmentUpdate(order, trackingInfo);
            }

            // Check for delivery delays
            await this.checkForDelays(order, trackingInfo);

          } else if (result.rateLimited) {
            console.warn(`Rate limited for provider ${providerName}, skipping update`);
          }
        } catch (error) {
          console.error(`Error updating tracking for ${providerName}:`, error);
        }
      }

      return latestUpdate;
    } catch (error) {
      console.error(`Error updating tracking info for order ${orderNumber}:`, error);
      throw error;
    }
  }

  async updateAllActiveShipments(): Promise<void> {
    try {
      console.log('Starting bulk tracking update for active shipments...');

      // Get all orders that are shipped but not delivered
      const activeOrders = await Order.findAll({
        where: {
          status: ['confirmed', 'processing', 'shipped']
        }
      });

      console.log(`Found ${activeOrders.length} active shipments to update`);

      const updatePromises = activeOrders.map(async (order: Order) => {
        try {
          await this.updateTrackingInfo(order.orderNumber);
        } catch (error) {
          console.error(`Failed to update tracking for order ${order.orderNumber}:`, error);
        }
      });

      // Process updates in batches to avoid overwhelming APIs
      const batchSize = 10;
      for (let i = 0; i < updatePromises.length; i += batchSize) {
        const batch = updatePromises.slice(i, i + batchSize);
        await Promise.all(batch);
        
        // Add delay between batches to respect rate limits
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

  async getEstimatedDelivery(orderNumber: string): Promise<DeliveryEstimate | null> {
    try {
      const order = await Order.findOne({ where: { orderNumber } });
      if (!order) {
        throw new Error(`Order ${orderNumber} not found`);
      }

      if (!order.trackingNumbers || Object.keys(order.trackingNumbers).length === 0) {
        return null;
      }

      // Get delivery estimate from the first available provider
      for (const [providerName, trackingNumber] of Object.entries(order.trackingNumbers)) {
        const provider = this.providers.get(providerName);
        if (!provider || typeof trackingNumber !== 'string') continue;

        try {
          const estimate = await provider.getEstimatedDelivery(
            trackingNumber,
            order.shippingAddress.city,
            order.shippingAddress.city
          );
          return estimate;
        } catch (error) {
          console.error(`Error getting delivery estimate from ${providerName}:`, error);
        }
      }

      return null;
    } catch (error) {
      console.error(`Error getting delivery estimate for order ${orderNumber}:`, error);
      throw error;
    }
  }

  private async checkForDelays(order: Order, trackingInfo: TrackingInfo): Promise<void> {
    if (!order.estimatedDeliveryDate || !trackingInfo.estimatedDeliveryDate) {
      return;
    }

    const now = new Date();
    const originalEstimate = order.estimatedDeliveryDate;
    const newEstimate = trackingInfo.estimatedDeliveryDate;

    // Check if delivery is delayed beyond original estimate
    if (newEstimate > originalEstimate && now > originalEstimate) {
      console.log(`Delivery delay detected for order ${order.orderNumber}`);
      await this.notificationService.sendDelayNotification(order, originalEstimate, newEstimate);
    }
  }

  private mapTrackingStatusToOrderStatus(trackingStatus: ShipmentStatus): 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' {
    const statusMap: { [key in ShipmentStatus]: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' } = {
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

  async getShipmentStatus(orderNumber: string): Promise<{
    status: ShipmentStatus;
    lastUpdate: Date;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
  } | null> {
    try {
      const trackingInfo = await this.getTrackingInfo(orderNumber);
      if (!trackingInfo) {
        return null;
      }

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