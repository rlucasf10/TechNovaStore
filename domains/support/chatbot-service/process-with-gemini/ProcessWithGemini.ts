/**
 * Process With Gemini Use Case
 * 
 * Procesa mensajes del usuario usando Google Gemini API
 */

import { GeminiAdapter, GeminiMessage } from '../shared/clients/GeminiAdapter';
import { RetrieveProductsRAG } from '../retrieve-products-rag/RetrieveProductsRAG';
import { ProductInfo, ProductKnowledgeBase } from '../shared/knowledge/ProductKnowledgeBase';
import { KeywordExtractor } from '../shared/rag/KeywordExtractor';
import { logger } from '../shared/utils/logger';

export interface ProcessWithGeminiInput {
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  systemPrompt?: string;
}

export interface ProcessWithGeminiOutput {
  response: string;
  tokensUsed?: number;
  model: string;
  products?: ProductInfo[];
}

export class ProcessWithGemini {
  private geminiAdapter: GeminiAdapter;
  private retrieveProductsRAG: RetrieveProductsRAG;

  constructor(retrieveProductsRAG?: RetrieveProductsRAG) {
    this.geminiAdapter = new GeminiAdapter();
    
    // Si no se proporciona RetrieveProductsRAG, crear uno con dependencias por defecto
    if (retrieveProductsRAG) {
      this.retrieveProductsRAG = retrieveProductsRAG;
    } else {
      const knowledgeBase = new ProductKnowledgeBase();
      const keywordExtractor = new KeywordExtractor();
      this.retrieveProductsRAG = new RetrieveProductsRAG(knowledgeBase, keywordExtractor);
    }
  }

