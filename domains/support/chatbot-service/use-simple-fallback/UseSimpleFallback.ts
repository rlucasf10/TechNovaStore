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
import { logger } from '../shared/utils/logger';

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
   * Detecta si el usuario pide productos diferentes/otros
   */
  private wantsDifferentProducts(userInput: string): boolean {
    const patterns = [
      /otros?\s*(productos?)?/i,
      /diferentes?/i,
      /distintos?/i,
      /m[aá]s\s*(productos?|opciones?)/i,
      /alternativas?/i,
      /que\s+sean\s+diferentes?/i,
      /no\s+esos/i,
      /nuevos?\s*(productos?)?/i
    ];
    return patterns.some(p => p.test(userInput));
  }

  /**
   * Ejecuta el sistema de fallback simple
   */
  async execute(
    userInput: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    logger.info('Usando SimpleFallbackRecognizer (modo básico)', { sessionId: context.sessionId });

    try {
      // Inicializar array de productos mostrados si no existe
      if (!context.shownProductSkus) {
        context.shownProductSkus = [];
      }

      // Detectar si el usuario quiere productos diferentes
      const wantsDifferent = this.wantsDifferentProducts(userInput);
      
      // Extraer el límite solicitado del mensaje
      const requestedLimit = this.retrieveProductsRAG.extractRequestedLimit(userInput);
      
      logger.debug('Estado de fallback', { 
        wantsDifferent, 
        requestedLimit, 
        shownSkusCount: context.shownProductSkus.length,
        sessionId: context.sessionId 
      });

      // PASO 1: Reconocer intención del usuario
      const intent = this.simpleFallbackRecognizer.recognizeIntent(userInput);
      logger.debug('Intención reconocida', { 
        intent: intent.name, 
        confidence: intent.confidence,
        sessionId: context.sessionId 
      });

      // PASO 2: Actualizar contexto con intención actual
      context.previousIntents.push(intent);
      if (context.previousIntents.length > 5) {
        context.previousIntents.shift();
      }

      // PASO 3: Generar respuesta basada en intención
      const response = await this.generateResponse.execute(intent, userInput, context);

      // PASO 4: Recuperar productos del RAG SOLO si la respuesta incluye productos
      // Esto evita mostrar productos cuando se hacen preguntas consultivas
      let retrievedProducts: any[] = [];
      let productContext = '';
      
      if (response.products && response.products.length > 0) {
        logger.debug('Ejecutando pipeline RAG en modo fallback', { sessionId: context.sessionId });
        retrievedProducts = await this.retrieveProductsRAG.execute(userInput, {
          limit: requestedLimit || response.products.length || 5,
          // Si quiere diferentes, excluir los ya mostrados
          excludeSkus: wantsDifferent ? context.shownProductSkus : []
        });
        productContext = this.formatProductContext(retrievedProducts);
      } else {
        logger.debug('Respuesta consultiva - no se recuperan productos del RAG', { sessionId: context.sessionId });
      }

      // PASO 5: Usar productos del RAG (evitar duplicados)
      // Los productos del RAG son más relevantes que los de generateResponse
      const uniqueProducts = this.deduplicateProducts(retrievedProducts, response.products || []);

      // PASO 7: Registrar los SKUs de productos mostrados en el contexto
      for (const product of uniqueProducts) {
        if (product.sku && !context.shownProductSkus!.includes(product.sku)) {
          context.shownProductSkus!.push(product.sku);
        }
      }
      logger.debug('Productos mostrados en sesión', { 
        skuCount: context.shownProductSkus!.length,
        sessionId: context.sessionId 
      });

      // PASO 8: Agregar indicador de fallback
      const fallbackMessage = response.message + '\n\n_Nota: Modo básico activo. Algunas funciones conversacionales limitadas._';

      logger.info('Respuesta generada con SimpleFallbackRecognizer', { sessionId: context.sessionId });

      return {
        ...response,
        message: fallbackMessage,
        products: uniqueProducts.length > 0 ? uniqueProducts : undefined,
        productContext,
        usingFallback: true
      };
    } catch (error) {
      logger.error('Error crítico en sistema de fallback', { 
        error: error instanceof Error ? error.message : error,
        sessionId: context.sessionId 
      });

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

  /**
   * Elimina productos duplicados basándose en el SKU
   */
  private deduplicateProducts(ragProducts: any[], responseProducts: any[]): any[] {
    const seenSkus = new Set<string>();
    const uniqueProducts: any[] = [];

    // Primero agregar productos del RAG (tienen prioridad)
    for (const product of ragProducts) {
      if (product.sku && !seenSkus.has(product.sku)) {
        seenSkus.add(product.sku);
        uniqueProducts.push(product);
      }
    }

    // Luego agregar productos de la respuesta que no estén duplicados
    for (const product of responseProducts) {
      if (product.sku && !seenSkus.has(product.sku)) {
        seenSkus.add(product.sku);
        uniqueProducts.push(product);
      }
    }

    return uniqueProducts;
  }
}
