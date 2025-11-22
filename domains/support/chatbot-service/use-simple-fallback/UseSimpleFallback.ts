/**
 * Caso de uso: Usar sistema de fallback simple
 * 
 * Este caso de uso se activa cuando Ollama no está disponible o falla.
 * Implementa un pipeline RAG básico + SimpleFallbackRecognizer para
 * proporcionar respuestas sin depender de LLM.
 */

import { ChatContext, ChatResponse } from '../shared/types';
import { RetrieveProductsRAG } from '../retrieve-products-rag/RetrieveProductsRAG';
import { SimpleFallbackRecognizer } from '../shared/recognizers/SimpleFallbackRecognizer';
import { GenerateResponse } from '../generate-response/GenerateResponse';

export class UseSimpleFallback {
  private retrieveProductsRAG: RetrieveProductsRAG;
  private simpleFallbackRecognizer: SimpleFallbackRecognizer;
  private generateResponse: GenerateResponse;

  constructor(
    retrieveProductsRAG: RetrieveProductsRAG,
    simpleFallbackRecognizer: SimpleFallbackRecognizer,
    generateResponse: GenerateResponse
  ) {
    this.retrieveProductsRAG = retrieveProductsRAG;
    this.simpleFallbackRecognizer = simpleFallbackRecognizer;
    this.generateResponse = generateResponse;
  }

  /**
   * Ejecuta el sistema de fallback simple
   */
  async execute(
    userInput: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    console.log('=== Usando SimpleFallbackRecognizer (modo básico) ===');

    try {
      // PASO 1: Recuperar productos relevantes usando RAG
      console.log('Ejecutando pipeline RAG en modo fallback...');
      const retrievedProducts = await this.retrieveProductsRAG.execute(userInput);

      // PASO 2: Formatear contexto de productos
      const productContext = this.formatProductContext(retrievedProducts);

      // PASO 3: Reconocer intención del usuario
      const intent = this.simpleFallbackRecognizer.recognizeIntent(userInput);
      console.log(`Intención reconocida: ${intent.name} (confianza: ${intent.confidence})`);

      // PASO 4: Actualizar contexto con intención actual
      context.previousIntents.push(intent);
      if (context.previousIntents.length > 5) {
        context.previousIntents.shift();
      }

      // PASO 5: Generar respuesta basada en intención
      const response = await this.generateResponse.execute(intent, userInput, context);

      // PASO 6: Incluir productos recuperados en la respuesta
      const allProducts = response.products
        ? [...new Set([...response.products, ...retrievedProducts])]
        : retrievedProducts;

      // PASO 7: Agregar indicador de fallback
      const fallbackMessage = response.message + '\n\n_Nota: Modo básico activo. Algunas funciones conversacionales limitadas._';

      console.log('✓ Respuesta generada con SimpleFallbackRecognizer');
      console.log('=== Fin de modo fallback ===');

      return {
        ...response,
        message: fallbackMessage,
        products: allProducts.length > 0 ? allProducts : undefined,
        productContext,
        usingFallback: true
      };
    } catch (error) {
      console.error('❌ Error crítico en sistema de fallback:', error);

      return {
        message: 'Lo siento, ha ocurrido un error procesando tu consulta. ¿Podrías intentar de nuevo?',
        intent: { name: 'error', confidence: 0, entities: {} },
        confidence: 0,
        usingFallback: true
      };
    }
  }

  /**
   * Formatea productos en contexto para el sistema de fallback
   */
  private formatProductContext(products: any[]): string {
    if (products.length === 0) {
      return "No hay productos disponibles.";
    }

    let context = "Productos encontrados:\n";
    products.forEach((product, index) => {
      context += `${index + 1}. ${product.name} - €${product.price}\n`;
    });

    return context;
  }
}
