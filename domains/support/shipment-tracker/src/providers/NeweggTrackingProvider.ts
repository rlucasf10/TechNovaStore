import { BaseTrackingProvider } from './BaseTrackingProvider';
import { ProviderTrackingResponse, DeliveryEstimate, TrackingInfo, TrackingEvent } from '../types/tracking';

export class NeweggTrackingProvider extends BaseTrackingProvider {
    constructor(apiKey?: string) {
        super('Newegg', 'https://api.newegg.com/marketplace/ordermgmt', apiKey, 1000);
    }

    async getTrackingInfo(trackingNumber: string): Promise<ProviderTrackingResponse> {
        try {
            if (!this.isTrackingNumberValid(trackingNumber)) {
                return {
                    success: false,
                    error: 'Invalid Newegg tracking number format'
                };
            }

            // Newegg Marketplace API call (simulated structure)
            const response = await this.makeRequest<any>(`/v1/shipping/tracking/${trackingNumber}`);

            const trackingInfo: TrackingInfo = {
                trackingNumber,
                provider: this.name,
                status: this.mapStatusToStandard(response.ShipmentStatus),
                events: this.parseTrackingEvents(response.TrackingEvents || []),
                lastUpdated: new Date(),
                ...(response.EstimatedDeliveryDate && { estimatedDeliveryDate: new Date(response.EstimatedDeliveryDate) }),
                ...(response.ActualDeliveryDate && { actualDeliveryDate: new Date(response.ActualDeliveryDate) }),
                ...(response.ShipFromAddress && {
                    origin: {
                        city: response.ShipFromAddress.City,
                        state: response.ShipFromAddress.StateCode,
                        country: response.ShipFromAddress.CountryCode
                    }
                }),
                ...(response.ShipToAddress && {
                    destination: {
                        city: response.ShipToAddress.City,
                        state: response.ShipToAddress.StateCode,
                        country: response.ShipToAddress.CountryCode
                    }
                })
            };

            return {
                success: true,
                trackingInfo
            };
        } catch (error: any) {
            console.error(`Newegg tracking error for ${trackingNumber}:`, error.message);

            if (error.message.includes('Rate limit')) {
                return {
                    success: false,
                    error: 'Rate limit exceeded',
                    rateLimited: true
                };
            }

            return {
                success: false,
                error: error.message || 'Failed to fetch Newegg tracking information'
            };
        }
    }

    isTrackingNumberValid(trackingNumber: string): boolean {
        // Newegg uses standard US carrier tracking numbers
        const neweggPatterns = [
            /^1Z[A-Z0-9]{16}$/, // UPS
            /^\d{12}$/, // FedEx 12-digit
            /^\d{14}$/, // FedEx 14-digit
            /^9[0-9]{21}$/, // USPS
            /^[A-Z0-9]{10,20}$/ // General format
        ];

        return neweggPatterns.some(pattern => pattern.test(trackingNumber.toUpperCase()));
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
                    factors: ['Newegg carrier estimate', 'Domestic shipping']
                };
            }

            // Fallback estimation based on Newegg's typical delivery times
            // Domestic US shipping usually takes 3-5 business days
            const estimatedDate = this.addBusinessDays(new Date(), 4);

            return {
                estimatedDate,
                confidence: 'high',
                businessDays: 4,
                factors: ['Newegg standard delivery', 'Domestic shipping', 'Historical data']
            };
        } catch (error) {
            // Conservative estimate for domestic shipping
            const estimatedDate = this.addBusinessDays(new Date(), 7);

            return {
                estimatedDate,
                confidence: 'medium',
                businessDays: 7,
                factors: ['Conservative domestic estimate', 'Provider unavailable']
            };
        }
    }

    private parseTrackingEvents(events: any[]): TrackingEvent[] {
        return events.map(event => {
            const trackingEvent: TrackingEvent = {
                timestamp: new Date(event.EventDate),
                status: this.mapStatusToStandard(event.EventType),
                description: event.EventDescription || 'Package update',
                ...(event.EventLocation && { location: `${event.EventLocation.City}, ${event.EventLocation.StateCode}` }),
                ...(event.EventCode && { providerEventCode: event.EventCode })
            };
            return trackingEvent;
        }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
}