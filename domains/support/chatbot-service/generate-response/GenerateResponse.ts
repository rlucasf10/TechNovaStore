/**
 * Caso de uso: Generar respuesta basada en intención
 * 
 * Este caso de uso genera respuestas apropiadas basándose en la intención
 * reconocida del usuario. Se usa principalmente en el modo fallback.
 */

import { ChatContext, ChatResponse, Intent } from '../shared/types';
import { ProductKnowledgeBase, ProductInfo } from '../shared/knowledge/ProductKnowledgeBase';
import { NLPProcessor } from '../shared/nlp/NLPProcessor';
import { logger } from '../shared/utils/logger';

export class GenerateResponse {
  private knowledgeBase: ProductKnowledgeBase;
  private nlpProcessor: NLPProcessor;

  constructor(
    knowledgeBase: ProductKnowledgeBase,
    nlpProcessor: NLPProcessor
  ) {
    this.knowledgeBase = knowledgeBase;
    this.nlpProcessor = nlpProcessor;
  }

  /**
   * Genera respuesta basada en la intención reconocida
   */
  async execute(
    intent: Intent,
    userInput: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    let message = '';
    let products: ProductInfo[] = [];
    let recommendations: any[] = [];
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

      case 'order_inquiry':
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

  private async handleProductSearch(intent: Intent, userInput: string): Promise<{
    message: string;
    products: ProductInfo[];
    suggestedActions: string[];
  }> {
    try {
      const productType = intent.entities.PRODUCT_TYPE;
      const brand = intent.entities.BRAND;
      const priceRange = intent.entities.PRICE_MENTION;

      // Detectar si es una petición genérica sin contexto suficiente
      const isGenericRequest = this.isGenericProductRequest(userInput, intent);

      // Si es genérica, hacer preguntas primero (estrategia consultiva)
      if (isGenericRequest) {
        const message = '¡Claro! Para poder recomendarte los productos perfectos, necesito saber un poco más: 🤔\n\n' +
          '* 💰 ¿Cuál es tu presupuesto aproximado?\n' +
          '* 🎯 ¿Qué tipo de producto buscas? (laptop, monitor, periféricos, componentes, etc.)\n' +
          '* 💻 ¿Para qué lo vas a usar principalmente? (gaming, trabajo, estudio, diseño, etc.)\n' +
          '* ⭐ ¿Tienes alguna marca preferida o te da igual?\n\n' +
          'Con esta información podré recomendarte exactamente lo que necesitas. 😊';

        return {
          message,
          products: [], // NO mostrar productos aún
          suggestedActions: ['Gaming', 'Trabajo', 'Estudio', 'Creación de contenido']
        };
      }

      // Si tiene contexto suficiente, buscar productos
      let products: ProductInfo[] = [];

      if (productType || brand) {
        products = await this.knowledgeBase.searchProducts({
          category: productType,
          brand: brand,
          availability: true
        }, 5);
      } else {
        const keywords = await this.nlpProcessor.extractKeywords(userInput);
        products = await this.knowledgeBase.searchByText(keywords.join(' '), 5);
      }

      let message = '';
      if (products.length > 0) {
        // Formato estructurado con markdown
        message = `He encontrado **${products.length} producto${products.length > 1 ? 's' : ''}** que podrían interesarte:\n\n`;
        
        products.forEach((product, index) => {
          message += `* **${product.name}**\n`;
          message += `  Precio: **€${product.price.toFixed(2)}** | `;
          message += `${product.availability ? '✓ En stock' : '✗ Agotado'}\n`;
        });
        
        message += '\n¿Te gustaría más información sobre alguno de estos productos?';
      } else {
        message = 'No he encontrado productos que coincidan con tu búsqueda.\n\n¿Podrías ser más específico? Por ejemplo:\n* Tipo de producto (laptop, auriculares, teclado...)\n* Marca preferida\n* Rango de precio';
      }

      return {
        message,
        products,
        suggestedActions: ['Ver más productos', 'Filtrar por precio', 'Ver ofertas']
      };
    } catch (error) {
      logger.error('Error al manejar búsqueda de productos', { 
        error: error instanceof Error ? error.message : error, 
        userInput 
      });
      return {
        message: 'Ha ocurrido un error buscando productos. ¿Podrías intentar de nuevo?',
        products: [],
        suggestedActions: ['Intentar de nuevo', 'Ver categorías']
      };
    }
  }

  /**
   * Detecta si la petición es genérica y necesita más contexto
   */
  private isGenericProductRequest(userInput: string, intent: Intent): boolean {
    const lowerInput = userInput.toLowerCase();

    // Patrones de peticiones genéricas
    const genericPatterns = [
      /recomi[eé]ndame\s+(productos?|algo)/i,
      /qu[eé]\s+me\s+recomiendas?/i,
      /qu[eé]\s+productos?\s+tienes?/i,
      /qu[eé]\s+hay\s+disponible/i,
      /busco\s+(productos?|algo)/i,
      /quiero\s+comprar\s+algo/i,
      /mu[eé]strame\s+productos?/i,
      /ver\s+productos?/i,
      /\d+\s+productos?/i // "3 productos", "5 productos"
    ];

    const isGeneric = genericPatterns.some(pattern => pattern.test(lowerInput));

    // Si es genérica Y no tiene entidades específicas, necesita más contexto
    const hasSpecificContext = intent.entities.PRODUCT_TYPE || 
                               intent.entities.BRAND || 
                               intent.entities.PRICE_MENTION;

    return isGeneric && !hasSpecificContext;
  }

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
        const keywords = await this.nlpProcessor.extractKeywords(userInput);
        products = await this.knowledgeBase.searchByText(keywords.join(' '), 1);
      }

