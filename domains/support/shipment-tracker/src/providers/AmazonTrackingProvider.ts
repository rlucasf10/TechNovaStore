import { BaseTrackingProvider } from './BaseTrackingProvider';
import { ProviderTrackingResponse, DeliveryEstimate, TrackingInfo, TrackingEvent } from '../types/tracking';

export class AmazonTrackingProvider extends BaseTrackingProvider {
  constructor(apiKey?: string) {
    super('Amazon', 'https://api.amazon.com/tracking', apiKey, 2000);
  }

  async getTrackingInfo(trackingNumber: string): Promise<ProviderTrackingResponse> {
    try {
      if (!this.isTrackingNumberValid(trackingNumber)) {
        return {
          success: false,
          error: 'Invalid Amazon tracking number format'
        };
      }

      // Amazon tracking API call (simulated structure)
      const response = await this.makeRequest<any>(`/v1/shipments/${trackingNumber}`);
      
      const trackingInfo: TrackingInfo = {
        trackingNumber,
        provider: this.name,
        status: this.mapStatusToStandard(response.status),
        events: this.parseTrackingEvents(response.events || []),
        lastUpdated: new Date(),
        ...(response.estimated_delivery && { estimatedDeliveryDate: new Date(response.estimated_delivery) }),
        ...(response.delivered_at && { actualDeliveryDate: new Date(response.delivered_at) }),
        ...(response.origin && {
          origin: {
            city: response.origin.city,
            state: response.origin.state,
            country: response.origin.country
          }
        }),
        ...(response.destination && {
          destination: {
            city: response.destination.city,
            state: response.destination.state,
            country: response.destination.country
          }
        })
      };

      return {
        success: true,
        trackingInfo
      };
    } catch (error: any) {
      console.error(`Amazon tracking error for ${trackingNumber}:`, error.message);
      
      if (error.message.includes('Rate limit')) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          rateLimited: true
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to fetch Amazon tracking information'
      };
    }
  }

  isTrackingNumberValid(trackingNumber: string): boolean {
    // Amazon tracking numbers are typically 10-15 characters, alphanumeric
    const amazonPattern = /^[A-Z0-9]{10,15}$/;
    return amazonPattern.test(trackingNumber.toUpperCase());
  }

  async getEstimatedDelivery(trackingNumber: string, _origin?: string, _destination?: string): Promise<DeliveryEstimate> {
    try {
      const trackingInfo = await this.getTrackingInfo(trackingNumber);
      
      if (trackingInfo.success && trackingInfo.trackingInfo?.estimatedDeliveryDate) {
        const businessDays = this.calculateBusinessDays(new Date(), trackingInfo.trackingInfo.estimatedDeliveryDate);
        
        return {
          estimatedDate: trackingInfo.trackingInfo.estimatedDeliveryDate,
          confidence: 'high',
          businessDays,
          factors: ['Amazon Prime shipping', 'Provider estimate']
        };
      }

      // Fallback estimation based on Amazon's typical delivery times
      const estimatedDate = this.addBusinessDays(new Date(), 3); // Amazon Prime average
      
      return {
        estimatedDate,
        confidence: 'medium',
        businessDays: 3,
        factors: ['Amazon standard delivery time', 'Historical data']
      };
    } catch (error) {
      // Conservative estimate
      const estimatedDate = this.addBusinessDays(new Date(), 5);
      
      return {
        estimatedDate,
        confidence: 'low',
        businessDays: 5,
        factors: ['Conservative estimate', 'Provider unavailable']
      };
    }
  }

  private parseTrackingEvents(events: any[]): TrackingEvent[] {
    return events.map(event => {
      const trackingEvent: TrackingEvent = {
        timestamp: new Date(event.timestamp),
        status: this.mapStatusToStandard(event.status),
        description: event.description || event.message || 'Package update',
        ...(event.location && { location: `${event.location.city}, ${event.location.state}` }),
        ...(event.code && { providerEventCode: event.code })
      };
      return trackingEvent;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}