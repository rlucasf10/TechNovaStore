/**
 * Caso de uso: Reconocer intención del usuario
 * 
 * Este caso de uso identifica la intención del mensaje del usuario:
 * 1. Analiza el texto del mensaje
 * 2. Identifica la intención (greeting, product_search, etc.)
 * 3. Extrae entidades relevantes (categorías, marcas, etc.)
 * 4. Retorna la intención con nivel de confianza
 */

import { SimpleFallbackRecognizer, SimpleFallbackIntent } from '../shared/recognizers/SimpleFallbackRecognizer';
import { Intent } from '../shared/types';

export class RecognizeIntent {
  private recognizer: SimpleFallbackRecognizer;

  constructor(recognizer: SimpleFallbackRecognizer) {
    this.recognizer = recognizer;
  }

  /**
   * Reconoce la intención del mensaje del usuario
   * 
   * @param userMessage Mensaje del usuario
   * @returns Intención reconocida con entidades y confianza
   */
  execute(userMessage: string): Intent {
    console.log('Reconociendo intención del mensaje:', userMessage);

    // Usar SimpleFallbackRecognizer para reconocer la intención
    const intent = this.recognizer.recognizeIntent(userMessage);

    console.log(`Intención reconocida: ${intent.name} (confianza: ${intent.confidence})`);
    console.log('Entidades extraídas:', intent.entities);

    return {
      name: intent.name,
      confidence: intent.confidence,
      entities: intent.entities
    };
  }

  /**
   * Obtiene las intenciones disponibles en el sistema
   */
  getAvailableIntents(): string[] {
    return [
      'greeting',
      'goodbye',
      'product_search',
      'product_info',
      'price_comparison',
      'product_recommendation',
      'order_inquiry',
      'order_status',
      'shipping_info',
      'payment_info',
      'support_request',
      'unknown'
    ];
  }

  /**
   * Verifica si una intención es válida
   */
  isValidIntent(intentName: string): boolean {
    return this.getAvailableIntents().includes(intentName);
  }

  /**
   * Obtiene la descripción de una intención
   */
  getIntentDescription(intentName: string): string {
    const descriptions: { [key: string]: string } = {
      'greeting': 'Saludo inicial del usuario',
      'goodbye': 'Despedida del usuario',
      'product_search': 'Búsqueda de productos',
      'product_info': 'Solicitud de información sobre un producto',
      'price_comparison': 'Comparación de precios entre productos',
      'product_recommendation': 'Solicitud de recomendaciones de productos',
      'order_inquiry': 'Consulta sobre un pedido',
      'order_status': 'Consulta del estado de un pedido',
      'shipping_info': 'Información sobre envíos',
      'payment_info': 'Información sobre métodos de pago',
      'support_request': 'Solicitud de soporte técnico',
      'unknown': 'Intención no reconocida'
    };

    return descriptions[intentName] || 'Descripción no disponible';
  }
}
