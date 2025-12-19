/**
 * Tests para UseSimpleFallback
 */

import { UseSimpleFallback } from './UseSimpleFallback';
import { RetrieveProductsRAG } from '../retrieve-products-rag/RetrieveProductsRAG';
import { SimpleFallbackRecognizer } from '../shared/recognizers/SimpleFallbackRecognizer';
import { GenerateResponse } from '../generate-response/GenerateResponse';
import { ChatContext } from '../shared/types';

describe('UseSimpleFallback', () => {
  let useSimpleFallback: UseSimpleFallback;
  let mockRetrieveProductsRAG: jest.Mocked<RetrieveProductsRAG>;
  let mockSimpleFallbackRecognizer: jest.Mocked<SimpleFallbackRecognizer>;
  let mockGenerateResponse: jest.Mocked<GenerateResponse>;
  let mockContext: ChatContext;

  beforeEach(() => {
    mockRetrieveProductsRAG = {
      execute: jest.fn(),
      extractRequestedLimit: jest.fn().mockReturnValue(null)
    } as any;

    mockSimpleFallbackRecognizer = {
      recognizeIntent: jest.fn()
    } as any;

    mockGenerateResponse = {
      execute: jest.fn()
    } as any;

    useSimpleFallback = new UseSimpleFallback(
      mockRetrieveProductsRAG,
      mockSimpleFallbackRecognizer,
      mockGenerateResponse
    );

    mockContext = {
      sessionId: 'test-session',
      previousIntents: [],
      userPreferences: { categories: [], brands: [] },
      conversationHistory: [],
      shownProductSkus: []
    };
  });

  describe('execute', () => {
    it('debe procesar mensaje con sistema de fallback', async () => {
      // Arrange
      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'greeting',
        confidence: 0.8,
        entities: {}
      });
      mockGenerateResponse.execute.mockResolvedValue({
        message: '¡Hola! ¿En qué puedo ayudarte?',
        intent: { name: 'greeting', confidence: 0.8, entities: {} },
        confidence: 0.8
      });

      // Act
      const result = await useSimpleFallback.execute('Hola', mockContext);

      // Assert
      expect(mockRetrieveProductsRAG.execute).toHaveBeenCalledWith('Hola', expect.any(Object));
      expect(mockSimpleFallbackRecognizer.recognizeIntent).toHaveBeenCalledWith('Hola');
      expect(mockGenerateResponse.execute).toHaveBeenCalled();
      expect(result.usingFallback).toBe(true);
      expect(result.message).toContain('Modo básico activo');
    });

    it('debe excluir productos ya mostrados cuando el usuario pide diferentes', async () => {
      // Arrange
      mockContext.shownProductSkus = ['SKU-1', 'SKU-2'];
      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_recommendation',
        confidence: 0.8,
        entities: {}
      });
      mockGenerateResponse.execute.mockResolvedValue({
        message: 'Aquí tienes otros productos',
        intent: { name: 'product_recommendation', confidence: 0.8, entities: {} },
        confidence: 0.8
      });

      // Act
      await useSimpleFallback.execute('otros productos diferentes', mockContext);

      // Assert - Debe pasar los SKUs a excluir
      expect(mockRetrieveProductsRAG.execute).toHaveBeenCalledWith(
        'otros productos diferentes',
        expect.objectContaining({
          excludeSkus: ['SKU-1', 'SKU-2']
        })
      );
    });

    it('debe registrar los SKUs de productos mostrados en el contexto', async () => {
      // Arrange
      const mockProducts = [
        { sku: 'NEW-SKU-1', name: 'Product 1', brand: 'Brand', price: 100, availability: true, category: 'test', subcategory: 'test', description: '', specifications: {}, images: [], keywords: [], features: [], compatibilities: [], useCases: [] },
        { sku: 'NEW-SKU-2', name: 'Product 2', brand: 'Brand', price: 200, availability: true, category: 'test', subcategory: 'test', description: '', specifications: {}, images: [], keywords: [], features: [], compatibilities: [], useCases: [] }
      ];
      mockRetrieveProductsRAG.execute.mockResolvedValue(mockProducts);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.8,
        entities: {}
      });
      mockGenerateResponse.execute.mockResolvedValue({
        message: 'Productos encontrados',
        intent: { name: 'product_search', confidence: 0.8, entities: {} },
        confidence: 0.8
      });

      // Act
      await useSimpleFallback.execute('busco laptop', mockContext);

      // Assert - Los SKUs deben estar registrados
      expect(mockContext.shownProductSkus).toContain('NEW-SKU-1');
      expect(mockContext.shownProductSkus).toContain('NEW-SKU-2');
    });

    it('debe incluir productos recuperados en la respuesta', async () => {
      // Arrange
      const mockProducts = [
        {
          sku: 'TEST-001',
          name: 'Laptop',
          brand: 'TestBrand',
          price: 999,
          availability: true,
          category: 'laptop',
          subcategory: 'gaming',
          description: 'Test',
          specifications: {},
          images: [],
          keywords: [],
          features: [],
          compatibilities: [],
          useCases: []
        }
      ];

      mockRetrieveProductsRAG.execute.mockResolvedValue(mockProducts);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.7,
        entities: {}
      });
      mockGenerateResponse.execute.mockResolvedValue({
        message: 'Encontré productos',
        intent: { name: 'product_search', confidence: 0.7, entities: {} },
        products: [],
        confidence: 0.7
      });

      // Act
      const result = await useSimpleFallback.execute('Busco laptop', mockContext);

      // Assert
      expect(result.products).toEqual(mockProducts);
    });

    it('debe actualizar el contexto con la intención reconocida', async () => {
      // Arrange
      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.75,
        entities: { PRODUCT_TYPE: 'laptop' }
      });
      mockGenerateResponse.execute.mockResolvedValue({
        message: 'Respuesta',
        intent: { name: 'product_search', confidence: 0.75, entities: {} },
        confidence: 0.75
      });

      // Act
      await useSimpleFallback.execute('Busco laptop', mockContext);

      // Assert
      expect(mockContext.previousIntents).toHaveLength(1);
      expect(mockContext.previousIntents[0].name).toBe('product_search');
    });

    it('debe mantener solo las últimas 5 intenciones en el contexto', async () => {
      // Arrange
      mockContext.previousIntents = [
        { name: 'intent1', confidence: 0.8, entities: {} },
        { name: 'intent2', confidence: 0.8, entities: {} },
        { name: 'intent3', confidence: 0.8, entities: {} },
        { name: 'intent4', confidence: 0.8, entities: {} },
        { name: 'intent5', confidence: 0.8, entities: {} }
      ];

      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'intent6',
        confidence: 0.8,
        entities: {}
      });
      mockGenerateResponse.execute.mockResolvedValue({
        message: 'Respuesta',
        intent: { name: 'intent6', confidence: 0.8, entities: {} },
        confidence: 0.8
      });

      // Act
      await useSimpleFallback.execute('test', mockContext);

      // Assert
      expect(mockContext.previousIntents).toHaveLength(5);
      expect(mockContext.previousIntents[0].name).toBe('intent2');
      expect(mockContext.previousIntents[4].name).toBe('intent6');
    });

    it('debe combinar productos de RAG con productos de la respuesta', async () => {
      // Arrange
      const ragProducts = [
        {
          sku: 'RAG-001',
          name: 'Producto RAG',
          brand: 'Brand',
          price: 100,
          availability: true,
          category: 'test',
          subcategory: 'test',
          description: 'Test',
          specifications: {},
          images: [],
          keywords: [],
          features: [],
          compatibilities: [],
          useCases: []
        }
      ];

      const responseProducts = [
        {
          sku: 'RESP-001',
          name: 'Producto Response',
          brand: 'Brand',
          price: 200,
          availability: true,
          category: 'test',
          subcategory: 'test',
          description: 'Test',
          specifications: {},
          images: [],
          keywords: [],
          features: [],
          compatibilities: [],
          useCases: []
        }
      ];

      mockRetrieveProductsRAG.execute.mockResolvedValue(ragProducts);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.7,
        entities: {}
      });
      mockGenerateResponse.execute.mockResolvedValue({
        message: 'Respuesta',
        intent: { name: 'product_search', confidence: 0.7, entities: {} },
        products: responseProducts,
        confidence: 0.7
      });

      // Act
      const result = await useSimpleFallback.execute('test', mockContext);

      // Assert
      expect(result.products).toHaveLength(2);
      expect(result.products?.some(p => p.sku === 'RAG-001')).toBe(true);
      expect(result.products?.some(p => p.sku === 'RESP-001')).toBe(true);
    });

    it('debe agregar nota de modo básico al mensaje', async () => {
      // Arrange
      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'greeting',
        confidence: 0.8,
        entities: {}
      });
      mockGenerateResponse.execute.mockResolvedValue({
        message: 'Mensaje original',
        intent: { name: 'greeting', confidence: 0.8, entities: {} },
        confidence: 0.8
      });

      // Act
      const result = await useSimpleFallback.execute('Hola', mockContext);

      // Assert
      expect(result.message).toContain('Mensaje original');
      expect(result.message).toContain('Modo básico activo');
      expect(result.message).toContain('funciones conversacionales limitadas');
    });

    it('debe incluir contexto de productos formateado', async () => {
      // Arrange
      const mockProducts = [
        {
          sku: 'TEST-001',
          name: 'Laptop',
          brand: 'TestBrand',
          price: 999,
          availability: true,
          category: 'laptop',
          subcategory: 'gaming',
          description: 'Test',
          specifications: {},
          images: [],
          keywords: [],
          features: [],
          compatibilities: [],
          useCases: []
        }
      ];

      mockRetrieveProductsRAG.execute.mockResolvedValue(mockProducts);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.7,
        entities: {}
      });
      mockGenerateResponse.execute.mockResolvedValue({
        message: 'Respuesta',
        intent: { name: 'product_search', confidence: 0.7, entities: {} },
        confidence: 0.7
      });

      // Act
      const result = await useSimpleFallback.execute('test', mockContext);

      // Assert
      expect(result.productContext).toBeDefined();
      expect(result.productContext).toContain('Laptop');
      expect(result.productContext).toContain('€999');
    });

    it('debe manejar errores críticos y retornar respuesta de error', async () => {
      // Arrange
      mockRetrieveProductsRAG.execute.mockRejectedValue(new Error('Error crítico'));

      // Act
      const result = await useSimpleFallback.execute('test', mockContext);

      // Assert
      expect(result.intent.name).toBe('error');
      expect(result.confidence).toBe(0);
      expect(result.usingFallback).toBe(true);
      expect(result.message).toContain('error');
    });

    it('debe formatear contexto vacío cuando no hay productos', async () => {
      // Arrange
      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'greeting',
        confidence: 0.8,
        entities: {}
      });
      mockGenerateResponse.execute.mockResolvedValue({
        message: 'Hola',
        intent: { name: 'greeting', confidence: 0.8, entities: {} },
        confidence: 0.8
      });

      // Act
      const result = await useSimpleFallback.execute('Hola', mockContext);

      // Assert
      expect(result.productContext).toContain('No hay productos disponibles');
    });
  });
});
