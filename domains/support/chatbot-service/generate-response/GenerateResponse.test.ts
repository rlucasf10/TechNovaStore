/**
 * Tests para GenerateResponse
 */

import { GenerateResponse } from './GenerateResponse';
import { ProductKnowledgeBase } from '../shared/knowledge/ProductKnowledgeBase';
import { NLPProcessor } from '../shared/nlp/NLPProcessor';
import { ChatContext, Intent } from '../shared/types';

describe('GenerateResponse', () => {
  let generateResponse: GenerateResponse;
  let mockKnowledgeBase: jest.Mocked<ProductKnowledgeBase>;
  let mockNLPProcessor: jest.Mocked<NLPProcessor>;
  let mockContext: ChatContext;

  const mockProduct = {
    sku: 'TEST-001',
    name: 'Laptop Test',
    brand: 'TestBrand',
    price: 999,
    availability: true,
    category: 'laptop',
    subcategory: 'gaming',
    description: 'Test laptop',
    specifications: {},
    images: [],
    keywords: [],
    features: [],
    compatibilities: [],
    useCases: []
  };

  beforeEach(() => {
    mockKnowledgeBase = {
      searchProducts: jest.fn(),
      searchByText: jest.fn(),
      getRecommendations: jest.fn()
    } as any;

    mockNLPProcessor = {
      extractKeywords: jest.fn()
    } as any;

    generateResponse = new GenerateResponse(mockKnowledgeBase, mockNLPProcessor);

    mockContext = {
      sessionId: 'test-session',
      previousIntents: [],
      userPreferences: { categories: [], brands: [] },
      conversationHistory: []
    };
  });

  describe('execute - greeting', () => {
    it('debe generar respuesta de saludo', async () => {
      // Arrange
      const intent: Intent = { name: 'greeting', confidence: 0.9, entities: {} };

      // Act
      const result = await generateResponse.execute(intent, 'Hola', mockContext);

      // Assert
      expect(result.message).toContain('Hola');
      expect(result.intent.name).toBe('greeting');
      expect(result.suggestedActions).toBeDefined();
      expect(result.suggestedActions?.length).toBeGreaterThan(0);
    });
  });

  describe('execute - product_search', () => {
    it('debe buscar productos por categoría y marca', async () => {
      // Arrange
      const intent: Intent = {
        name: 'product_search',
        confidence: 0.8,
        entities: { PRODUCT_TYPE: 'laptop', BRAND: 'dell' }
      };
      mockKnowledgeBase.searchProducts.mockResolvedValue([mockProduct]);

      // Act
      const result = await generateResponse.execute(intent, 'Busco laptop Dell', mockContext);

      // Assert
      expect(mockKnowledgeBase.searchProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'laptop',
          brand: 'dell',
          availability: true
        }),
        5
      );
      expect(result.products).toEqual([mockProduct]);
      expect(result.message).toContain('encontrado');
    });

    it('debe usar búsqueda por texto cuando no hay entidades', async () => {
      // Arrange
      const intent: Intent = { name: 'product_search', confidence: 0.7, entities: {} };
      mockNLPProcessor.extractKeywords.mockResolvedValue(['laptop', 'gaming']);
      mockKnowledgeBase.searchByText.mockResolvedValue([mockProduct]);

      // Act
      const result = await generateResponse.execute(intent, 'laptop gaming', mockContext);

      // Assert
      expect(mockNLPProcessor.extractKeywords).toHaveBeenCalledWith('laptop gaming');
      expect(mockKnowledgeBase.searchByText).toHaveBeenCalled();
      expect(result.products).toEqual([mockProduct]);
    });

    it('debe retornar mensaje apropiado cuando no hay productos', async () => {
      // Arrange
      const intent: Intent = { name: 'product_search', confidence: 0.8, entities: {} };
      mockNLPProcessor.extractKeywords.mockResolvedValue(['test']);
      mockKnowledgeBase.searchByText.mockResolvedValue([]);

      // Act
      const result = await generateResponse.execute(intent, 'test', mockContext);

      // Assert
      expect(result.products).toBeUndefined();
      expect(result.message).toContain('No he encontrado');
    });
  });

  describe('execute - product_info', () => {
    it('debe retornar información detallada del producto', async () => {
      // Arrange
      const intent: Intent = {
        name: 'product_info',
        confidence: 0.8,
        entities: { PRODUCT_NAME: 'Laptop Test' }
      };
      mockKnowledgeBase.searchByText.mockResolvedValue([mockProduct]);

      // Act
      const result = await generateResponse.execute(intent, 'Info de Laptop Test', mockContext);

      // Assert
      expect(result.message).toContain('Laptop Test');
      expect(result.message).toContain('€999');
      expect(result.message).toContain('TestBrand');
      expect(result.products).toEqual([mockProduct]);
    });
  });

  describe('execute - price_comparison', () => {
    it('debe comparar precios de múltiples productos', async () => {
      // Arrange
      const intent: Intent = { name: 'price_comparison', confidence: 0.8, entities: {} };
      const products = [
        { ...mockProduct, sku: 'TEST-001', name: 'Laptop A', price: 999 },
        { ...mockProduct, sku: 'TEST-002', name: 'Laptop B', price: 1299 }
      ];
      mockNLPProcessor.extractKeywords.mockResolvedValue(['laptop']);
      mockKnowledgeBase.searchByText.mockResolvedValue(products);

      // Act
      const result = await generateResponse.execute(intent, 'Comparar laptops', mockContext);

      // Assert
      expect(result.message).toContain('comparación');
      expect(result.message).toContain('€999');
      expect(result.message).toContain('€1299');
      expect(result.products).toHaveLength(2);
    });

    it('debe manejar caso con un solo producto', async () => {
      // Arrange
      const intent: Intent = { name: 'price_comparison', confidence: 0.8, entities: {} };
      mockNLPProcessor.extractKeywords.mockResolvedValue(['laptop']);
      mockKnowledgeBase.searchByText.mockResolvedValue([mockProduct]);

      // Act
      const result = await generateResponse.execute(intent, 'Precio laptop', mockContext);

      // Assert
      expect(result.message).toContain('precio actual');
      expect(result.message).toContain('€999');
    });
  });

  describe('execute - product_recommendation', () => {
    it('debe generar recomendaciones basadas en preferencias', async () => {
      // Arrange
      const intent: Intent = {
        name: 'product_recommendation',
        confidence: 0.8,
        entities: { PRODUCT_TYPE: 'laptop' }
      };
      const recommendations = [
        {
          product: mockProduct,
          score: 0.9,
          reason: 'Coincide con tus preferencias'
        }
      ];
      mockKnowledgeBase.getRecommendations.mockResolvedValue(recommendations);

      // Act
      const result = await generateResponse.execute(intent, 'Recomiéndame laptop', mockContext);

      // Assert
      expect(mockKnowledgeBase.getRecommendations).toHaveBeenCalled();
      expect(result.message).toContain('recomiendo');
      expect(result.recommendations).toEqual(recommendations);
    });

    it('debe solicitar más información cuando no hay preferencias', async () => {
      // Arrange
      const intent: Intent = { name: 'product_recommendation', confidence: 0.8, entities: {} };
      mockKnowledgeBase.getRecommendations.mockResolvedValue([]);

      // Act
      const result = await generateResponse.execute(intent, 'Recomiéndame algo', mockContext);

      // Assert
      expect(result.message).toContain('mejores recomendaciones');
      expect(result.recommendations).toBeUndefined();
    });
  });

  describe('execute - order_status', () => {
    it('debe solicitar número de pedido cuando no se proporciona', async () => {
      // Arrange
      const intent: Intent = { name: 'order_status', confidence: 0.8, entities: {} };

      // Act
      const result = await generateResponse.execute(intent, 'Estado de mi pedido', mockContext);

      // Assert
      expect(result.message).toContain('número de pedido');
    });

    it('debe responder con información cuando se proporciona número', async () => {
      // Arrange
      const intent: Intent = {
        name: 'order_status',
        confidence: 0.8,
        entities: { ORDER_NUMBER: '12345' }
      };

      // Act
      const result = await generateResponse.execute(intent, 'Pedido 12345', mockContext);

      // Assert
      expect(result.message).toContain('12345');
      expect(result.message).toContain('verificar');
    });
  });

  describe('execute - shipping_info', () => {
    it('debe retornar información de envío', async () => {
      // Arrange
      const intent: Intent = { name: 'shipping_info', confidence: 0.8, entities: {} };

      // Act
      const result = await generateResponse.execute(intent, 'Info de envío', mockContext);

      // Assert
      expect(result.message).toContain('envío');
      expect(result.message).toContain('€50');
      expect(result.message).toContain('24-48h');
    });
  });

  describe('execute - payment_info', () => {
    it('debe retornar métodos de pago disponibles', async () => {
      // Arrange
      const intent: Intent = { name: 'payment_info', confidence: 0.8, entities: {} };

      // Act
      const result = await generateResponse.execute(intent, 'Métodos de pago', mockContext);

      // Assert
      expect(result.message).toContain('pago');
      expect(result.message).toContain('PayPal');
      expect(result.message).toContain('Tarjeta');
    });
  });

  describe('execute - support_request', () => {
    it('debe ofrecer opciones de soporte', async () => {
      // Arrange
      const intent: Intent = { name: 'support_request', confidence: 0.8, entities: {} };

      // Act
      const result = await generateResponse.execute(intent, 'Necesito ayuda', mockContext);

      // Assert
      expect(result.message).toContain('ayuda');
      expect(result.suggestedActions).toContain('Crear ticket de soporte');
    });
  });

  describe('execute - goodbye', () => {
    it('debe generar respuesta de despedida', async () => {
      // Arrange
      const intent: Intent = { name: 'goodbye', confidence: 0.9, entities: {} };

      // Act
      const result = await generateResponse.execute(intent, 'Adiós', mockContext);

      // Assert
      expect(result.message).toContain('Gracias');
    });
  });

  describe('execute - unknown', () => {
    it('debe ofrecer ayuda cuando no entiende la intención', async () => {
      // Arrange
      const intent: Intent = { name: 'unknown', confidence: 0.3, entities: {} };

      // Act
      const result = await generateResponse.execute(intent, 'asdfghjkl', mockContext);

      // Assert
      expect(result.message).toContain('No estoy seguro');
      expect(result.suggestedActions).toBeDefined();
    });
  });
});
