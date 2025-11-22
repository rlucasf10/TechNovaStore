/**
 * Caso de uso: Procesar mensaje con Ollama
 * 
 * Este caso de uso ejecuta el pipeline RAG completo con Ollama:
 * 1. Recupera productos relevantes usando RAG
 * 2. Formatea el contexto de productos
 * 3. Construye el array de mensajes con historial conversacional
 * 4. Llama a Ollama para generar la respuesta
 * 5. Actualiza el contexto conversacional
 */

import { ChatContext, ChatResponse, OllamaMessage } from '../shared/types';
import { OllamaAdapter } from '../shared/clients/OllamaAdapter';
import { RetrieveProductsRAG } from '../retrieve-products-rag/RetrieveProductsRAG';
import { SimpleFallbackRecognizer } from '../shared/recognizers/SimpleFallbackRecognizer';
import { buildSystemPrompt } from '../shared/prompts/SystemPrompt';
import { ProductInfo } from '../shared/knowledge/ProductKnowledgeBase';

export class ProcessWithOllama {
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
   * Procesa el mensaje del usuario usando Ollama con pipeline RAG completo
   */
  async execute(
    userInput: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    try {
      console.log('=== Iniciando processWithOllama ===');
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

      // PASO 5: Llamar a OllamaAdapter
      console.log('PASO 5: Llamando a Ollama...');
      const responseText = await this.ollamaAdapter.generateResponse(messages);
      console.log(`Respuesta recibida de Ollama: ${responseText.length} caracteres`);

      // PASO 6: Construir ChatResponse
      console.log('PASO 6: Construyendo ChatResponse...');

      // Reconocer intención básica para compatibilidad
      const intent = this.simpleFallbackRecognizer.recognizeIntent(userInput);

      const chatResponse: ChatResponse = {
        message: responseText,
        intent,
        products: retrievedProducts.length > 0 ? retrievedProducts : undefined,
        confidence: 0.9,
        productContext,
        usingFallback: false
      };

      console.log('=== processWithOllama completado exitosamente ===');
      return chatResponse;

    } catch (error) {
      console.error('Error en processWithOllama:', error);
      throw error;
    }
  }

  /**
   * Convierte el historial de conversación al formato requerido por Ollama
   */
  private formatConversationHistory(conversationHistory: any[]): OllamaMessage[] {
    return conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Formatea productos recuperados en un contexto estructurado para el LLM
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

      if (product.specifications && Object.keys(product.specifications).length > 0) {
        context += `   - Especificaciones:\n`;
        const specEntries = Object.entries(product.specifications).slice(0, 5);
        specEntries.forEach(([key, value]) => {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          context += `     * ${formattedKey}: ${value}\n`;
        });
      }

      context += "\n";
    });

    return context;
  }
}
