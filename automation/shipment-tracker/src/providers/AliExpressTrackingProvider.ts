import { BaseTrackingProvider } from './BaseTrackingProvider';
import { ProviderTrackingResponse, DeliveryEstimate, TrackingInfo, TrackingEvent } from '../types/tracking';

export class AliExpressTrackingProvider extends BaseTrackingProvider {
  constructor(apiKey?: string) {
    super('AliExpress', 'https://api.aliexpress.com/tracking', apiKey, 3000);
  }

  async getTrackingInfo(trackingNumber: string): Promise<ProviderTrackingResponse> {
    try {
      if (!this.isTrackingNumberValid(trackingNumber)) {
        return {
          success: false,
          error: 'Invalid AliExpress tracking number format'
        };
      }

      // AliExpress tracking API call (simulated structure)
      const response = await this.makeRequest<any>(`/v1/logistics/tracking/${trackingNumber}`);
      
      const trackingInfo: TrackingInfo = {
        trackingNumber,
        provider: this.name,
        status: this.mapStatusToStandard(response.status),
        events: this.parseTrackingEvents(response.tracking_events || []),
        lastUpdated: new Date(),
        ...(response.estimated_delivery_date && { estimatedDeliveryDate: new Date(response.estimated_delivery_date) }),
        ...(response.delivery_date && { actualDeliveryDate: new Date(response.delivery_date) }),
        ...(response.origin_info && {
          origin: {
            city: response.origin_info.city,
            country: response.origin_info.country
          }
        }),
        ...(response.destination_info && {
          destination: {
            city: response.destination_info.city,
            country: response.destination_info.country
          }
        })
      };

      return {
        success: true,
        trackingInfo
      };
    } catch (error: any) {
      console.error(`AliExpress tracking error for ${trackingNumber}:`, error.message);
      
      if (error.message.includes('Rate limit')) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          rateLimited: true
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to fetch AliExpress tracking information'
      };
    }
  }

  isTrackingNumberValid(trackingNumber: string): boolean {
    // AliExpress tracking numbers can be various formats depending on carrier
    // Common patterns: LP123456789CN, RB123456789SG, etc.
    const aliExpressPatterns = [
      /^[A-Z]{2}\d{9}[A-Z]{2}$/, // Standard format like LP123456789CN
      /^[A-Z0-9]{10,20}$/, // General alphanumeric
      /^\d{10,15}$/ // Numeric only
    ];
    
    return aliExpressPatterns.some(pattern => pattern.test(trackingNumber.toUpperCase()));
  }

  async getEstimatedDelivery(trackingNumber: string, origin?: string, destination?: string): Promise<DeliveryEstimate> {
    try {
      const trackingInfo = await this.getTrackingInfo(trackingNumber);
      
      if (trackingInfo.success && trackingInfo.trackingInfo?.estimatedDeliveryDate) {
        const businessDays = this.calculateBusinessDays(new Date(), trackingInfo.trackingInfo.estimatedDeliveryDate);
        
        return {
          estimatedDate: trackingInfo.trackingInfo.estimatedDeliveryDate,
          confidence: 'medium',
          businessDays,
          factors: ['AliExpress estimate', 'International shipping']
        };
      }

      // Fallback estimation based on AliExpress typical delivery times
      // International shipping usually takes 15-30 business days
      const estimatedDate = this.addBusinessDays(new Date(), 20);
      
      return {
        estimatedDate,
        confidence: 'medium',
        businessDays: 20,
        factors: ['AliExpress standard delivery', 'International shipping', 'Historical data']
      };
    } catch (error) {
      // Conservative estimate for international shipping
      const estimatedDate = this.addBusinessDays(new Date(), 30);
      
      return {
        estimatedDate,
        confidence: 'low',
        businessDays: 30,
        factors: ['Conservative international estimate', 'Provider unavailable']
      };
    }
  }

  private parseTrackingEvents(events: any[]): TrackingEvent[] {
    return events.map(event => ({
      timestamp: new Date(event.event_time || event.timestamp),
      status: this.mapStatusToStandard(event.status || event.event_type),
      location: event.location || event.event_location,
      description: event.description || event.event_description || 'Package update',
      providerEventCode: event.event_code
    })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}