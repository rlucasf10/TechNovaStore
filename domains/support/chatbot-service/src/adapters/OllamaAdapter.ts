import axios, { AxiosInstance } from 'axios';

/**
 * Configuration for Ollama adapter
 */
export interface OllamaConfig {
  host: string;
  model: string;
  timeout: number;
  temperature: number;
  maxTokens: number;
}

/**
 * Message format for Ollama chat API
 */
export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Request payload for Ollama chat completion
 */
export interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

/**
 * Response from Ollama chat completion
 */
export interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  created_at?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Custom error class for Ollama-related errors
 */
export class OllamaError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean
  ) {
    super(message);
    this.name = 'OllamaError';
  }
}

/**
 * Error codes for Ollama operations
 */
export const OllamaErrorCodes = {
  CONNECTION_FAILED: 'OLLAMA_CONNECTION_FAILED',
  TIMEOUT: 'OLLAMA_TIMEOUT',
  MODEL_NOT_LOADED: 'OLLAMA_MODEL_NOT_LOADED',
  INVALID_RESPONSE: 'OLLAMA_INVALID_RESPONSE',
  RATE_LIMIT: 'OLLAMA_RATE_LIMIT'
} as const;

/**
 * Adapter for communicating with Ollama LLM service
 * Handles HTTP communication, streaming, health checks, and error management
 */
export class OllamaAdapter {
  private config: OllamaConfig;
  private httpClient: AxiosInstance;
  private healthCheckCache: { isHealthy: boolean; timestamp: number } | null = null;
  private readonly HEALTH_CHECK_CACHE_TTL = 30000; // 30 seconds

  /**
   * Creates an instance of OllamaAdapter
   * Configuration is loaded from environment variables with sensible defaults
   */
  constructor(config?: Partial<OllamaConfig>) {
    // Load configuration from environment variables with defaults
    this.config = {
      host: config?.host || process.env.OLLAMA_HOST || 'http://ollama:11434',
      model: config?.model || process.env.OLLAMA_MODEL || 'phi3:mini',
      timeout: config?.timeout || parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10),
      temperature: config?.temperature || parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7'),
      maxTokens: config?.maxTokens || parseInt(process.env.OLLAMA_MAX_TOKENS || '1000', 10)
    };

    // Create HTTP client with configured timeout
    this.httpClient = axios.create({
      baseURL: this.config.host,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`OllamaAdapter initialized with host: ${this.config.host}, model: ${this.config.model}`);
  }

  /**
   * Get current configuration
   */
  public getConfig(): OllamaConfig {
    return { ...this.config };
  }

