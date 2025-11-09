import { NLPProcessor, NLPResult } from '../nlp/NLPProcessor';

export interface Intent {
  name: string;
  confidence: number;
  entities: { [key: string]: string };
}

export interface IntentPattern {
  intent: string;
  patterns: string[];
  keywords: string[];
  entities?: string[];
}

export class IntentRecognizer {
  private nlpProcessor: NLPProcessor;
  private intentPatterns: IntentPattern[];

  constructor() {
    this.nlpProcessor = new NLPProcessor();
    this.intentPatterns = this.loadIntentPatterns();
  }

  /**
   * Load predefined intent patterns for e-commerce chatbot
   */
  private loadIntentPatterns(): IntentPattern[] {
    return [
      // Product search intents
      {
        intent: 'product_search',
        patterns: [
          'busco un producto',
          'quiero comprar',
          'necesito encontrar',
          'estoy buscando',
          'me interesa'
        ],
        keywords: ['buscar', 'producto', 'comprar', 'encontrar', 'necesitar'],
        entities: ['PRODUCT_TYPE', 'BRAND', 'PRICE_RANGE']
      },
      
      // Product information intents
      {
        intent: 'product_info',
        patterns: [
          'información del producto',
          'características técnicas',
          'especificaciones',
          'detalles del producto',
          'qué incluye'
        ],
        keywords: ['información', 'características', 'especificaciones', 'detalles', 'incluir'],
        entities: ['PRODUCT_NAME', 'FEATURE']
      },
      
      // Price comparison intents
      {
        intent: 'price_comparison',
        patterns: [
          'comparar precios',
          'mejor precio',
          'más barato',
          'oferta',
          'descuento'
        ],
        keywords: ['precio', 'comparar', 'barato', 'oferta', 'descuento'],
        entities: ['PRODUCT_NAME', 'PRICE_RANGE']
      },
      
      // Order status intents
      {
        intent: 'order_status',
        patterns: [
          'estado del pedido',
          'seguimiento',
          'dónde está mi pedido',
          'cuándo llega',
          'tracking'
        ],
        keywords: ['pedido', 'seguimiento', 'estado', 'tracking', 'llegar'],
        entities: ['ORDER_NUMBER', 'DATE']
      },
      
      // Shipping information intents
      {
        intent: 'shipping_info',
        patterns: [
          'información de envío',
          'costos de envío',
          'tiempo de entrega',
          'métodos de envío',
          'cuánto cuesta el envío'
        ],
        keywords: ['envío', 'entrega', 'costo', 'tiempo', 'método'],
        entities: ['LOCATION', 'SHIPPING_METHOD']
      },
      
      // Payment intents
      {
        intent: 'payment_info',
        patterns: [
          'métodos de pago',
          'formas de pagar',
          'aceptan tarjeta',
          'pago seguro',
          'transferencia'
        ],
        keywords: ['pago', 'tarjeta', 'transferencia', 'método', 'seguro'],
        entities: ['PAYMENT_METHOD']
      },
      
      // Support intents
      {
        intent: 'support_request',
        patterns: [
          'necesito ayuda',
          'tengo un problema',
          'soporte técnico',
          'contactar',
          'hablar con humano'
        ],
        keywords: ['ayuda', 'problema', 'soporte', 'contactar', 'humano'],
        entities: ['ISSUE_TYPE']
      },
      
      // Greeting intents
      {
        intent: 'greeting',
        patterns: [
          'hola',
          'buenos días',
          'buenas tardes',
          'buenas noches',
          'saludos'
        ],
        keywords: ['hola', 'buenos', 'buenas', 'saludos'],
        entities: []
      },
      
      // Goodbye intents
      {
        intent: 'goodbye',
        patterns: [
          'adiós',
          'hasta luego',
          'nos vemos',
          'chao',
          'gracias'
        ],
        keywords: ['adiós', 'luego', 'vemos', 'chao', 'gracias'],
        entities: []
      },
      
      // Recommendation intents
      {
        intent: 'product_recommendation',
        patterns: [
          'recomiéndame',
          'qué me sugieres',
          'cuál es mejor',
          'opciones similares',
          'alternativas'
        ],
        keywords: ['recomendar', 'sugerir', 'mejor', 'similar', 'alternativa'],
        entities: ['PRODUCT_TYPE', 'BUDGET', 'USE_CASE']
      }
    ];
  }

  /**
   * Recognize intent from user input
   */
  async recognizeIntent(text: string): Promise<Intent> {
    try {
      const nlpResult = await this.nlpProcessor.processText(text);
      const textLower = text.toLowerCase();
      
      let bestMatch: Intent = {
        name: 'unknown',
        confidence: 0,
        entities: {}
      };

      // Calculate confidence for each intent pattern
      for (const pattern of this.intentPatterns) {
        let confidence = 0;
        
        // Check for exact pattern matches
        for (const patternText of pattern.patterns) {
          if (textLower.includes(patternText.toLowerCase())) {
            confidence += 0.8;
            break;
          }
        }
        
        // Check for keyword matches
        const keywordMatches = pattern.keywords.filter(keyword => 
          nlpResult.lemmas.includes(keyword) || textLower.includes(keyword)
        );
        
        if (keywordMatches.length > 0) {
          confidence += (keywordMatches.length / pattern.keywords.length) * 0.6;
        }
        
        // Normalize confidence
        confidence = Math.min(confidence, 1.0);
        
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            name: pattern.intent,
            confidence,
            entities: this.extractEntitiesForIntent(nlpResult, pattern)
          };
        }
      }

      // Set minimum confidence threshold
      if (bestMatch.confidence < 0.3) {
        bestMatch.name = 'unknown';
        bestMatch.confidence = 0;
      }

      return bestMatch;
    } catch (error) {
      console.error('Error recognizing intent:', error);
      return {
        name: 'error',
        confidence: 0,
        entities: {}
      };
    }
  }

  /**
   * Extract entities specific to the recognized intent
   */
  private extractEntitiesForIntent(nlpResult: NLPResult, pattern: IntentPattern): { [key: string]: string } {
    const entities: { [key: string]: string } = {};
    
    // Extract named entities from spaCy
    for (const entity of nlpResult.entities) {
      switch (entity.label) {
        case 'PERSON':
          entities['PERSON'] = entity.text;
          break;
        case 'ORG':
          entities['BRAND'] = entity.text;
          break;
        case 'MONEY':
          entities['PRICE'] = entity.text;
          break;
        case 'DATE':
          entities['DATE'] = entity.text;
          break;
      }
    }
    
    // Extract domain-specific entities based on keywords
    const keywords = nlpResult.keywords;
    
    // Product types
    const productTypes = ['laptop', 'móvil', 'tablet', 'auriculares', 'teclado', 'ratón', 'monitor', 'cámara'];
    const foundProductType = keywords.find(keyword => 
      productTypes.some(type => keyword.includes(type) || type.includes(keyword))
    );
    if (foundProductType) {
      entities['PRODUCT_TYPE'] = foundProductType;
    }
    
    // Brands
    const brands = ['apple', 'samsung', 'sony', 'lg', 'hp', 'dell', 'asus', 'lenovo', 'huawei'];
    const foundBrand = keywords.find(keyword => 
      brands.some(brand => keyword.toLowerCase().includes(brand) || brand.includes(keyword.toLowerCase()))
    );
    if (foundBrand) {
      entities['BRAND'] = foundBrand;
    }
    
    return entities;
  }

  /**
   * Get all available intents
   */
  getAvailableIntents(): string[] {
    return this.intentPatterns.map(pattern => pattern.intent);
  }
}