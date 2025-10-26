export interface TrackingEvent {
  timestamp: Date;
  status: ShipmentStatus;
  location?: string;
  description: string;
  providerEventCode?: string;
}

export type ShipmentStatus = 
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception'
  | 'returned'
  | 'cancelled';

export interface TrackingInfo {
  trackingNumber: string;
  provider: string;
  status: ShipmentStatus;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  events: TrackingEvent[];
  lastUpdated: Date;
  origin?: {
    city: string;
    state?: string;
    country: string;
  };
  destination?: {
    city: string;
    state?: string;
    country: string;
  };
}

export interface ProviderTrackingResponse {
  success: boolean;
  trackingInfo?: TrackingInfo;
  error?: string;
  rateLimited?: boolean;
}

export interface DeliveryEstimate {
  estimatedDate: Date;
  confidence: 'low' | 'medium' | 'high';
  businessDays: number;
  factors: string[];
}

export interface TrackingProvider {
  name: string;
  getTrackingInfo(trackingNumber: string): Promise<ProviderTrackingResponse>;
  isTrackingNumberValid(trackingNumber: string): boolean;
  getEstimatedDelivery(trackingNumber: string, origin?: string, destination?: string): Promise<DeliveryEstimate>;
}

export interface ShipmentUpdate {
  orderId: string;
  trackingNumber: string;
  provider: string;
  status: ShipmentStatus;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  events: TrackingEvent[];
}