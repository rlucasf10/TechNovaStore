import axios, { AxiosInstance } from 'axios';
import { TrackingProvider, ProviderTrackingResponse, DeliveryEstimate, ShipmentStatus } from '../types/tracking';

export abstract class BaseTrackingProvider implements TrackingProvider {
  protected httpClient: AxiosInstance;
  public readonly name: string;
  protected readonly baseUrl: string;
  protected readonly apiKey: string | undefined;
  protected readonly rateLimitDelay: number;

  constructor(name: string, baseUrl: string, apiKey?: string, rateLimitDelay: number = 1000) {
    this.name = name;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.rateLimitDelay = rateLimitDelay;

    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'TechNovaStore-ShipmentTracker/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for API key if provided
    if (apiKey) {
      this.httpClient.interceptors.request.use((config) => {
        config.headers.Authorization = `Bearer ${apiKey}`;
        return config;
      });
    }

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          console.warn(`Rate limit hit for ${this.name} provider`);
        }
        return Promise.reject(error);
      }
    );
  }

  abstract getTrackingInfo(trackingNumber: string): Promise<ProviderTrackingResponse>;
  abstract isTrackingNumberValid(trackingNumber: string): boolean;
  abstract getEstimatedDelivery(trackingNumber: string, origin?: string, destination?: string): Promise<DeliveryEstimate>;

  protected async makeRequest<T>(url: string, options?: any): Promise<T> {
    try {
      // Add rate limiting delay
      await this.delay(this.rateLimitDelay);
      
      const response = await this.httpClient.get<T>(url, options);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw error;
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected mapStatusToStandard(providerStatus: string): ShipmentStatus {
    const statusMap: { [key: string]: ShipmentStatus } = {
      // Common status mappings
      'created': 'label_created',
      'label_created': 'label_created',
      'picked_up': 'picked_up',
      'pickup': 'picked_up',
      'in_transit': 'in_transit',
      'transit': 'in_transit',
      'out_for_delivery': 'out_for_delivery',
      'delivery': 'out_for_delivery',
      'delivered': 'delivered',
      'exception': 'exception',
      'error': 'exception',
      'returned': 'returned',
      'return': 'returned',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
    };

    const normalizedStatus = providerStatus.toLowerCase().replace(/[^a-z_]/g, '_');
    return statusMap[normalizedStatus] || 'in_transit';
  }

  protected calculateBusinessDays(startDate: Date, endDate: Date): number {
    let businessDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        businessDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return businessDays;
  }

  protected addBusinessDays(date: Date, businessDays: number): Date {
    const result = new Date(date);
    let daysAdded = 0;

    while (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
        daysAdded++;
      }
    }

    return result;
  }
}