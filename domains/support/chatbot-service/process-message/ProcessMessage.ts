/**
 * Caso de uso: Procesar mensaje del usuario
 * 
 * Este caso de uso maneja el procesamiento completo de un mensaje del usuario:
 * 1. Obtiene o crea la sesión
 * 2. Actualiza la actividad de la sesión
 * 3. Agrega el mensaje al historial conversacional
 * 4. Procesa el mensaje con el motor NLP (Ollama o fallback)
 * 5. Agrega la respuesta al historial
 * 6. Analiza si se necesita escalación
 * 7. Retorna la respuesta enriquecida
 */

import { ChatContext, ChatResponse, ConversationMessage } from '../shared/types';
import { ProcessWithOllama } from '../process-with-ollama/ProcessWithOllama';
import { UseSimpleFallback } from '../use-simple-fallback/UseSimpleFallback';
import { OllamaAdapter } from '../shared/clients/OllamaAdapter';
import { EscalationIntegration } from '../shared/services/EscalationIntegration';

export interface ChatSession {
  sessionId: string;
  userId?: string;
  context: ChatContext;
  createdAt: Date;
  lastActivity: Date;
}

export class ProcessMessage {
  private processWithOllama: ProcessWithOllama;
  private useSimpleFallback: UseSimpleFallback;
  private ollamaAdapter: OllamaAdapter;
  private escalationService: EscalationIntegration;
  private useOllama: boolean;

  constructor(
    processWithOllama: ProcessWithOllama,
    useSimpleFallback: UseSimpleFallback,
    ollamaAdapter: OllamaAdapter,
    escalationService: EscalationIntegration
  ) {
    this.processWithOllama = processWithOllama;
    this.useSimpleFallback = useSimpleFallback;
    this.ollamaAdapter = ollamaAdapter;
    this.escalationService = escalationService;
    this.useOllama = process.env.USE_OLLAMA === 'true';
  }

  /**
   * Procesa un mensaje del usuario y genera una respuesta
   * Implementa lógica de fallback automático si Ollama falla
   */
  async execute(
    message: string,
    session: ChatSession
  ): Promise<ChatResponse & { escalationSuggestion?: any }> {
    try {
      // Actualizar actividad de la sesión
      session.lastActivity = new Date();

      // Agregar mensaje del usuario al historial conversacional
      this.addMessageToHistory(session, 'user', message);

      // Registrar mensaje para análisis de escalación
      this.escalationService.recordConversation(session.sessionId, message, 'user');

      // Procesar mensaje con NLP engine (Ollama o fallback)
      const response = await this.processWithNLP(message, session.context);

      // Agregar respuesta del asistente al historial conversacional
      this.addMessageToHistory(session, 'assistant', response.message, response.products);

      // Registrar respuesta del bot para análisis de escalación
      this.escalationService.recordConversation(session.sessionId, response.message, 'bot');

      // Analizar si se necesita escalación
      const escalationDecision = this.escalationService.analyzeForEscalation(
        session.sessionId,
        message,
        response,
        session.context
      );

      // Actualizar contexto de la sesión
      this.updateSessionContext(session, response);

      // Agregar sugerencia de escalación si es necesario
      let enhancedResponse: ChatResponse & { escalationSuggestion?: any } = response;

      if (escalationDecision.shouldEscalate) {
        enhancedResponse.escalationSuggestion = {
          shouldEscalate: true,
          reason: escalationDecision.reason,
          message: escalationDecision.escalationMessage
        };

        // Agregar acción de escalación a las acciones sugeridas
        if (!enhancedResponse.suggestedActions) {
          enhancedResponse.suggestedActions = [];
        }
        enhancedResponse.suggestedActions.unshift('Hablar con un agente humano');
      }

      return enhancedResponse;
    } catch (error) {
      console.error('Error processing message:', error);
      // Retornar respuesta de fallback en caso de error
      return {
        message: 'Lo siento, ha ocurrido un error procesando tu mensaje. ¿Podrías intentar de nuevo?',
        intent: { name: 'error', confidence: 0, entities: {} },
        confidence: 0
      };
    }
  }

