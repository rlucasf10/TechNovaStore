import { NLPProcessor } from './nlp/NLPProcessor';
import { ProductKnowledgeBase, ProductInfo, ProductRecommendation } from './knowledge/ProductKnowledgeBase';
import { KeywordExtractor, ExtractedKeywords } from './rag/KeywordExtractor';
import { buildSystemPrompt } from './prompts/SystemPrompt';
import { OllamaAdapter, OllamaMessage, OllamaConfig } from './adapters/OllamaAdapter';
import { SimpleFallbackRecognizer, SimpleFallbackIntent } from './fallback/SimpleFallbackRecognizer';

/**
 * Interfaz de intención compatible con SimpleFallbackIntent
 * Usada para mantener compatibilidad con el sistema existente
 */
export interface Intent {
  name: string;
  confidence: number;
  entities: { [key: string]: string };
}

/**
 * Representa un mensaje individual en el historial de conversación
 * Usado para mantener contexto conversacional entre mensajes
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: ProductInfo[]; // Productos mencionados o recuperados en este mensaje
}

/**
 * Contexto de chat que mantiene el estado de la conversación
 * Incluye historial conversacional para soporte de LLM con memoria
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
  // Nuevos campos para gestión de contexto conversacional
  conversationHistory: ConversationMessage[]; // Últimos 10 intercambios (20 mensajes)
  lastProductQuery?: string; // Última consulta de productos del usuario
  lastProducts?: ProductInfo[]; // Últimos productos recuperados/mencionados
}

export interface ChatResponse {
  message: string;
  intent: Intent;
  products?: ProductInfo[];
  recommendations?: ProductRecommendation[];
  suggestedActions?: string[];
  confidence: number;
  productContext?: string; // Contexto de productos usado en RAG
  usingFallback?: boolean; // Indica si se está usando el sistema de fallback
}

export class NLPEngine {
  private nlpProcessor: NLPProcessor;
  private ollamaAdapter: OllamaAdapter;
  private simpleFallbackRecognizer: SimpleFallbackRecognizer;
  private knowledgeBase: ProductKnowledgeBase;
  private keywordExtractor: KeywordExtractor;
  private useOllama: boolean;

  constructor() {
    this.nlpProcessor = new NLPProcessor();
    this.knowledgeBase = new ProductKnowledgeBase();
    this.keywordExtractor = new KeywordExtractor();
    
    // Leer configuración de variables de entorno
    this.useOllama = process.env.USE_OLLAMA === 'true';
    
    // Inicializar OllamaAdapter con configuración desde variables de entorno
    const ollamaConfig: Partial<OllamaConfig> = {
      host: process.env.OLLAMA_HOST || 'http://ollama:11434',
      model: process.env.OLLAMA_MODEL || 'phi3:mini',
      timeout: parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10),
      temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '1000', 10)
    };
    
    this.ollamaAdapter = new OllamaAdapter(ollamaConfig);
    
    // Inicializar SimpleFallbackRecognizer (sistema de fallback sin Python/spaCy)
    this.simpleFallbackRecognizer = new SimpleFallbackRecognizer();
    
    console.log(`NLPEngine inicializado con USE_OLLAMA=${this.useOllama}`);
    if (this.useOllama) {
      console.log(`Ollama configurado: ${ollamaConfig.host} con modelo ${ollamaConfig.model}`);
    } else {
      console.log('Usando SimpleFallbackRecognizer (modo básico)');
    }
  }

  /**
   * Recupera productos relevantes desde ProductKnowledgeBase usando RAG
   * Extrae keywords, categorías, marcas y especificaciones del mensaje del usuario
   * y consulta la base de conocimiento de productos
   * 
   * @param userMessage Mensaje del usuario
   * @returns Array de productos relevantes (máximo 5)
   */
  async retrieveProductsForRAG(userMessage: string): Promise<ProductInfo[]> {
    try {
      // 1. Extraer keywords, categorías, marcas y especificaciones técnicas
      const extractedKeywords: ExtractedKeywords = this.keywordExtractor.extractKeywords(userMessage);
      
      console.log('Keywords extraídos para RAG:', {
        categories: extractedKeywords.categories,
        brands: extractedKeywords.brands,
        technicalSpecs: extractedKeywords.technicalSpecs,
        generalKeywords: extractedKeywords.generalKeywords.slice(0, 5) // Solo mostrar primeros 5
      });

      let products: ProductInfo[] = [];

      // 2. Estrategia de búsqueda priorizada
      
      // Estrategia 1: Búsqueda por categoría + marca (más específica)
      if (extractedKeywords.categories.length > 0 && extractedKeywords.brands.length > 0) {
        console.log('Búsqueda por categoría + marca');
        for (const category of extractedKeywords.categories) {
          for (const brand of extractedKeywords.brands) {
            const results = await this.knowledgeBase.searchProducts({
              category,
              brand,
              availability: true // Priorizar productos en stock
            }, 5);
            
            products.push(...results);
            
            if (products.length >= 5) break;
          }
          if (products.length >= 5) break;
        }
      }

      // Estrategia 2: Búsqueda solo por categoría
      if (products.length < 5 && extractedKeywords.categories.length > 0) {
        console.log('Búsqueda por categoría');
        for (const category of extractedKeywords.categories) {
          const results = await this.knowledgeBase.searchProducts({
            category,
            availability: true
          }, 5 - products.length);
          
          products.push(...results);
          
          if (products.length >= 5) break;
        }
      }

      // Estrategia 3: Búsqueda solo por marca
      if (products.length < 5 && extractedKeywords.brands.length > 0) {
        console.log('Búsqueda por marca');
        for (const brand of extractedKeywords.brands) {
          const results = await this.knowledgeBase.searchProducts({
            brand,
            availability: true
          }, 5 - products.length);
          
          products.push(...results);
          
          if (products.length >= 5) break;
        }
      }

      // Estrategia 4: Búsqueda por keywords generales (fallback)
      if (products.length < 5 && extractedKeywords.generalKeywords.length > 0) {
        console.log('Búsqueda por keywords generales');
        const searchText = extractedKeywords.generalKeywords.slice(0, 5).join(' ');
        const results = await this.knowledgeBase.searchByText(searchText, 5 - products.length);
        products.push(...results);
      }

      // 3. Eliminar duplicados (por SKU)
      const uniqueProducts = this.removeDuplicateProducts(products);

      // 4. Ordenar por relevancia: productos en stock primero, luego por precio
      const sortedProducts = this.sortProductsByRelevance(uniqueProducts);

      // 5. Limitar a 5 productos máximo
      const finalProducts = sortedProducts.slice(0, 5);

      console.log(`Productos recuperados para RAG: ${finalProducts.length}`);
      
      return finalProducts;
    } catch (error) {
      console.error('Error recuperando productos para RAG:', error);
      return [];
    }
  }

  /**
   * Elimina productos duplicados basándose en el SKU
   * @param products Array de productos que puede contener duplicados
   * @returns Array de productos únicos
   */
  private removeDuplicateProducts(products: ProductInfo[]): ProductInfo[] {
    const seenSkus = new Set<string>();
    const uniqueProducts: ProductInfo[] = [];

    for (const product of products) {
      if (!seenSkus.has(product.sku)) {
        seenSkus.add(product.sku);
        uniqueProducts.push(product);
      }
    }

    return uniqueProducts;
  }

  /**
   * Ordena productos por relevancia:
   * 1. Productos en stock primero
   * 2. Luego por precio (menor a mayor)
   * 
   * @param products Array de productos a ordenar
   * @returns Array de productos ordenados
   */
  private sortProductsByRelevance(products: ProductInfo[]): ProductInfo[] {
    return products.sort((a, b) => {
      // Prioridad 1: Disponibilidad (en stock primero)
      if (a.availability && !b.availability) return -1;
      if (!a.availability && b.availability) return 1;

      // Prioridad 2: Precio (menor a mayor)
      return a.price - b.price;
    });
  }

  /**
   * Convierte el historial de conversación al formato requerido por Ollama
   * Mapea ConversationMessage[] a OllamaMessage[] con roles correctos
   * 
   * @param conversationHistory Array de mensajes de conversación
   * @returns Array de mensajes en formato Ollama
   */
  formatConversationHistory(conversationHistory: ConversationMessage[]): OllamaMessage[] {
    return conversationHistory.map(msg => ({
      role: msg.role, // 'user' o 'assistant' - compatible con Ollama
      content: msg.content
    }));
  }

  /**
   * Formatea productos recuperados en un contexto estructurado para el LLM
   * Incluye: nombre, SKU, marca, precio, disponibilidad, descripción y especificaciones técnicas
   * 
   * @param products Array de productos a formatear
   * @returns String con contexto de productos formateado
   */
  formatProductContext(products: ProductInfo[]): string {
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
      
      // Incluir descripción (máximo 200 caracteres)
      if (product.description) {
        const truncatedDescription = product.description.length > 200 
          ? product.description.substring(0, 200) + '...' 
          : product.description;
        context += `   - Descripción: ${truncatedDescription}\n`;
      }
      
      // Incluir especificaciones técnicas clave (máximo 5)
      if (product.specifications && Object.keys(product.specifications).length > 0) {
        context += `   - Especificaciones:\n`;
        const specEntries = Object.entries(product.specifications).slice(0, 5);
        specEntries.forEach(([key, value]) => {
          // Formatear la clave para que sea más legible
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          context += `     * ${formattedKey}: ${value}\n`;
        });
      }
      
      context += "\n";
    });
    
    return context;
  }

  /**
   * Procesa el mensaje del usuario usando Ollama con pipeline RAG completo
   * Ejecuta: extraer keywords → recuperar productos → formatear contexto → llamar Ollama
   * 
   * @param userInput Mensaje del usuario
   * @param context Contexto de la conversación
   * @returns Respuesta del chatbot generada por Ollama
   */
  async processWithOllama(
    userInput: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    try {
      console.log('=== Iniciando processWithOllama ===');
      console.log('Mensaje del usuario:', userInput);

      // PASO 1: Ejecutar pipeline RAG - Extraer keywords y recuperar productos
      console.log('PASO 1: Ejecutando pipeline RAG...');
      const retrievedProducts = await this.retrieveProductsForRAG(userInput);
      console.log(`Productos recuperados: ${retrievedProducts.length}`);

      // PASO 2: Formatear contexto de productos para el prompt
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

      // 4.2: Agregar historial conversacional (últimos 10 intercambios)
      messages.push(...conversationHistory);

      // 4.3: Agregar mensaje actual del usuario
      messages.push({
        role: 'user',
        content: userInput
      });

      console.log(`Total de mensajes para Ollama: ${messages.length}`);

      // PASO 5: Llamar a OllamaAdapter.generateResponse
      console.log('PASO 5: Llamando a Ollama...');
      const responseText = await this.ollamaAdapter.generateResponse(messages);
      console.log(`Respuesta recibida de Ollama: ${responseText.length} caracteres`);

      // PASO 6: Parsear respuesta y construir ChatResponse
      console.log('PASO 6: Construyendo ChatResponse...');
      
      // Reconocer intención básica para compatibilidad con sistema existente
      const intent = this.simpleFallbackRecognizer.recognizeIntent(userInput);

      const chatResponse: ChatResponse = {
        message: responseText,
        intent,
        products: retrievedProducts.length > 0 ? retrievedProducts : undefined,
        confidence: 0.9, // Alta confianza cuando usamos Ollama
        productContext,
        usingFallback: false // No estamos usando fallback
      };

      // PASO 7: Actualizar contexto conversacional
      console.log('PASO 7: Actualizando contexto conversacional...');
      this.updateConversationContext(context, userInput, responseText, retrievedProducts);

      console.log('=== processWithOllama completado exitosamente ===');
      return chatResponse;

    } catch (error) {
      console.error('Error en processWithOllama:', error);
      throw error; // Propagar error para que se maneje en processUserInput
    }
  }

  /**
   * Actualiza el contexto conversacional con el nuevo intercambio
   * Mantiene solo los últimos 10 intercambios (20 mensajes)
   * Gestiona límite de tokens (~1000 tokens para contexto)
   * 
   * @param context Contexto de la conversación a actualizar
   * @param userMessage Mensaje del usuario
   * @param assistantMessage Respuesta del asistente
   * @param products Productos mencionados en este intercambio
   */
  private updateConversationContext(
    context: ChatContext,
    userMessage: string,
    assistantMessage: string,
    products?: ProductInfo[]
  ): void {
    // Inicializar historial si no existe
    if (!context.conversationHistory) {
      context.conversationHistory = [];
    }

    // Agregar mensaje del usuario
    context.conversationHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      products: products && products.length > 0 ? products : undefined
    });

    // Agregar respuesta del asistente
    context.conversationHistory.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date()
    });

    // Actualizar última consulta de productos
    if (products && products.length > 0) {
      context.lastProductQuery = userMessage;
      context.lastProducts = products;
    }

    // Gestionar límite de mensajes: mantener solo últimos 10 intercambios (20 mensajes)
    const MAX_MESSAGES = 20; // 10 intercambios = 10 user + 10 assistant
    if (context.conversationHistory.length > MAX_MESSAGES) {
      const messagesToRemove = context.conversationHistory.length - MAX_MESSAGES;
      context.conversationHistory.splice(0, messagesToRemove);
      console.log(`Eliminados ${messagesToRemove} mensajes antiguos del historial`);
    }

    // Gestionar límite de tokens: estimar ~4 caracteres = 1 token
    const MAX_CONTEXT_TOKENS = 1000; // Reservar 1000 tokens para respuesta del LLM
    const estimatedTokens = this.estimateTokens(context.conversationHistory);
    
    if (estimatedTokens > MAX_CONTEXT_TOKENS) {
      console.log(`Contexto excede límite de tokens (${estimatedTokens} > ${MAX_CONTEXT_TOKENS})`);
      
      // Eliminar mensajes más antiguos hasta estar bajo el límite
      while (context.conversationHistory.length > 2 && 
             this.estimateTokens(context.conversationHistory) > MAX_CONTEXT_TOKENS) {
        context.conversationHistory.shift();
      }
      
      console.log(`Historial reducido a ${context.conversationHistory.length} mensajes`);
    }

    console.log(`Contexto actualizado: ${context.conversationHistory.length} mensajes, ~${this.estimateTokens(context.conversationHistory)} tokens`);
  }

  /**
   * Estima el número de tokens en el historial conversacional
   * Usa aproximación: ~4 caracteres = 1 token
   * 
   * @param conversationHistory Historial de conversación
   * @returns Número estimado de tokens
   */
  private estimateTokens(conversationHistory: ConversationMessage[]): number {
    const totalChars = conversationHistory.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalChars / 4);
  }

  /**
   * Process user input and generate appropriate response
   * Implementa lógica de fallback automático:
   * 1. Verifica health de Ollama antes de procesar
   * 2. Usa try-catch para capturar errores de Ollama
   * 3. Llama a useSimpleFallback si Ollama falla
   * 4. Registra uso de fallback en logs
   */
  async processUserInput(
    userInput: string, 
    context: ChatContext
  ): Promise<ChatResponse> {
    // PASO 1: Verificar si USE_OLLAMA está habilitado
    if (!this.useOllama) {
      console.log('USE_OLLAMA=false, usando SimpleFallbackRecognizer directamente');
      return await this.useSimpleFallback(userInput, context);
    }

    // PASO 2: Verificar health de Ollama antes de procesar
    console.log('Verificando health de Ollama...');
    const ollamaHealthy = await this.ollamaAdapter.checkHealth();
    
    if (!ollamaHealthy) {
      console.warn('⚠️ Ollama no está disponible, usando fallback automático');
      return await this.useSimpleFallback(userInput, context);
    }

    console.log('✓ Ollama está disponible y saludable');

    // PASO 3: Intentar procesar con Ollama usando try-catch
    try {
      console.log('Intentando procesar con Ollama...');
      const response = await this.processWithOllama(userInput, context);
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
      return await this.useSimpleFallback(userInput, context);
    }
  }

  /**
   * Procesa el mensaje del usuario con streaming de respuesta (Tarea 8.2)
   * Ejecuta pipeline RAG completo y llama a Ollama con streaming
   * 
   * @param userInput Mensaje del usuario
   * @param context Contexto de la conversación
   * @param onChunk Callback que se llama por cada chunk de texto recibido
   * @returns Promise que se resuelve cuando el streaming termina
   */
  async processUserInputStreaming(
    userInput: string,
    context: ChatContext,
    onChunk: (chunk: string) => void
  ): Promise<{ intent: any; products?: any[]; confidence: number }> {
    try {
      console.log('=== Iniciando processUserInputStreaming ===');
      console.log('Mensaje del usuario:', userInput);

      // PASO 1: Ejecutar pipeline RAG - Extraer keywords y recuperar productos (sin streaming)
      console.log('PASO 1: Ejecutando pipeline RAG...');
      const retrievedProducts = await this.retrieveProductsForRAG(userInput);
      console.log(`Productos recuperados: ${retrievedProducts.length}`);

      // PASO 2: Formatear contexto de productos para el prompt
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

      // PASO 5: Llamar a OllamaAdapter.generateStreamingResponse con callback
      console.log('PASO 5: Llamando a Ollama con streaming...');
      
      let fullResponse = '';
      
      await this.ollamaAdapter.generateStreamingResponse(messages, (chunk: string) => {
        // Acumular respuesta completa
        fullResponse += chunk;
        // Emitir chunk via callback proporcionado (Requisito 4.2)
        onChunk(chunk);
      });

      console.log(`✓ Streaming completado. Respuesta total: ${fullResponse.length} caracteres`);

      // PASO 6: Reconocer intención básica para compatibilidad
      const intent = this.simpleFallbackRecognizer.recognizeIntent(userInput);

      // PASO 7: Actualizar contexto conversacional
      console.log('PASO 7: Actualizando contexto conversacional...');
      this.updateConversationContext(context, userInput, fullResponse, retrievedProducts);

      console.log('=== processUserInputStreaming completado exitosamente ===');

      // Retornar metadata (la respuesta ya fue enviada via chunks)
      return {
        intent,
        products: retrievedProducts.length > 0 ? retrievedProducts : undefined,
        confidence: 0.9
      };

    } catch (error) {
      console.error('Error en processUserInputStreaming:', error);
      throw error; // Propagar error para que se maneje en el handler de Socket.IO
    }
  }

  /**
   * Usa el sistema de fallback simple cuando Ollama no está disponible o falla
   * Implementa pipeline RAG básico + SimpleFallbackRecognizer
   * Registra uso de fallback en logs
   * 
   * @param userInput Mensaje del usuario
   * @param context Contexto de la conversación
   * @returns Respuesta del chatbot usando fallback
   */
  private async useSimpleFallback(
    userInput: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    console.log('=== Usando SimpleFallbackRecognizer (modo básico) ===');
    
    try {
      // PASO 1: Recuperar productos relevantes usando RAG
      console.log('Ejecutando pipeline RAG en modo fallback...');
      const retrievedProducts = await this.retrieveProductsForRAG(userInput);
      
      // PASO 2: Formatear contexto de productos
      const productContext = this.formatProductContext(retrievedProducts);
      
      // PASO 3: Reconocer intención del usuario usando SimpleFallbackRecognizer
      const intent = this.simpleFallbackRecognizer.recognizeIntent(userInput);
      console.log(`Intención reconocida: ${intent.name} (confianza: ${intent.confidence})`);
      
      // PASO 4: Actualizar contexto con intención actual
      context.previousIntents.push(intent);
      if (context.previousIntents.length > 5) {
        context.previousIntents.shift(); // Mantener solo las últimas 5 intenciones
      }

      // PASO 5: Generar respuesta basada en intención usando sistema de fallback
      const response = await this.generateResponse(intent, userInput, context);
      
      // PASO 6: Incluir productos recuperados en la respuesta
      const allProducts = response.products 
        ? [...new Set([...response.products, ...retrievedProducts])] // Eliminar duplicados
        : retrievedProducts;
      
      // PASO 7: Agregar indicador de fallback y mensaje informativo
      const fallbackMessage = response.message + '\n\n_Nota: Modo básico activo. Algunas funciones conversacionales limitadas._';
      
      console.log('✓ Respuesta generada con SimpleFallbackRecognizer');
      console.log('=== Fin de modo fallback ===');
      
      return {
        ...response,
        message: fallbackMessage,
        products: allProducts.length > 0 ? allProducts : undefined,
        productContext,
        usingFallback: true // IMPORTANTE: Indicar que se está usando fallback
      };
    } catch (error) {
      // Error crítico en el sistema de fallback
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
   * Generate response based on recognized intent
   */
  private async generateResponse(
    intent: Intent, 
    userInput: string, 
    context: ChatContext
  ): Promise<ChatResponse> {
    let message = '';
    let products: ProductInfo[] = [];
    let recommendations: ProductRecommendation[] = [];
    let suggestedActions: string[] = [];

    switch (intent.name) {
      case 'greeting':
        message = this.generateGreetingResponse();
        suggestedActions = [
          'Buscar productos',
          'Ver ofertas',
          'Consultar pedidos',
          'Obtener recomendaciones'
        ];
        break;

      case 'product_search':
        const searchResult = await this.handleProductSearch(intent, userInput);
        message = searchResult.message;
        products = searchResult.products;
        suggestedActions = searchResult.suggestedActions;
        break;

      case 'product_info':
        const infoResult = await this.handleProductInfo(intent, userInput);
        message = infoResult.message;
        products = infoResult.products;
        break;

      case 'price_comparison':
        const priceResult = await this.handlePriceComparison(intent, userInput);
        message = priceResult.message;
        products = priceResult.products;
        break;

      case 'product_recommendation':
        const recResult = await this.handleProductRecommendation(intent, context);
        message = recResult.message;
        recommendations = recResult.recommendations;
        break;

      case 'order_inquiry': // Nueva intención de SimpleFallbackRecognizer
      case 'order_status':
        message = this.handleOrderStatus(intent);
        suggestedActions = ['Contactar soporte', 'Ver historial de pedidos'];
        break;

      case 'shipping_info':
        message = this.handleShippingInfo(intent);
        break;

      case 'payment_info':
        message = this.handlePaymentInfo();
        break;

      case 'support_request':
        message = this.handleSupportRequest(intent);
        suggestedActions = ['Crear ticket de soporte', 'Ver FAQ', 'Contactar por email'];
        break;

      case 'goodbye':
        message = this.generateGoodbyeResponse();
        break;

      case 'unknown':
      default:
        message = this.handleUnknownIntent(userInput);
        suggestedActions = [
          'Buscar productos',
          'Ver categorías',
          'Contactar soporte',
          'Ver ofertas'
        ];
        break;
    }

    return {
      message,
      intent,
      products: products.length > 0 ? products : undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      confidence: intent.confidence
    };
  }

  /**
   * Handle product search intent
   */
  private async handleProductSearch(intent: Intent, userInput: string): Promise<{
    message: string;
    products: ProductInfo[];
    suggestedActions: string[];
  }> {
    try {
      let products: ProductInfo[] = [];
      
      // Extract search parameters from entities and user input
      const productType = intent.entities.PRODUCT_TYPE;
      const brand = intent.entities.BRAND;
      
      if (productType || brand) {
        // Search by specific criteria
        products = await this.knowledgeBase.searchProducts({
          category: productType,
          brand: brand,
          availability: true
        }, 5);
      } else {
        // Fallback to text search
        const keywords = await this.nlpProcessor.extractKeywords(userInput);
        products = await this.knowledgeBase.searchByText(keywords.join(' '), 5);
      }

      let message = '';
      if (products.length > 0) {
        message = `He encontrado ${products.length} productos que podrían interesarte:`;
      } else {
        message = 'No he encontrado productos que coincidan con tu búsqueda. ¿Podrías ser más específico?';
      }

      return {
        message,
        products,
        suggestedActions: ['Ver más productos', 'Filtrar por precio', 'Ver ofertas']
      };
    } catch (error) {
      console.error('Error handling product search:', error);
      return {
        message: 'Ha ocurrido un error buscando productos. ¿Podrías intentar de nuevo?',
        products: [],
        suggestedActions: ['Intentar de nuevo', 'Ver categorías']
      };
    }
  }

  /**
   * Handle product information intent
   */
  private async handleProductInfo(intent: Intent, userInput: string): Promise<{
    message: string;
    products: ProductInfo[];
  }> {
    try {
      const productName = intent.entities.PRODUCT_NAME;
      let products: ProductInfo[] = [];

      if (productName) {
        products = await this.knowledgeBase.searchByText(productName, 1);
      } else {
        // Try to extract product info from user input
        const keywords = await this.nlpProcessor.extractKeywords(userInput);
        products = await this.knowledgeBase.searchByText(keywords.join(' '), 1);
      }

      let message = '';
      if (products.length > 0) {
        const product = products[0];
        message = `Aquí tienes la información del ${product.name}:\n\n`;
        message += `Precio: €${product.price}\n`;
        message += `Marca: ${product.brand}\n`;
        message += `Categoría: ${product.category}\n`;
        if (product.description) {
          message += `\nDescripción: ${product.description}`;
        }
      } else {
        message = 'No he encontrado información específica del producto. ¿Podrías proporcionar más detalles?';
      }

      return { message, products };
    } catch (error) {
      console.error('Error handling product info:', error);
      return {
        message: 'Ha ocurrido un error obteniendo la información del producto.',
        products: []
      };
    }
  }

  /**
   * Handle price comparison intent
   */
  private async handlePriceComparison(intent: Intent, userInput: string): Promise<{
    message: string;
    products: ProductInfo[];
  }> {
    try {
      const keywords = await this.nlpProcessor.extractKeywords(userInput);
      const products = await this.knowledgeBase.searchByText(keywords.join(' '), 3);

      let message = '';
      if (products.length > 1) {
        message = 'Aquí tienes una comparación de precios:\n\n';
        products.forEach((product, index) => {
          message += `${index + 1}. ${product.name} - €${product.price} (${product.brand})\n`;
        });
        message += '\nTodos nuestros precios ya incluyen la mejor oferta disponible.';
      } else if (products.length === 1) {
        message = `El precio actual de ${products[0].name} es €${products[0].price}. Este es nuestro mejor precio disponible.`;
      } else {
        message = 'No he encontrado productos para comparar precios. ¿Podrías especificar qué producto te interesa?';
      }

      return { message, products };
    } catch (error) {
      console.error('Error handling price comparison:', error);
      return {
        message: 'Ha ocurrido un error comparando precios.',
        products: []
      };
    }
  }

  /**
   * Handle product recommendation intent
   */
  private async handleProductRecommendation(intent: Intent, context: ChatContext): Promise<{
    message: string;
    recommendations: ProductRecommendation[];
  }> {
    try {
      const userPreferences = context.userPreferences || {
        categories: [],
        brands: []
      };

      // Add entities from current intent to preferences
      if (intent.entities.PRODUCT_TYPE) {
        userPreferences.categories.push(intent.entities.PRODUCT_TYPE);
      }
      if (intent.entities.BRAND) {
        userPreferences.brands.push(intent.entities.BRAND);
      }

      const recommendations = await this.knowledgeBase.getRecommendations(userPreferences, 3);

      let message = '';
      if (recommendations.length > 0) {
        message = 'Basándome en tus preferencias, te recomiendo estos productos:\n\n';
        recommendations.forEach((rec, index) => {
          message += `${index + 1}. ${rec.product.name} - €${rec.product.price}\n`;
          message += `   Razón: ${rec.reason}\n\n`;
        });
      } else {
        message = 'Para darte mejores recomendaciones, ¿podrías decirme qué tipo de productos te interesan?';
      }

      return { message, recommendations };
    } catch (error) {
      console.error('Error handling product recommendation:', error);
      return {
        message: 'Ha ocurrido un error generando recomendaciones.',
        recommendations: []
      };
    }
  }

  /**
   * Handle order status intent
   */
  private handleOrderStatus(intent: Intent): string {
    const orderNumber = intent.entities.ORDER_NUMBER;
    
    if (orderNumber) {
      return `Para consultar el estado del pedido ${orderNumber}, necesito verificar tu identidad. Por favor, proporciona tu email de compra o contacta con nuestro soporte.`;
    } else {
      return 'Para consultar el estado de tu pedido, necesito el número de pedido. ¿Podrías proporcionármelo?';
    }
  }

  /**
   * Handle shipping information intent
   */
  private handleShippingInfo(intent: Intent): string {
    return `Información de envío:
    
• Envío gratuito en pedidos superiores a €50
• Entrega en 24-48h para productos en stock
• Seguimiento incluido en todos los envíos
• Envío express disponible por €5.99

¿Hay algo específico sobre el envío que te gustaría saber?`;
  }

  /**
   * Handle payment information intent
   */
  private handlePaymentInfo(): string {
    return `Métodos de pago disponibles:
    
• Tarjeta de crédito/débito (Visa, Mastercard)
• PayPal
• Transferencia bancaria
• Pago contra reembolso (+€3)

Todos los pagos son 100% seguros y están encriptados.`;
  }

  /**
   * Handle support request intent
   */
  private handleSupportRequest(intent: Intent): string {
    const issueType = intent.entities.ISSUE_TYPE;
    
    let message = 'Estoy aquí para ayudarte. ';
    
    if (issueType) {
      message += `Veo que tienes un problema relacionado con ${issueType}. `;
    }
    
    message += `Puedo ayudarte con:
    
• Información de productos
• Estado de pedidos
• Problemas de pago
• Consultas de envío

Si necesitas hablar con un humano, puedo crear un ticket de soporte para ti.`;

    return message;
  }

  /**
   * Handle unknown intent
   */
  private handleUnknownIntent(userInput: string): string {
    return `No estoy seguro de cómo ayudarte con eso. Puedo ayudarte con:
    
• Buscar productos
• Comparar precios
• Información de pedidos
• Recomendaciones personalizadas
• Soporte técnico

¿Hay algo específico en lo que pueda ayudarte?`;
  }

  /**
   * Generate greeting response
   */
  private generateGreetingResponse(): string {
    const greetings = [
      '¡Hola! Soy el asistente virtual de TechNovaStore. ¿En qué puedo ayudarte hoy?',
      '¡Bienvenido a TechNovaStore! Estoy aquí para ayudarte a encontrar los mejores productos tecnológicos.',
      '¡Hola! ¿Buscas algún producto en particular? Puedo ayudarte a encontrar lo que necesitas.'
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Generate goodbye response
   */
  private generateGoodbyeResponse(): string {
    const goodbyes = [
      '¡Hasta luego! Gracias por visitar TechNovaStore. ¡Que tengas un buen día!',
      '¡Adiós! Espero haberte ayudado. No dudes en volver si necesitas algo más.',
      '¡Nos vemos! Gracias por usar nuestro asistente virtual.'
    ];
    
    return goodbyes[Math.floor(Math.random() * goodbyes.length)];
  }

  /**
   * Get available intents for debugging
   * Retorna las intenciones disponibles en SimpleFallbackRecognizer
   */
  getAvailableIntents(): string[] {
    // Intenciones soportadas por SimpleFallbackRecognizer
    return [
      'product_search',
      'product_info',
      'greeting',
      'goodbye',
      'support_request',
      'order_inquiry',
      'unknown'
    ];
  }
  
  /**
   * Obtiene la instancia de OllamaAdapter para uso externo
   * Útil para testing y monitoreo
   */
  public getOllamaAdapter(): OllamaAdapter {
    return this.ollamaAdapter;
  }
  
  /**
   * Obtiene la instancia de SimpleFallbackRecognizer para uso externo
   * Útil para testing y monitoreo
   */
  public getSimpleFallbackRecognizer(): SimpleFallbackRecognizer {
    return this.simpleFallbackRecognizer;
  }
}