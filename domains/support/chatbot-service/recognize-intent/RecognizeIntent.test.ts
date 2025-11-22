/**
 * Tests para RecognizeIntent
 */

import { RecognizeIntent } from './RecognizeIntent';
import { SimpleFallbackRecognizer } from '../shared/recognizers/SimpleFallbackRecognizer';

describe('RecognizeIntent', () => {
  let recognizeIntent: RecognizeIntent;
  let mockRecognizer: jest.Mocked<SimpleFallbackRecognizer>;

  beforeEach(() => {
    mockRecognizer = {
      recognizeIntent: jest.fn()
    } as any;

    recognizeIntent = new RecognizeIntent(mockRecognizer);
  });

  describe('execute', () => {
    it('debe reconocer intención de saludo', () => {
      // Arrange
      mockRecognizer.recognizeIntent.mockReturnValue({
        name: 'greeting',
        confidence: 0.95,
        entities: {}
      });

      // Act
      const result = recognizeIntent.execute('Hola');

      // Assert
      expect(mockRecognizer.recognizeIntent).toHaveBeenCalledWith('Hola');
      expect(result.name).toBe('greeting');
      expect(result.confidence).toBe(0.95);
      expect(result.entities).toEqual({});
    });

    it('debe reconocer intención de búsqueda de productos con entidades', () => {
      // Arrange
      mockRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.85,
        entities: {
          PRODUCT_TYPE: 'laptop',
          BRAND: 'dell'
        }
      });

      // Act
      const result = recognizeIntent.execute('Busco laptop Dell');

      // Assert
      expect(result.name).toBe('product_search');
      expect(result.confidence).toBe(0.85);
      expect(result.entities.PRODUCT_TYPE).toBe('laptop');
      expect(result.entities.BRAND).toBe('dell');
    });

    it('debe reconocer intención de despedida', () => {
      // Arrange
      mockRecognizer.recognizeIntent.mockReturnValue({
        name: 'goodbye',
        confidence: 0.9,
        entities: {}
      });

      // Act
      const result = recognizeIntent.execute('Adiós');

      // Assert
      expect(result.name).toBe('goodbye');
      expect(result.confidence).toBe(0.9);
    });

    it('debe reconocer intención de información de producto', () => {
      // Arrange
      mockRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_info',
        confidence: 0.8,
        entities: {
          PRODUCT_TYPE: 'laptop'
        }
      });

      // Act
      const result = recognizeIntent.execute('¿Cuánto cuesta este laptop?');

      // Assert
      expect(result.name).toBe('product_info');
      expect(result.confidence).toBe(0.8);
      expect(result.entities.PRODUCT_TYPE).toBe('laptop');
    });

    it('debe reconocer intención de comparación de precios', () => {
      // Arrange
      mockRecognizer.recognizeIntent.mockReturnValue({
        name: 'price_comparison',
        confidence: 0.88,
        entities: {
          PRODUCT_TYPE: 'laptop'
        }
      });

      // Act
      const result = recognizeIntent.execute('Compara precios de laptops');

      // Assert
      expect(result.name).toBe('price_comparison');
      expect(result.confidence).toBe(0.88);
    });

    it('debe reconocer intención de consulta de pedido', () => {
      // Arrange
      mockRecognizer.recognizeIntent.mockReturnValue({
        name: 'order_inquiry',
        confidence: 0.92,
        entities: {
          ORDER_NUMBER: '12345'
        }
      });

      // Act
      const result = recognizeIntent.execute('¿Dónde está mi pedido 12345?');

      // Assert
      expect(result.name).toBe('order_inquiry');
      expect(result.confidence).toBe(0.92);
      expect(result.entities.ORDER_NUMBER).toBe('12345');
    });

    it('debe reconocer intención de solicitud de soporte', () => {
      // Arrange
      mockRecognizer.recognizeIntent.mockReturnValue({
        name: 'support_request',
        confidence: 0.87,
        entities: {}
      });

      // Act
      const result = recognizeIntent.execute('Necesito ayuda');

      // Assert
      expect(result.name).toBe('support_request');
      expect(result.confidence).toBe(0.87);
    });

    it('debe reconocer intención desconocida con baja confianza', () => {
      // Arrange
      mockRecognizer.recognizeIntent.mockReturnValue({
        name: 'unknown',
        confidence: 0.3,
        entities: {}
      });

      // Act
      const result = recognizeIntent.execute('asdfghjkl');

      // Assert
      expect(result.name).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('debe extraer múltiples entidades correctamente', () => {
      // Arrange
      mockRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.85,
        entities: {
          PRODUCT_TYPE: 'laptop',
          BRAND: 'dell',
          PRICE_MENTION: '1000'
        }
      });

      // Act
      const result = recognizeIntent.execute('Busco laptop Dell de menos de 1000 euros');

      // Assert
      expect(result.entities.PRODUCT_TYPE).toBe('laptop');
      expect(result.entities.BRAND).toBe('dell');
      expect(result.entities.PRICE_MENTION).toBe('1000');
    });
  });

  describe('getAvailableIntents', () => {
    it('debe retornar lista de intenciones disponibles', () => {
      // Act
      const intents = recognizeIntent.getAvailableIntents();

      // Assert
      expect(intents).toBeInstanceOf(Array);
      expect(intents.length).toBeGreaterThan(0);
      expect(intents).toContain('greeting');
      expect(intents).toContain('product_search');
      expect(intents).toContain('goodbye');
      expect(intents).toContain('unknown');
    });

    it('debe incluir todas las intenciones principales', () => {
      // Act
      const intents = recognizeIntent.getAvailableIntents();

      // Assert
      const expectedIntents = [
        'greeting',
        'goodbye',
        'product_search',
        'product_info',
        'price_comparison',
        'product_recommendation',
        'order_inquiry',
        'support_request',
        'unknown'
      ];

      expectedIntents.forEach(intent => {
        expect(intents).toContain(intent);
      });
    });
  });

  describe('isValidIntent', () => {
    it('debe retornar true para intenciones válidas', () => {
      // Act & Assert
      expect(recognizeIntent.isValidIntent('greeting')).toBe(true);
      expect(recognizeIntent.isValidIntent('product_search')).toBe(true);
      expect(recognizeIntent.isValidIntent('goodbye')).toBe(true);
      expect(recognizeIntent.isValidIntent('unknown')).toBe(true);
    });

    it('debe retornar false para intenciones inválidas', () => {
      // Act & Assert
      expect(recognizeIntent.isValidIntent('invalid_intent')).toBe(false);
      expect(recognizeIntent.isValidIntent('not_an_intent')).toBe(false);
      expect(recognizeIntent.isValidIntent('')).toBe(false);
    });

    it('debe ser case-sensitive', () => {
      // Act & Assert
      expect(recognizeIntent.isValidIntent('GREETING')).toBe(false);
      expect(recognizeIntent.isValidIntent('Greeting')).toBe(false);
      expect(recognizeIntent.isValidIntent('greeting')).toBe(true);
    });
  });

  describe('getIntentDescription', () => {
    it('debe retornar descripción para intención de saludo', () => {
      // Act
      const description = recognizeIntent.getIntentDescription('greeting');

      // Assert
      expect(description).toBe('Saludo inicial del usuario');
    });

    it('debe retornar descripción para intención de búsqueda de productos', () => {
      // Act
      const description = recognizeIntent.getIntentDescription('product_search');

      // Assert
      expect(description).toBe('Búsqueda de productos');
    });

    it('debe retornar descripción para intención de despedida', () => {
      // Act
      const description = recognizeIntent.getIntentDescription('goodbye');

      // Assert
      expect(description).toBe('Despedida del usuario');
    });

    it('debe retornar descripción para intención desconocida', () => {
      // Act
      const description = recognizeIntent.getIntentDescription('unknown');

      // Assert
      expect(description).toBe('Intención no reconocida');
    });

    it('debe retornar mensaje por defecto para intención no definida', () => {
      // Act
      const description = recognizeIntent.getIntentDescription('invalid_intent');

      // Assert
      expect(description).toBe('Descripción no disponible');
    });

    it('debe tener descripciones para todas las intenciones disponibles', () => {
      // Arrange
      const intents = recognizeIntent.getAvailableIntents();

      // Act & Assert
      intents.forEach(intent => {
        const description = recognizeIntent.getIntentDescription(intent);
        expect(description).toBeDefined();
        expect(description).not.toBe('');
        expect(description).not.toBe('Descripción no disponible');
      });
    });
  });
});