  /**
   * Procesa el mensaje con el motor NLP apropiado (Ollama o fallback)
   */
  private async processWithNLP(
    message: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    // PASO 1: Verificar si USE_OLLAMA está habilitado
    if (!this.useOllama) {
      console.log('USE_OLLAMA=false, usando SimpleFallbackRecognizer directamente');
      return await this.useSimpleFallback.execute(message, context);
    }

    // PASO 2: Verificar health de Ollama antes de procesar
    console.log('Verificando health de Ollama...');
    const ollamaHealthy = await this.ollamaAdapter.checkHealth();

    if (!ollamaHealthy) {
      console.warn('⚠️ Ollama no está disponible, usando fallback automático');
      return await this.useSimpleFallback.execute(message, context);
    }

    console.log('✓ Ollama está disponible y saludable');

    // PASO 3: Intentar procesar con Ollama usando try-catch
    try {
      console.log('Intentando procesar con Ollama...');
      const response = await this.processWithOllama.execute(message, context);
      console.log('✓ Respuesta generada exitosamente con Ollama');
      return response;
    } catch (error) {
      // PASO 4: Capturar errores de Ollama y usar fallback
      console.error('❌ Error procesando con Ollama:', error);
      console.warn('⚠️ Usando fallback automático debido a error de Ollama');

      // Registrar detalles del error para debugging
      if (error instanceof Error) {
        console.error('Tipo de error:', error.name);
        console.error('Mensaje de error:', error.message);
      }

      // PASO 5: Llamar a useSimpleFallback
      return await this.useSimpleFallback.execute(message, context);
    }
  }

  /**
   * Estima el número de tokens en un texto
   * Usa la aproximación: ~4 caracteres = 1 token
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calcula el total de tokens en el historial conversacional
   */
  private calculateHistoryTokens(conversationHistory: ConversationMessage[]): number {
    let totalTokens = 0;

    for (const message of conversationHistory) {
      totalTokens += this.estimateTokens(message.content);
    }

    return totalTokens;
  }

  /**
   * Agrega un mensaje al historial conversacional de la sesión
   * Mantiene automáticamente el límite de tokens (1000 tokens para contexto)
   */
  private addMessageToHistory(
    session: ChatSession,
    role: 'user' | 'assistant',
    content: string,
    products?: any[]
  ): void {
    const message: ConversationMessage = {
      role,
      content,
      timestamp: new Date(),
      products
    };

    // Agregar mensaje al historial
    session.context.conversationHistory.push(message);

    // Límites de tokens para Phi-3 Mini
    const MAX_CONTEXT_TOKENS = 1000; // Tokens disponibles para historial conversacional
    const RESERVED_TOKENS_FOR_RESPONSE = 1000; // Tokens reservados para respuesta del LLM

    // Calcular tokens actuales en el historial
    let currentTokens = this.calculateHistoryTokens(session.context.conversationHistory);

    // Si excede el límite, eliminar mensajes antiguos hasta estar dentro del límite
    while (currentTokens > MAX_CONTEXT_TOKENS && session.context.conversationHistory.length > 2) {
      const removedMessage = session.context.conversationHistory.shift();

      if (removedMessage) {
        const removedTokens = this.estimateTokens(removedMessage.content);
        currentTokens -= removedTokens;

        console.log(
          `Historial de sesión ${session.sessionId}: eliminado mensaje antiguo ` +
          `(${removedTokens} tokens, ${currentTokens} tokens restantes)`
        );
      }
    }

    console.log(
      `Historial de sesión ${session.sessionId}: ${session.context.conversationHistory.length} mensajes, ` +
      `~${currentTokens} tokens (límite: ${MAX_CONTEXT_TOKENS}, reservados para respuesta: ${RESERVED_TOKENS_FOR_RESPONSE})`
    );
  }

  /**
   * Actualiza el contexto de la sesión basado en la respuesta del chat
   */
  private updateSessionContext(session: ChatSession, response: ChatResponse): void {
    // Actualizar tema actual basado en la intención
    if (response.intent.name !== 'unknown' && response.intent.confidence > 0.5) {
      session.context.currentTopic = response.intent.name;
    }

    // Actualizar preferencias del usuario basado en entidades
    if (response.intent.entities.PRODUCT_TYPE) {
      const category = response.intent.entities.PRODUCT_TYPE;
      if (!session.context.userPreferences?.categories.includes(category)) {
        session.context.userPreferences?.categories.push(category);
      }
    }

    if (response.intent.entities.BRAND) {
      const brand = response.intent.entities.BRAND;
      if (!session.context.userPreferences?.brands.includes(brand)) {
        session.context.userPreferences?.brands.push(brand);
      }
    }

    // Limitar preferencias para evitar sobrecarga de memoria
    if (session.context.userPreferences) {
      session.context.userPreferences.categories =
        session.context.userPreferences.categories.slice(-10);
      session.context.userPreferences.brands =
        session.context.userPreferences.brands.slice(-10);
    }
  }
}
