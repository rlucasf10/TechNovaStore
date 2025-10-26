import { BaseTrackingProvider } from './BaseTrackingProvider';
import { ProviderTrackingResponse, DeliveryEstimate, TrackingInfo, TrackingEvent } from '../types/tracking';

export class BanggoodTrackingProvider extends BaseTrackingProvider {
  constructor(apiKey?: string) {
    super('Banggood', 'https://api.banggood.com/tracking', apiKey, 2500);
  }

  async getTrackingInfo(trackingNumber: string): Promise<ProviderTrackingResponse> {
    try {
      if (!this.isTrackingNumberValid(trackingNumber)) {
        return {
          success: false,
          error: 'Invalid Banggood tracking number format'
        };
      }

      // Banggood tracking API call (simulated structure)
      const response = await this.makeRequest<any>(`/v1/shipment/track/${trackingNumber}`);
      
      const trackingInfo: TrackingInfo = {
        trackingNumber,
        provider: this.name,
        status: this.mapStatusToStandard(response.status),
        events: this.parseTrackingEvents(response.track_info || []),
        lastUpdated: new Date(),
        ...(response.estimated_delivery && { estimatedDeliveryDate: new Date(response.estimated_delivery) }),
        ...(response.delivered_time && { actualDeliveryDate: new Date(response.delivered_time) }),
        ...(response.origin && {
          origin: {
            city: response.origin.city,
            country: response.origin.country
          }
        }),
        ...(response.destination && {
          destination: {
            city: response.destination.city,
            country: response.destination.country
          }
        })
      };

      return {
        success: true,
        trackingInfo
      };
    } catch (error: any) {
      console.error(`Banggood tracking error for ${trackingNumber}:`, error.message);
      
      if (error.message.includes('Rate limit')) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          rateLimited: true
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to fetch Banggood tracking information'
      };
    }
  }

  isTrackingNumberValid(trackingNumber: string): boolean {
    // Banggood uses various international shipping carriers
    const banggoodPatterns = [
      /^[A-Z]{2}\d{9}[A-Z]{2}$/, // Standard international format
      /^BG\d{10,15}$/, // Banggood specific format
      /^[A-Z0-9]{10,20}$/, // General alphanumeric
      /^\d{10,15}$/ // Numeric tracking numbers
    ];
    
    return banggoodPatterns.some(pattern => pattern.test(trackingNumber.toUpperCase()));
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
          factors: ['Banggood estimate', 'International shipping']
        };
      }

      // Fallback estimation based on Banggood's typical delivery times
      // International shipping from China usually takes 15-25 business days
      const estimatedDate = this.addBusinessDays(new Date(), 18);
      
      return {
        estimatedDate,
        confidence: 'medium',
        businessDays: 18,
        factors: ['Banggood standard delivery', 'China to destination', 'Historical data']
      };
    } catch (error) {
      // Conservative estimate for international shipping from China
      const estimatedDate = this.addBusinessDays(new Date(), 25);
      
      return {
        estimatedDate,
        confidence: 'low',
        businessDays: 25,
        factors: ['Conservative international estimate', 'Provider unavailable']
      };
    }
  }

  private parseTrackingEvents(events: any[]): TrackingEvent[] {
    return events.map(event => ({
      timestamp: new Date(event.time || event.timestamp),
      status: this.mapStatusToStandard(event.status || event.track_status),
      location: event.location || event.track_location,
      description: event.description || event.track_description || 'Package update',
      providerEventCode: event.code
    })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}