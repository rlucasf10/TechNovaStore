/**
 * Gemini Adapter
 * 
 * Adaptador para integrar Google Gemini API con el chatbot
 * Usa Gemini 2.0 Flash (gratuito con límites generosos)
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiAdapter {
  private client: AxiosInstance;
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    this.temperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');
    this.maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '1000', 10);

    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno');
    }

    this.client = axios.create({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.info('GeminiAdapter inicializado', {
      model: this.model,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    });
  }

  /**
   * Genera una respuesta usando Gemini
   */
  async generateResponse(messages: GeminiMessage[]): Promise<string> {
    try {
      const request: GeminiRequest = {
        contents: messages,
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens,
          topP: 0.95,
          topK: 40,
        },
      };

      logger.debug('Enviando solicitud a Gemini', {
        model: this.model,
        messageCount: messages.length,
      });

      const response = await this.client.post<GeminiResponse>(
        `/models/${this.model}:generateContent`,
        request,
        {
          params: {
            key: this.apiKey,
          },
        }
      );

      if (!response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('Gemini no devolvió ninguna respuesta');
      }

      const candidate = response.data.candidates[0];
      const text = candidate.content.parts[0]?.text || '';

      logger.debug('Respuesta de Gemini recibida', {
        finishReason: candidate.finishReason,
        tokensUsed: response.data.usageMetadata?.totalTokenCount || 0,
        responseLength: text.length,
      });

      return text;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        logger.error('Error en solicitud a Gemini', {
          status,
          error: errorData,
          message: error.message,
        });

        if (status === 429) {
          throw new Error('Límite de rate de Gemini excedido. Intenta de nuevo en unos minutos.');
        } else if (status === 401 || status === 403) {
          throw new Error('API key de Gemini inválida o sin permisos');
        } else {
          throw new Error(`Error de Gemini API: ${error.message}`);
        }
      }

      logger.error('Error inesperado en GeminiAdapter', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Verifica si Gemini está disponible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get(`/models/${this.model}`, {
        params: {
          key: this.apiKey,
        },
      });

      return response.status === 200;
    } catch (error) {
      logger.error('Health check de Gemini falló', { error: error instanceof Error ? error.message : error });
      return false;
    }
  }

  /**
   * Convierte mensajes del formato del chatbot al formato de Gemini
   */
  static convertMessages(messages: Array<{ role: string; content: string }>): GeminiMessage[] {
    return messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
  }
}