  async execute(input: ProcessWithGeminiInput): Promise<ProcessWithGeminiOutput> {
    try {
      logger.debug('Procesando mensaje con Gemini', {
        userMessagePreview: input.userMessage.substring(0, 100),
        historyLength: input.conversationHistory.length,
      });

      // PASO 1: Detectar si el usuario realmente quiere productos
      const wantsProducts = this.detectProductIntent(input.userMessage);
      logger.debug('Detección de intención de productos', { wantsProducts });

      // PASO 2: Recuperar productos SOLO si el usuario los quiere
      let retrievedProducts: ProductInfo[] = [];
      if (wantsProducts) {
        logger.debug('Ejecutando pipeline RAG para recuperar productos');
        retrievedProducts = await this.retrieveProductsRAG.execute(input.userMessage);
        logger.debug('Productos recuperados', { count: retrievedProducts.length });
      } else {
        logger.debug('Usuario no busca productos, omitiendo RAG');
      }

      // PASO 3: Formatear contexto de productos
      const productContext = this.formatProductContext(retrievedProducts);

      // Construir el contexto del sistema si existe
      const messages: Array<{ role: string; content: string }> = [];

      // Agregar system prompt como primer mensaje del usuario si existe
      if (input.systemPrompt) {
        messages.push({
          role: 'user',
          content: input.systemPrompt,
        });
        messages.push({
          role: 'assistant',
          content: 'Entendido. Actuaré como asistente virtual de TechNovaStore siguiendo estas instrucciones.',
        });
      }

      // PASO 3: Agregar contexto de productos si hay productos relevantes
      if (retrievedProducts.length > 0) {
        messages.push({
          role: 'user',
          content: `CONTEXTO DE PRODUCTOS DISPONIBLES:\n\n${productContext}\n\nPor favor, usa esta información para responder a la siguiente pregunta del usuario.`,
        });
        messages.push({
          role: 'assistant',
          content: 'Entendido. Usaré la información de los productos disponibles para ayudar al usuario.',
        });
      }

      // Agregar historial de conversación (últimos 5 mensajes)
      const recentHistory = input.conversationHistory.slice(-5);
      messages.push(...recentHistory);

      // Agregar mensaje actual del usuario
      messages.push({
        role: 'user',
        content: input.userMessage,
      });

      // Convertir al formato de Gemini
      const geminiMessages = GeminiAdapter.convertMessages(messages);

      // Generar respuesta
      const response = await this.geminiAdapter.generateResponse(geminiMessages);

      logger.info('Respuesta de Gemini generada', {
        responseLength: response.length,
        productsIncluded: retrievedProducts.length,
      });

      return {
        response,
        model: 'gemini-2.0-flash',
        products: retrievedProducts.length > 0 ? retrievedProducts : undefined,
      };
    } catch (error) {
      logger.error('Error en ProcessWithGemini', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Detecta si el usuario realmente quiere recomendaciones de productos
   * Ahora más inteligente: solo muestra productos si hay suficiente contexto
   */
  private detectProductIntent(userMessage: string): boolean {
    const message = userMessage.toLowerCase();

    // Patrones que indican que NO quiere productos (preguntas generales)
    const noProductIntentPatterns = [
      /qu[eé]\s+es\s+technovastore/i,
      /cu[eé]ntame\s+(sobre|de)\s+technovastore/i,
      /dime\s+(sobre|de|lo\s+que\s+sepas)/i,
      /informaci[oó]n\s+(sobre|de)\s+(la\s+)?tienda/i,
      /qui[eé]n\s+(es|eres)/i,
      /hola|buenos|buenas|saludos/i,
      /env[ií]o|envios|entrega/i,
      /devoluci[oó]n|devoluciones/i,
      /garant[ií]a|garantias/i,
      /pago|pagos|m[eé]todo/i,
      /soporte|ayuda|contacto/i,
      /horario|hora|abierto/i,
      /direcci[oó]n|ubicaci[oó]n|d[oó]nde/i,
    ];

    // Primero verificar si NO quiere productos
    for (const pattern of noProductIntentPatterns) {
      if (pattern.test(message)) {
        return false;
      }
    }

    // Peticiones genéricas SIN contexto (NO mostrar productos, hacer preguntas primero)
    const genericRequestPatterns = [
      /recomi[eé]nd(ame)?\s*(\d+\s*)?(productos?|algo)?\s*(de\s+technovastore)?/i,
      /busco\s*(\d+\s*)?(productos?|algo)?$/i,
      /qu[eé]\s+me\s+recomiendas?/i,
      /qu[eé]\s+productos?\s+tienes?/i,
      /qu[eé]\s+vend[eé]is?/i,
      /qu[eé]\s+hay/i,
      /mu[eé]strame\s*\d*\s*productos?/i,
      /dame\s*\d*\s*productos?/i,
      /\d+\s+productos?\s+(de\s+)?technovastore/i,
    ];

    // Verificar si es una petición genérica SIN categoría/marca/uso específico
    const hasSpecificContext = this.hasSpecificProductContext(message);
    
    for (const pattern of genericRequestPatterns) {
      if (pattern.test(message) && !hasSpecificContext) {
        logger.debug('Petición genérica detectada, no mostrar productos');
        return false; // NO mostrar productos, el LLM hará preguntas
      }
    }

    // Patrones que indican que SÍ quiere productos (con contexto específico)
    const specificProductIntentPatterns = [
      // Peticiones con presupuesto
      /\d+\s*€|\d+\s*euros?|presupuesto\s+de\s+\d+/i,
      // Peticiones con categoría específica
      /laptop|teclado|rat[oó]n|auricular|monitor|pc|ordenador|m[oó]vil|tablet|webcam|micr[oó]fono|altavoz|impresora/i,
      // Peticiones con uso específico
      /para\s+(gaming|gamer|trabajo|oficina|estudio|dise[ñn]o|edici[oó]n|programar)/i,
      // Peticiones con marca
      /de\s+(asus|hp|dell|lenovo|logitech|razer|corsair|hyperx|apple|samsung)/i,
      // Peticiones de precio o disponibilidad
      /cu[aá]nto\s+cuesta|precio\s+de|disponible|en\s+stock/i,
      // Peticiones de comparación
      /compar|diferencia|mejor\s+que|versus|vs/i,
      // Peticiones de "otros" o "diferentes" (ya tiene contexto previo)
      /otros?\s+\d+|diferentes?|m[aá]s\s+productos?|alternativas?|opciones?/i,
      // Peticiones específicas con números
      /dame\s+\d+|muestrame\s+\d+|ens[eé][ñn]ame\s+\d+/i,
      // Ofertas y catálogo
      /ofertas?|cat[aá]logo|promoci[oó]n/i,
      // Compra directa
      /comprar|adquirir|llevar|agregar|a[ñn]adir/i,
    ];

    // Verificar si SÍ quiere productos (con contexto)
    for (const pattern of specificProductIntentPatterns) {
      if (pattern.test(message)) {
        return true;
      }
    }

    // Por defecto, no mostrar productos si no está claro
    return false;
  }

  /**
   * Verifica si el mensaje tiene contexto específico (categoría, marca, uso, presupuesto)
   */
  private hasSpecificProductContext(message: string): boolean {
    const specificContextPatterns = [
      // Categorías específicas
      /laptop|port[aá]til|teclado|rat[oó]n|mouse|auricular|monitor|pc|ordenador|m[oó]vil|tablet|webcam|micr[oó]fono|altavoz|impresora|ssd|ram|gpu|cpu|procesador|tarjeta/i,
      // Marcas
      /asus|hp|dell|lenovo|logitech|razer|corsair|hyperx|apple|samsung|sony|msi|acer|nvidia|amd|intel/i,
      // Uso específico
      /para\s+(gaming|gamer|trabajo|oficina|estudio|dise[ñn]o|edici[oó]n|programar|streaming)/i,
      // Presupuesto
      /\d+\s*€|\d+\s*euros?|presupuesto/i,
    ];

    return specificContextPatterns.some(pattern => pattern.test(message));
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

  /**
   * Verifica si Gemini está disponible
   */
  async healthCheck(): Promise<boolean> {
    return this.geminiAdapter.healthCheck();
  }
}
