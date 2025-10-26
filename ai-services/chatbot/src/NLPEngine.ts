import { NLPProcessor } from './nlp/NLPProcessor';
import { IntentRecognizer, Intent } from './intent/IntentRecognizer';
import { ProductKnowledgeBase, ProductInfo, ProductRecommendation } from './knowledge/ProductKnowledgeBase';

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
}

export interface ChatResponse {
  message: string;
  intent: Intent;
  products?: ProductInfo[];
  recommendations?: ProductRecommendation[];
  suggestedActions?: string[];
  confidence: number;
}

export class NLPEngine {
  private nlpProcessor: NLPProcessor;
  private intentRecognizer: IntentRecognizer;
  private knowledgeBase: ProductKnowledgeBase;

  constructor() {
    this.nlpProcessor = new NLPProcessor();
    this.intentRecognizer = new IntentRecognizer();
    this.knowledgeBase = new ProductKnowledgeBase();
  }

  /**
   * Process user input and generate appropriate response
   */
  async processUserInput(
    userInput: string, 
    context: ChatContext
  ): Promise<ChatResponse> {
    try {
      // Recognize intent from user input
      const intent = await this.intentRecognizer.recognizeIntent(userInput);
      
      // Update context with current intent
      context.previousIntents.push(intent);
      if (context.previousIntents.length > 5) {
        context.previousIntents.shift(); // Keep only last 5 intents
      }

      // Generate response based on intent
      const response = await this.generateResponse(intent, userInput, context);
      
      return response;
    } catch (error) {
      console.error('Error processing user input:', error);
      return {
        message: 'Lo siento, ha ocurrido un error procesando tu consulta. ¿Podrías intentar de nuevo?',
        intent: { name: 'error', confidence: 0, entities: {} },
        confidence: 0
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
   */
  getAvailableIntents(): string[] {
    return this.intentRecognizer.getAvailableIntents();
  }
}