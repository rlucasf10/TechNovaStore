/**
 * Tipos compartidos para el chatbot-service
 * Estos tipos son utilizados por múltiples casos de uso
 */

import { ProductInfo } from '../knowledge/ProductKnowledgeBase';

/**
 * Interfaz de intención compatible con SimpleFallbackIntent
 */
export interface Intent {
  name: string;
  confidence: number;
  entities: { [key: string]: string };
}

/**
 * Representa un mensaje individual en el historial de conversación
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: ProductInfo[];
}

/**
 * Contexto de chat que mantiene el estado de la conversación
 */
export interface ChatContext {
  userId?: string;
  sessionId: string;
  previousIntents: Intent[];
  currentTopic?: string;
  userPreferences?: {
    categories: string[];
    brands: string[];
    priceRange?: { min: number; max: number };
  };
  conversationHistory: ConversationMessage[];
  lastProductQuery?: string;
  lastProducts?: ProductInfo[];
}

/**
 * Respuesta del chatbot
 */
export interface ChatResponse {
  message: string;
  intent: Intent;
  products?: ProductInfo[];
  recommendations?: any[];
  suggestedActions?: string[];
  confidence: number;
  productContext?: string;
  usingFallback?: boolean;
}

/**
 * Mensaje en formato Ollama
 */
export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
