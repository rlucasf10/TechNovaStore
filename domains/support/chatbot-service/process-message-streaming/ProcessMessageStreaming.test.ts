/**
 * Tests para ProcessMessageStreaming
 */

import { ProcessMessageStreaming } from './ProcessMessageStreaming';
import { OllamaAdapter } from '../shared/clients/OllamaAdapter';
import { RetrieveProductsRAG } from '../retrieve-products-rag/RetrieveProductsRAG';
import { SimpleFallbackRecognizer } from '../shared/recognizers/SimpleFallbackRecognizer';
import { ChatContext } from '../shared/types';
import { ProductInfo } from '../shared/knowledge/ProductKnowledgeBase';

describe('ProcessMessageStreaming', () => {
  let processMessageStreaming: ProcessMessageStreaming;
  let mockOllamaAdapter: jest.Mocked<OllamaAdapter>;
  let mockRetrieveProductsRAG: jest.Mocked<RetrieveProductsRAG>;
  let mockSimpleFallbackRecognizer: jest.Mocked<SimpleFallbackRecognizer>;
  let mockContext: ChatContext;

  const mockProduct: ProductInfo = {
    sku: 'TEST-001',
    name: 'Laptop Test',
    category: 'laptop',
    subcategory: 'gaming',
    brand: 'TestBrand',
    description: 'Test description',
    specifications: {},
    price: 999,
    availability: true,
    images: [],
    keywords: [],
    features: [],
    compatibilities: [],
    useCases: []
  };

  beforeEach(() => {
    mockOllamaAdapter = {
      generateStreamingResponse: jest.fn()
    } as any;

    mockRetrieveProductsRAG = {
      execute: jest.fn()
    } as any;

    mockSimpleFallbackRecognizer = {
      recognizeIntent: jest.fn()
    } as any;

    processMessageStreaming = new ProcessMessageStreaming(
      mockOllamaAdapter,
      mockRetrieveProductsRAG,
      mockSimpleFallbackRecognizer
    );

    mockContext = {
      sessionId: 'test-session',
      userId: 'test-user',
      previousIntents: [],
      userPreferences: {
        categories: [],
        brands: []
      },
      conversationHistory: [],
      lastProductQuery: undefined,
      lastProducts: undefined
    };
  });

  describe('execute', () => {
    it('debe procesar mensaje con streaming correctamente', async () => {
      // Arrange
      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => {
        chunks.push(chunk);
      });

      mockRetrieveProductsRAG.execute.mockResolvedValue([mockProduct]);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.8,
        entities: { PRODUCT_TYPE: 'laptop' }
      });

      mockOllamaAdapter.generateStreamingResponse.mockImplementation(
        async (messages, callback) => {
          callback('Hola, ');
          callback('aquí están ');
          callback('los productos.');
        }
      );

      // Act
      const result = await processMessageStreaming.execute(
        'Busco laptop',
        mockContext,
        onChunk
      );

      // Assert
      expect(mockRetrieveProductsRAG.execute).toHaveBeenCalledWith('Busco laptop');
      expect(mockOllamaAdapter.generateStreamingResponse).toHaveBeenCalled();
      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(chunks).toEqual(['Hola, ', 'aquí están ', 'los productos.']);
      expect(result.intent.name).toBe('product_search');
      expect(result.products).toHaveLength(1);
      expect(result.confidence).toBe(0.9);
    });

    it('debe incluir productos en metadata cuando se recuperan', async () => {
      // Arrange
      const onChunk = jest.fn();
      mockRetrieveProductsRAG.execute.mockResolvedValue([mockProduct]);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.8,
        entities: {}
      });
      mockOllamaAdapter.generateStreamingResponse.mockImplementation(
        async (messages, callback) => {
          callback('Respuesta');
        }
      );

      // Act
      const result = await processMessageStreaming.execute(
        'Busco laptop',
        mockContext,
        onChunk
      );

      // Assert
      expect(result.products).toBeDefined();
      expect(result.products).toHaveLength(1);
      expect(result.products![0].sku).toBe('TEST-001');
    });

    it('debe no incluir productos en metadata cuando no se recuperan', async () => {
      // Arrange
      const onChunk = jest.fn();
      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'greeting',
        confidence: 0.9,
        entities: {}
      });
      mockOllamaAdapter.generateStreamingResponse.mockImplementation(
        async (messages, callback) => {
          callback('Hola');
        }
      );

      // Act
      const result = await processMessageStreaming.execute(
        'Hola',
        mockContext,
        onChunk
      );

      // Assert
      expect(result.products).toBeUndefined();
    });

    it('debe incluir historial conversacional en el prompt', async () => {
      // Arrange
      const onChunk = jest.fn();
      mockContext.conversationHistory = [
        {
          role: 'user',
          content: 'Mensaje anterior',
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: 'Respuesta anterior',
          timestamp: new Date()
        }
      ];

      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'greeting',
        confidence: 0.9,
        entities: {}
      });
      mockOllamaAdapter.generateStreamingResponse.mockImplementation(
        async (messages, callback) => {
          callback('Respuesta');
        }
      );

      // Act
      await processMessageStreaming.execute(
        'Nuevo mensaje',
        mockContext,
        onChunk
      );

      // Assert
      expect(mockOllamaAdapter.generateStreamingResponse).toHaveBeenCalled();
      const callArgs = mockOllamaAdapter.generateStreamingResponse.mock.calls[0];
      const messages = callArgs[0];
      
      // Debe incluir: system prompt + 2 mensajes de historial + mensaje actual
      expect(messages.length).toBeGreaterThanOrEqual(3);
    });

    it('debe propagar errores cuando falla Ollama', async () => {
      // Arrange
      const onChunk = jest.fn();
      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'greeting',
        confidence: 0.9,
        entities: {}
      });
      mockOllamaAdapter.generateStreamingResponse.mockRejectedValue(
        new Error('Ollama error')
      );

      // Act & Assert
      await expect(
        processMessageStreaming.execute('Hola', mockContext, onChunk)
      ).rejects.toThrow('Ollama error');
    });

    it('debe formatear correctamente el contexto de productos', async () => {
      // Arrange
      const onChunk = jest.fn();
      const multipleProducts = [
        mockProduct,
        { ...mockProduct, sku: 'TEST-002', name: 'Laptop 2', price: 1299 }
      ];

      mockRetrieveProductsRAG.execute.mockResolvedValue(multipleProducts);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.8,
        entities: {}
      });

      let systemPromptContent = '';
      mockOllamaAdapter.generateStreamingResponse.mockImplementation(
        async (messages, callback) => {
          systemPromptContent = messages[0].content;
          callback('Respuesta');
        }
      );

      // Act
      await processMessageStreaming.execute(
        'Busco laptop',
        mockContext,
        onChunk
      );

      // Assert
      expect(systemPromptContent).toContain('PRODUCTOS DISPONIBLES');
      expect(systemPromptContent).toContain('Laptop Test');
      expect(systemPromptContent).toContain('Laptop 2');
      expect(systemPromptContent).toContain('€999.00');
      expect(systemPromptContent).toContain('€1299.00');
    });

    it('debe reconocer la intención del mensaje', async () => {
      // Arrange
      const onChunk = jest.fn();
      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.85,
        entities: { PRODUCT_TYPE: 'laptop', BRAND: 'dell' }
      });
      mockOllamaAdapter.generateStreamingResponse.mockImplementation(
        async (messages, callback) => {
          callback('Respuesta');
        }
      );

      // Act
      const result = await processMessageStreaming.execute(
        'Busco laptop Dell',
        mockContext,
        onChunk
      );

      // Assert
      expect(mockSimpleFallbackRecognizer.recognizeIntent).toHaveBeenCalledWith(
        'Busco laptop Dell'
      );
      expect(result.intent.name).toBe('product_search');
      expect(result.intent.entities.PRODUCT_TYPE).toBe('laptop');
      expect(result.intent.entities.BRAND).toBe('dell');
    });

    it('debe emitir chunks en el orden correcto', async () => {
      // Arrange
      const chunks: string[] = [];
      const onChunk = (chunk: string) => {
        chunks.push(chunk);
      };

      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'greeting',
        confidence: 0.9,
        entities: {}
      });

      const expectedChunks = ['Chunk 1', 'Chunk 2', 'Chunk 3', 'Chunk 4'];
      mockOllamaAdapter.generateStreamingResponse.mockImplementation(
        async (messages, callback) => {
          for (const chunk of expectedChunks) {
            callback(chunk);
          }
        }
      );

      // Act
      await processMessageStreaming.execute(
        'Hola',
        mockContext,
        onChunk
      );

      // Assert
      expect(chunks).toEqual(expectedChunks);
    });
  });
});
