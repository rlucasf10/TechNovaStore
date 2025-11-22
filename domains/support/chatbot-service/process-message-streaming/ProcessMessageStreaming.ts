/**
 * Caso de uso: Procesar mensaje con streaming
 * 
 * Este caso de uso maneja el procesamiento de mensajes con respuesta en streaming:
 * 1. Ejecuta el pipeline RAG completo
 * 2. Llama a Ollama con streaming
 * 3. Emite chunks de texto en tiempo real
 * 4. Actualiza el contexto conversacional al finalizar
 */

import { ChatContext, OllamaMessage } from '../shared/types';
import { OllamaAdapter } from '../shared/clients/OllamaAdapter';
import { RetrieveProductsRAG } from '../retrieve-products-rag/RetrieveProductsRAG';
import { SimpleFallbackRecognizer } from '../shared/recognizers/SimpleFallbackRecognizer';
import { buildSystemPrompt } from '../shared/prompts/SystemPrompt';
import { ProductInfo } from '../shared/knowledge/ProductKnowledgeBase';

export interface StreamingMetadata {
  intent: any;
  products?: ProductInfo[];
  confidence: number;
}

export class ProcessMessageStreaming {
  private ollamaAdapter: OllamaAdapter;
  private retrieveProductsRAG: RetrieveProductsRAG;
  private simpleFallbackRecognizer: SimpleFallbackRecognizer;

  constructor(
    ollamaAdapter: OllamaAdapter,
    retrieveProductsRAG: RetrieveProductsRAG,
    simpleFallbackRecognizer: SimpleFallbackRecognizer
  ) {
    this.ollamaAdapter = ollamaAdapter;
    this.retrieveProductsRAG = retrieveProductsRAG;
    this.simpleFallbackRecognizer = simpleFallbackRecognizer;
  }

  /**
   * Procesa el mensaje del usuario con streaming de respuesta
   * 
   * @param userInput Mensaje del usuario
   * @param context Contexto de la conversación
   * @param onChunk Callback que se llama por cada chunk de texto recibido
   * @returns Promise con metadata cuando el streaming termina
   */
  async execute(
    userInput: string,
    context: ChatContext,
    onChunk: (chunk: string) => void
  ): Promise<StreamingMetadata> {
    try {
      console.log('=== Iniciando processMessageStreaming ===');
      console.log('Mensaje del usuario:', userInput);

      // PASO 1: Ejecutar pipeline RAG - Recuperar productos
      console.log('PASO 1: Ejecutando pipeline RAG...');
      const retrievedProducts = await this.retrieveProductsRAG.execute(userInput);
      console.log(`Productos recuperados: ${retrievedProducts.length}`);

      // PASO 2: Formatear contexto de productos
      console.log('PASO 2: Formateando contexto de productos...');
      const productContext = this.formatProductContext(retrievedProducts);

      // PASO 3: Formatear historial conversacional
      console.log('PASO 3: Formateando historial conversacional...');
      const conversationHistory = this.formatConversationHistory(context.conversationHistory || []);
      console.log(`Historial: ${conversationHistory.length} mensajes`);

      // PASO 4: Construir array de mensajes para Ollama
      console.log('PASO 4: Construyendo array de mensajes...');
      const messages: OllamaMessage[] = [];

      // 4.1: System prompt con contexto de productos
      const systemPrompt = buildSystemPrompt({
        productContext,
        conversationHistory: conversationHistory.length > 0
          ? conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')
          : undefined
      });

      messages.push({
        role: 'system',
        content: systemPrompt
      });

      // 4.2: Agregar historial conversacional
      messages.push(...conversationHistory);

      // 4.3: Agregar mensaje actual del usuario
      messages.push({
        role: 'user',
        content: userInput
      });

      console.log(`Total de mensajes para Ollama: ${messages.length}`);

      // PASO 5: Llamar a OllamaAdapter con streaming
      console.log('PASO 5: Llamando a Ollama con streaming...');

      let fullResponse = '';

      await this.ollamaAdapter.generateStreamingResponse(messages, (chunk: string) => {
        // Acumular respuesta completa
        fullResponse += chunk;
        // Emitir chunk via callback
        onChunk(chunk);
      });

      console.log(`✓ Streaming completado. Respuesta total: ${fullResponse.length} caracteres`);

      // PASO 6: Reconocer intención básica
      const intent = this.simpleFallbackRecognizer.recognizeIntent(userInput);

      console.log('=== processMessageStreaming completado exitosamente ===');

      // Retornar metadata
      return {
        intent,
        products: retrievedProducts.length > 0 ? retrievedProducts : undefined,
        confidence: 0.9
      };

    } catch (error) {
      console.error('Error en processMessageStreaming:', error);
      throw error;
    }
  }

  /**
   * Convierte el historial de conversación al formato Ollama
   */
  private formatConversationHistory(conversationHistory: any[]): OllamaMessage[] {
    return conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Formatea productos en contexto para el LLM
   */
  private formatProductContext(products: ProductInfo[]): string {
    if (products.length === 0) {
      return "No hay productos disponibles en el contexto actual.";
    }

    let context = "PRODUCTOS DISPONIBLES:\n\n";

    products.forEach((product, index) => {
      context += `${index + 1}. ${product.name}\n`;
      context += `   - SKU: ${product.sku}\n`;
      context += `   - Marca: ${product.brand}\n`;
      context += `   - Precio: €${product.price.toFixed(2)}\n`;
      context += `   - Disponibilidad: ${product.availability ? 'En stock' : 'Agotado'}\n`;

      if (product.description) {
        const truncatedDescription = product.description.length > 200
          ? product.description.substring(0, 200) + '...'
          : product.description;
        context += `   - Descripción: ${truncatedDescription}\n`;
      }

      context += "\n";
    });

    return context;
  }
}
