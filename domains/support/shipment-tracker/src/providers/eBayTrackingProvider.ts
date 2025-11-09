import { BaseTrackingProvider } from './BaseTrackingProvider';
import { ProviderTrackingResponse, DeliveryEstimate, TrackingInfo, TrackingEvent } from '../types/tracking';

export class eBayTrackingProvider extends BaseTrackingProvider {
  constructor(apiKey?: string) {
    super('eBay', 'https://api.ebay.com/sell/fulfillment', apiKey, 1500);
  }

  async getTrackingInfo(trackingNumber: string): Promise<ProviderTrackingResponse> {
    try {
      if (!this.isTrackingNumberValid(trackingNumber)) {
        return {
          success: false,
          error: 'Invalid eBay tracking number format'
        };
      }

      // eBay Fulfillment API call (simulated structure)
      const response = await this.makeRequest<any>(`/v1/order/tracking/${trackingNumber}`);
      
      const trackingInfo: TrackingInfo = {
        trackingNumber,
        provider: this.name,
        status: this.mapStatusToStandard(response.shipment_status),
        events: this.parseTrackingEvents(response.shipment_tracking_events || []),
        lastUpdated: new Date(),
        ...(response.estimated_delivery_date && { estimatedDeliveryDate: new Date(response.estimated_delivery_date) }),
        ...(response.actual_delivery_date && { actualDeliveryDate: new Date(response.actual_delivery_date) }),
        ...(response.shipment_origin && {
          origin: {
            city: response.shipment_origin.city,
            state: response.shipment_origin.state_or_province,
            country: response.shipment_origin.country_code
          }
        }),
        ...(response.shipment_destination && {
          destination: {
            city: response.shipment_destination.city,
            state: response.shipment_destination.state_or_province,
            country: response.shipment_destination.country_code
          }
        })
      };

      return {
        success: true,
        trackingInfo
      };
    } catch (error: any) {
      console.error(`eBay tracking error for ${trackingNumber}:`, error.message);
      
      if (error.message.includes('Rate limit')) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          rateLimited: true
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to fetch eBay tracking information'
      };
    }
  }

  isTrackingNumberValid(trackingNumber: string): boolean {
    // eBay uses various carrier tracking numbers, so we accept multiple formats
    const ebayPatterns = [
      /^1Z[A-Z0-9]{16}$/, // UPS
      /^\d{12}$/, // FedEx 12-digit
      /^\d{14}$/, // FedEx 14-digit
      /^9[0-9]{21}$/, // USPS
      /^[A-Z]{2}\d{9}[A-Z]{2}$/, // International
      /^[A-Z0-9]{10,20}$/ // General format
    ];
    
    return ebayPatterns.some(pattern => pattern.test(trackingNumber.toUpperCase()));
  }

  async getEstimatedDelivery(trackingNumber: string, origin?: string, destination?: string): Promise<DeliveryEstimate> {
    try {
      const trackingInfo = await this.getTrackingInfo(trackingNumber);
      
      if (trackingInfo.success && trackingInfo.trackingInfo?.estimatedDeliveryDate) {
        const businessDays = this.calculateBusinessDays(new Date(), trackingInfo.trackingInfo.estimatedDeliveryDate);
        
        return {
          estimatedDate: trackingInfo.trackingInfo.estimatedDeliveryDate,
          confidence: 'high',
          businessDays,
          factors: ['eBay seller estimate', 'Carrier tracking']
        };
      }

      // Fallback estimation based on eBay's typical delivery times
      // Varies greatly by seller and shipping method, default to 7 business days
      const estimatedDate = this.addBusinessDays(new Date(), 7);
      
      return {
        estimatedDate,
        confidence: 'medium',
        businessDays: 7,
        factors: ['eBay standard delivery', 'Seller location', 'Historical data']
      };
    } catch (error) {
      // Conservative estimate
      const estimatedDate = this.addBusinessDays(new Date(), 10);
      
      return {
        estimatedDate,
        confidence: 'low',
        businessDays: 10,
        factors: ['Conservative estimate', 'Provider unavailable']
      };
    }
  }

  private parseTrackingEvents(events: any[]): TrackingEvent[] {
    return events.map(event => {
      const trackingEvent: TrackingEvent = {
        timestamp: new Date(event.event_date),
        status: this.mapStatusToStandard(event.event_type),
        description: event.event_description || 'Package update',
        ...(event.event_location && { location: `${event.event_location.city}, ${event.event_location.state_or_province}` }),
        ...(event.event_code && { providerEventCode: event.event_code })
      };
      return trackingEvent;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}