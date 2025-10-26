import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ProviderAdapter, ProviderConfig, ProviderProduct, SearchOptions } from '../../types/provider';

export abstract class BaseAdapter implements ProviderAdapter {
  public readonly name: string;
  public readonly config: ProviderConfig;
  protected httpClient: AxiosInstance;
  private lastRequestTime: number = 0;

  constructor(name: string, config: ProviderConfig) {
    this.name = name;
    this.config = config;
    
    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'User-Agent': 'TechNovaStore-SyncEngine/1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for rate limiting
    this.httpClient.interceptors.request.use(async (config) => {
      await this.enforceRateLimit();
      return config;
    });

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          // Rate limit exceeded, wait and retry
          await this.sleep(60000); // Wait 1 minute
          return this.httpClient.request(error.config);
        }
        throw error;
      }
    );
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = (60 * 1000) / this.config.rateLimit; // Convert rate limit to milliseconds

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await this.sleep(waitTime);
    }

    this.lastRequestTime = Date.now();
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async makeRequest<T>(config: AxiosRequestConfig): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.httpClient.request<T>(config);
        return response.data;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retryAttempts) {
          const backoffTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          await this.sleep(backoffTime);
        }
      }
    }

    throw lastError!;
  }

  public getRateLimit(): number {
    return this.config.rateLimit;
  }

  public async isHealthy(): Promise<boolean> {
    try {
      await this.makeRequest({
        method: 'GET',
        url: '/health',
        timeout: 5000
      });
      return true;
    } catch {
      return false;
    }
  }

  // Abstract methods to be implemented by specific adapters
  abstract searchProducts(query: string, options?: SearchOptions): Promise<ProviderProduct[]>;
  abstract getProduct(productId: string): Promise<ProviderProduct | null>;
  abstract checkAvailability(productId: string): Promise<boolean>;
  abstract getPrice(productId: string): Promise<number | null>;
}