  /**
   * Generate a complete response from Ollama (non-streaming)
   * Implements retry logic with exponential backoff (2 attempts)
   * @param messages Array of messages for the conversation
   * @param retryCount Current retry attempt (internal use)
   * @returns Generated response text
   */
  async generateResponse(messages: OllamaMessage[], retryCount: number = 0): Promise<string> {
    const MAX_RETRIES = 2;
    
    try {
      const request: OllamaRequest = {
        model: this.config.model,
        messages,
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens
        }
      };

      console.log(`Sending request to Ollama: ${messages.length} messages${retryCount > 0 ? ` (retry ${retryCount}/${MAX_RETRIES})` : ''}`);
      
      const response = await this.httpClient.post<OllamaResponse>('/api/chat', request);

      if (!response.data || !response.data.message || !response.data.message.content) {
        throw new OllamaError(
          'Invalid response format from Ollama',
          OllamaErrorCodes.INVALID_RESPONSE,
          false
        );
      }

      console.log(`Received response from Ollama: ${response.data.message.content.length} characters`);
      
      return response.data.message.content;
    } catch (error) {
      const ollamaError = this.handleError(error);
      
      // Retry logic with exponential backoff
      if (ollamaError.retryable && retryCount < MAX_RETRIES) {
        const backoffDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
        console.warn(`Request failed (${ollamaError.code}), retrying in ${backoffDelay}ms...`);
        
        await this.sleep(backoffDelay);
        return this.generateResponse(messages, retryCount + 1);
      }
      
      // Max retries reached or non-retryable error
      throw ollamaError;
    }
  }

  /**
   * Sleep utility for retry backoff
   * @param ms Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a streaming response from Ollama
   * @param messages Array of messages for the conversation
   * @param onChunk Callback function called for each chunk of text
   */
  async generateStreamingResponse(
    messages: OllamaMessage[],
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const request: OllamaRequest = {
        model: this.config.model,
        messages,
        stream: true,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens
        }
      };

      console.log(`Sending streaming request to Ollama: ${messages.length} messages`);

      const response = await this.httpClient.post('/api/chat', request, {
        responseType: 'stream'
      });

      // Process NDJSON stream line by line
      let buffer = '';
      
      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: OllamaResponse = JSON.parse(line);
              
              if (data.message && data.message.content) {
                onChunk(data.message.content);
              }
              
              if (data.done) {
                console.log('Streaming response completed');
              }
            } catch (parseError) {
              console.error('Error parsing streaming chunk:', parseError);
            }
          }
        }
      });

      // Wait for stream to complete
      await new Promise<void>((resolve, reject) => {
        response.data.on('end', () => resolve());
        response.data.on('error', (error: Error) => reject(error));
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if Ollama service is healthy and responsive
   * Uses a 30-second cache to avoid excessive health checks
   * @returns True if service is healthy, false otherwise
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Check cache first
      if (this.healthCheckCache) {
        const age = Date.now() - this.healthCheckCache.timestamp;
        if (age < this.HEALTH_CHECK_CACHE_TTL) {
          return this.healthCheckCache.isHealthy;
        }
      }

      // Perform health check
      const response = await this.httpClient.get('/api/tags', {
        timeout: 5000 // Shorter timeout for health checks
      });

      const isHealthy = response.status === 200;
      
      // Update cache
      this.healthCheckCache = {
        isHealthy,
        timestamp: Date.now()
      };

      return isHealthy;
    } catch (error) {
      console.warn('Ollama health check failed:', error instanceof Error ? error.message : 'Unknown error');
      
      // Update cache with failure
      this.healthCheckCache = {
        isHealthy: false,
        timestamp: Date.now()
      };
      
      return false;
    }
  }

  /**
   * Check if the configured model is loaded in Ollama
   * @returns True if model is loaded, false otherwise
   */
  async isModelLoaded(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/api/tags', {
        timeout: 5000
      });

      if (!response.data || !response.data.models) {
        return false;
      }

      // Check if our model is in the list
      const models = response.data.models as Array<{ name: string }>;
      const modelLoaded = models.some(m => m.name === this.config.model);

      if (!modelLoaded) {
        console.warn(`Model ${this.config.model} is not loaded in Ollama`);
      }

      return modelLoaded;
    } catch (error) {
      console.error('Error checking if model is loaded:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Handle errors from Ollama requests and convert to OllamaError
   * @param error The error to handle
   * @returns OllamaError with appropriate code and retry flag
   */
  private handleError(error: unknown): OllamaError {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return new OllamaError(
          `Cannot connect to Ollama at ${this.config.host}`,
          OllamaErrorCodes.CONNECTION_FAILED,
          true
        );
      }

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return new OllamaError(
          `Request to Ollama timed out after ${this.config.timeout}ms`,
          OllamaErrorCodes.TIMEOUT,
          true
        );
      }

      if (error.response?.status === 404) {
        return new OllamaError(
          `Model ${this.config.model} not found in Ollama`,
          OllamaErrorCodes.MODEL_NOT_LOADED,
          false
        );
      }

      if (error.response?.status === 429) {
        return new OllamaError(
          'Rate limit exceeded for Ollama requests',
          OllamaErrorCodes.RATE_LIMIT,
          true
        );
      }

      return new OllamaError(
        `Ollama request failed: ${error.message}`,
        OllamaErrorCodes.CONNECTION_FAILED,
        true
      );
    }

    if (error instanceof OllamaError) {
      return error;
    }

    return new OllamaError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      OllamaErrorCodes.CONNECTION_FAILED,
      false
    );
  }

  /**
   * Clear the health check cache
   * Useful for forcing a fresh health check
   */
  public clearHealthCheckCache(): void {
    this.healthCheckCache = null;
  }
}