      let message = '';
      if (products.length > 0) {
        const product = products[0];
        message = `📱 **${product.name}**\n\n`;
        message += `**Detalles del producto:**\n`;
        message += `* 🏷️ Marca: **${product.brand}**\n`;
        message += `* 📂 Categoría: ${product.category}\n`;
        message += `* 💰 Precio: **€${product.price.toFixed(2)}**\n`;
        message += `* ${product.availability ? '✅ **En stock** - Envío en 24-48h' : '❌ Agotado temporalmente'}\n`;
        
        if (product.description) {
          const shortDesc = product.description.length > 150 
            ? product.description.substring(0, 150) + '...' 
            : product.description;
          message += `\n📝 **Descripción:**\n${shortDesc}\n`;
        }
        
        message += `\n¿Te gustaría añadirlo al carrito o necesitas más información?`;
      } else {
        message = `🔍 **Producto no encontrado**\n\nNo he encontrado información específica de ese producto.\n\n¿Podrías darme más detalles como:\n* Nombre o modelo exacto\n* Marca\n* Tipo de producto`;
      }

      return { message, products };
    } catch (error) {
      logger.error('Error al manejar información de producto', { 
        error: error instanceof Error ? error.message : error, 
        userInput 
      });
      return {
        message: 'Ha ocurrido un error obteniendo la información del producto.',
        products: []
      };
    }
  }

  private async handlePriceComparison(intent: Intent, userInput: string): Promise<{
    message: string;
    products: ProductInfo[];
  }> {
    try {
      const keywords = await this.nlpProcessor.extractKeywords(userInput);
      const products = await this.knowledgeBase.searchByText(keywords.join(' '), 3);

      let message = '';
      if (products.length > 1) {
        message = `💰 **Comparativa de Precios**\n\n`;
        
        // Ordenar por precio
        const sorted = [...products].sort((a, b) => a.price - b.price);
        const cheapest = sorted[0];
        
        sorted.forEach((product, index) => {
          const isCheapest = product.sku === cheapest.sku;
          message += `* **${product.name}**\n`;
          message += `  ${product.brand} | **€${product.price.toFixed(2)}**`;
          if (isCheapest) message += ` 🏆 _Mejor precio_`;
          message += `\n`;
        });
        
        message += `\n✅ Todos nuestros precios incluyen IVA y garantía oficial.\n`;
        message += `\n¿Te interesa alguno en particular?`;
      } else if (products.length === 1) {
        message = `💰 **Precio de ${products[0].name}**\n\n`;
        message += `**€${products[0].price.toFixed(2)}** ✅ Mejor precio garantizado\n\n`;
        message += `* Incluye IVA y garantía oficial\n`;
        message += `* Envío gratis en pedidos +€50`;
      } else {
        message = `💰 **Comparar precios**\n\nNo he encontrado productos para comparar.\n\n¿Qué productos te gustaría comparar?`;
      }

      return { message, products };
    } catch (error) {
      logger.error('Error al manejar comparación de precios', { 
        error: error instanceof Error ? error.message : error, 
        userInput 
      });
      return {
        message: 'Ha ocurrido un error comparando precios.',
        products: []
      };
    }
  }

  private async handleProductRecommendation(intent: Intent, context: ChatContext): Promise<{
    message: string;
    recommendations: any[];
  }> {
    try {
      const userPreferences = context.userPreferences || {
        categories: [],
        brands: []
      };

      if (intent.entities.PRODUCT_TYPE) {
        userPreferences.categories.push(intent.entities.PRODUCT_TYPE);
      }
      if (intent.entities.BRAND) {
        userPreferences.brands.push(intent.entities.BRAND);
      }

      const recommendations = await this.knowledgeBase.getRecommendations(userPreferences, 3);

      let message = '';
      if (recommendations.length > 0) {
        message = `⭐ **Recomendaciones para ti**\n\n`;
        message += `Basándome en tus preferencias, te sugiero:\n\n`;
        
        recommendations.forEach((rec, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
          message += `${medal} **${rec.product.name}**\n`;
          message += `   💰 **€${rec.product.price.toFixed(2)}** | ${rec.product.brand}\n`;
          message += `   💡 _${rec.reason}_\n\n`;
        });
        
        message += `¿Te gustaría más información sobre alguno?`;
      } else {
        message = `⭐ **Recomendaciones personalizadas**\n\nPara darte las mejores recomendaciones, cuéntame:\n\n* ¿Qué tipo de producto buscas?\n* ¿Cuál es tu presupuesto?\n* ¿Para qué lo vas a usar?\n\n¡Así podré encontrar lo perfecto para ti!`;
      }

      return { message, recommendations };
    } catch (error) {
      logger.error('Error al manejar recomendaciones de productos', { 
        error: error instanceof Error ? error.message : error 
      });
      return {
        message: 'Ha ocurrido un error generando recomendaciones.',
        recommendations: []
      };
    }
  }

  private handleOrderStatus(intent: Intent): string {
    const orderNumber = intent.entities.ORDER_NUMBER;

    if (orderNumber) {
      return `📦 **Consulta de pedido #${orderNumber}**

Para proteger tu información, necesito verificar tu identidad.

**Opciones disponibles:**
* Proporciona el email usado en la compra
* Accede a tu cuenta en "Mis Pedidos"
* Contacta con soporte: **soporte@technovastore.com**

¿Cómo prefieres continuar?`;
    } else {
      return `📦 **Consulta de pedido**

Para ayudarte con tu pedido, necesito el **número de pedido**.

Lo encontrarás en:
* El email de confirmación de compra
* Tu cuenta > "Mis Pedidos"
* El recibo de compra

¿Tienes el número a mano?`;
    }
  }

  private handleShippingInfo(intent: Intent): string {
    return `🚚 **Información de Envío**

**Opciones de entrega:**

* 📦 **Envío Estándar** - GRATIS en pedidos +€50
  Entrega en 3-5 días laborables

* ⚡ **Envío Express** - €5.99
  Entrega en 24-48h (productos en stock)

* 🏃 **Envío Urgente** - €9.99
  Entrega en el mismo día (pedidos antes de las 14h)

**Incluido en todos los envíos:**
✅ Seguimiento en tiempo real
✅ Seguro de envío
✅ Notificaciones por email/SMS

¿Necesitas más información sobre alguna opción?`;
  }

  private handlePaymentInfo(): string {
    return `💳 **Métodos de Pago**

**Aceptamos:**

* 💳 **Tarjetas** - Visa, Mastercard, American Express
* 🅿️ **PayPal** - Pago rápido y seguro
* 🏦 **Transferencia bancaria** - Para pedidos grandes
* 💵 **Contra reembolso** - +€3 (solo España peninsular)

**🔒 Seguridad garantizada:**
* Encriptación SSL 256-bit
* Certificación PCI DSS
* Protección antifraude

**💰 Financiación disponible:**
Compras +€200 en 3, 6 o 12 meses sin intereses

¿Tienes alguna duda sobre los pagos?`;
  }

  private handleSupportRequest(intent: Intent): string {
    const issueType = intent.entities.ISSUE_TYPE;

    let message = `🛠️ **Centro de Soporte**\n\n`;

    if (issueType) {
      message += `Veo que necesitas ayuda con **${issueType}**.\n\n`;
    }

    message += `**¿Cómo puedo ayudarte?**

* 💻 Información técnica de productos
* 📦 Estado y seguimiento de pedidos
* 💳 Problemas con pagos o facturación
* 🚚 Consultas de envío y devoluciones
* 🔧 Soporte técnico post-venta

**¿Necesitas hablar con un humano?**
Puedo crear un ticket de soporte y un agente te contactará en menos de 24h.

¿Qué opción prefieres?`;

    return message;
  }

  private handleUnknownIntent(userInput: string): string {
    return `🤔 **No estoy seguro de entenderte**

Pero no te preocupes, puedo ayudarte con muchas cosas:

* 🔍 **Buscar productos** - "Busco un portátil gaming"
* 💰 **Comparar precios** - "¿Cuánto cuesta el iPhone 15?"
* 📦 **Consultar pedidos** - "¿Dónde está mi pedido?"
* ⭐ **Recomendaciones** - "¿Qué auriculares me recomiendas?"
* 🛠️ **Soporte técnico** - "Tengo un problema con mi compra"

**Consejo:** Intenta ser específico con lo que buscas.

¿En qué puedo ayudarte?`;
  }

  private generateGreetingResponse(): string {
    const greetings = [
      `¡Hola! 👋 Soy **Nova**, tu asistente de TechNovaStore.

¿En qué puedo ayudarte hoy?
* 🔍 Buscar productos
* ⭐ Recomendaciones personalizadas
* 📦 Consultar pedidos
* 💬 Soporte técnico`,

      `¡Bienvenido a **TechNovaStore**! 🛒

Soy Nova, tu asistente virtual. Estoy aquí para ayudarte a encontrar la mejor tecnología.

¿Qué estás buscando hoy?`,

      `¡Hola! 🎉 ¿Listo para encontrar tu próximo gadget favorito?

Cuéntame qué necesitas y te ayudo a encontrarlo.`
    ];

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private generateGoodbyeResponse(): string {
    const goodbyes = [
      '¡Hasta luego! Gracias por visitar TechNovaStore. ¡Que tengas un buen día!',
      '¡Adiós! Espero haberte ayudado. No dudes en volver si necesitas algo más.',
      '¡Nos vemos! Gracias por usar nuestro asistente virtual.'
    ];

    return goodbyes[Math.floor(Math.random() * goodbyes.length)];
  }
}
