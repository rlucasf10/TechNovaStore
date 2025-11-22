/**
 * Tests para ProcessWithOllama
 */

import { ProcessWithOllama } from './ProcessWithOllama';
import { OllamaAdapter } from '../shared/clients/OllamaAdapter';
import { RetrieveProductsRAG } from '../retrieve-products-rag/RetrieveProductsRAG';
import { SimpleFallbackRecognizer } from '../shared/recognizers/SimpleFallbackRecognizer';
import { ChatContext } from '../shared/types';

describe('ProcessWithOllama', () => {
  let processWithOllama: ProcessWithOllama;
  let mockOllamaAdapter: jest.Mocked<OllamaAdapter>;
  let mockRetrieveProductsRAG: jest.Mocked<RetrieveProductsRAG>;
  let mockSimpleFallbackRecognizer: jest.Mocked<SimpleFallbackRecognizer>;
  let mockContext: ChatContext;

  beforeEach(() => {
    mockOllamaAdapter = {
      generateResponse: jest.fn()
    } as any;

    mockRetrieveProductsRAG = {
      execute: jest.fn()
    } as any;

    mockSimpleFallbackRecognizer = {
      recognizeIntent: jest.fn()
    } as any;

    processWithOllama = new ProcessWithOllama(
      mockOllamaAdapter,
      mockRetrieveProductsRAG,
      mockSimpleFallbackRecognizer
    );

    mockContext = {
      sessionId: 'test-session',
      previousIntents: [],
      userPreferences: { categories: [], brands: [] },
      conversationHistory: []
    };
  });

  describe('execute', () => {
    it('debe procesar mensaje con Ollama correctamente', async () => {
      // Arrange
      const mockProducts = [
        {
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
        }
      ];

      mockRetrieveProductsRAG.execute.mockResolvedValue(mockProducts);
      mockOllamaAdapter.generateResponse.mockResolvedValue('Aquí tienes laptops disponibles');
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.8,
        entities: {}
      });

      // Act
      const result = await processWithOllama.execute('Busco un laptop', mockContext);

      // Assert
      expect(mockRetrieveProductsRAG.execute).toHaveBeenCalledWith('Busco un laptop');
      expect(mockOllamaAdapter.generateResponse).toHaveBeenCalled();
      expect(result.message).toBe('Aquí tienes laptops disponibles');
      expect(result.products).toEqual(mockProducts);
      expect(result.confidence).toBe(0.9);
      expect(result.usingFallback).toBe(false);
    });

    it('debe incluir productos en el contexto del prompt', async () => {
      // Arrange
      const mockProducts = [
        {
          sku: 'TEST-001',
          name: 'Laptop Test',
          brand: 'TestBrand',
          price: 999,
          availability: true,
          category: 'laptop',
          subcategory: 'gaming',
          description: 'Test laptop',
          specifications: { ram: '16GB' },
          images: [],
          keywords: [],
          features: [],
          compatibilities: [],
          useCases: []
        }
      ];

      mockRetrieveProductsRAG.execute.mockResolvedValue(mockProducts);
      mockOllamaAdapter.generateResponse.mockResolvedValue('Respuesta');
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.8,
        entities: {}
      });

      // Act
      await processWithOllama.execute('Busco laptop', mockContext);

      // Assert
      const callArgs = mockOllamaAdapter.generateResponse.mock.calls[0][0];
      const systemMessage = callArgs.find((msg: any) => msg.role === 'system');
      expect(systemMessage).toBeDefined();
      expect(systemMessage!.content).toContain('PRODUCTOS DISPONIBLES');
      expect(systemMessage!.content).toContain('Laptop Test');
      expect(systemMessage!.content).toContain('€999');
    });

    it('debe incluir historial conversacional en el prompt', async () => {
      // Arrange
      mockContext.conversationHistory = [
        { role: 'user', content: 'Hola', timestamp: new Date() },
        { role: 'assistant', content: 'Hola, ¿en qué puedo ayudarte?', timestamp: new Date() }
      ];

      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockOllamaAdapter.generateResponse.mockResolvedValue('Respuesta');
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'greeting',
        confidence: 0.9,
        entities: {}
      });

      // Act
      await processWithOllama.execute('Busco laptop', mockContext);

      // Assert
      const callArgs = mockOllamaAdapter.generateResponse.mock.calls[0][0];
      expect(callArgs.length).toBeGreaterThan(2); // system + history + current message
      expect(callArgs.some((msg: any) => msg.content === 'Hola')).toBe(true);
    });

    it('debe manejar caso sin productos disponibles', async () => {
      // Arrange
      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockOllamaAdapter.generateResponse.mockResolvedValue('No encontré productos');
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.7,
        entities: {}
      });

      // Act
      const result = await processWithOllama.execute('Busco algo raro', mockContext);

      // Assert
      expect(result.products).toBeUndefined();
      expect(result.message).toBe('No encontré productos');
    });

    it('debe propagar errores de Ollama', async () => {
      // Arrange
      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockOllamaAdapter.generateResponse.mockRejectedValue(new Error('Ollama timeout'));
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.8,
        entities: {}
      });

      // Act & Assert
      await expect(processWithOllama.execute('test', mockContext)).rejects.toThrow('Ollama timeout');
    });

    it('debe reconocer intención para compatibilidad', async () => {
      // Arrange
      mockRetrieveProductsRAG.execute.mockResolvedValue([]);
      mockOllamaAdapter.generateResponse.mockResolvedValue('Respuesta');
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.85,
        entities: { PRODUCT_TYPE: 'laptop' }
      });

      // Act
      const result = await processWithOllama.execute('Busco laptop', mockContext);

      // Assert
      expect(mockSimpleFallbackRecognizer.recognizeIntent).toHaveBeenCalledWith('Busco laptop');
      expect(result.intent.name).toBe('product_search');
      expect(result.intent.entities.PRODUCT_TYPE).toBe('laptop');
    });

    it('debe formatear correctamente el contexto de productos con especificaciones', async () => {
      // Arrange
      const mockProducts = [
        {
          sku: 'TEST-001',
          name: 'Laptop Gaming',
          brand: 'TestBrand',
          price: 1299.99,
          availability: true,
          category: 'laptop',
          subcategory: 'gaming',
          description: 'Laptop gaming de alto rendimiento con las mejores especificaciones del mercado',
          specifications: {
            processor: 'Intel Core i7',
            ram: '16GB DDR4',
            storage: '512GB SSD',
            gpu: 'NVIDIA RTX 3060'
          },
          images: [],
          keywords: [],
          features: [],
          compatibilities: [],
          useCases: []
        }
      ];

      mockRetrieveProductsRAG.execute.mockResolvedValue(mockProducts);
      mockOllamaAdapter.generateResponse.mockResolvedValue('Respuesta');
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.8,
        entities: {}
      });

      // Act
      await processWithOllama.execute('Busco laptop gaming', mockContext);

      // Assert
      const callArgs = mockOllamaAdapter.generateResponse.mock.calls[0][0];
      const systemMessage = callArgs.find((msg: any) => msg.role === 'system');
      expect(systemMessage).toBeDefined();
      expect(systemMessage!.content).toContain('Laptop Gaming');
      expect(systemMessage!.content).toContain('€1299.99');
      expect(systemMessage!.content).toContain('En stock');
      expect(systemMessage!.content).toContain('Intel Core i7');
      expect(systemMessage!.content).toContain('16GB DDR4');
    });

    it('debe truncar descripciones largas en el contexto', async () => {
      // Arrange
      const longDescription = 'A'.repeat(300);
      const mockProducts = [
        {
          sku: 'TEST-001',
          name: 'Producto',
          brand: 'Marca',
          price: 100,
          availability: true,
          category: 'test',
          subcategory: 'test',
          description: longDescription,
          specifications: {},
          images: [],
          keywords: [],
          features: [],
          compatibilities: [],
          useCases: []
        }
      ];

      mockRetrieveProductsRAG.execute.mockResolvedValue(mockProducts);
      mockOllamaAdapter.generateResponse.mockResolvedValue('Respuesta');
      mockSimpleFallbackRecognizer.recognizeIntent.mockReturnValue({
        name: 'product_search',
        confidence: 0.8,
        entities: {}
      });

      // Act
      await processWithOllama.execute('test', mockContext);

      // Assert
      const callArgs = mockOllamaAdapter.generateResponse.mock.calls[0][0];
      const systemMessage = callArgs.find((msg: any) => msg.role === 'system');
      expect(systemMessage).toBeDefined();
      expect(systemMessage!.content).toContain('...');
      // Verificar que la descripción fue truncada (el mensaje completo incluye más que solo la descripción)
      expect(systemMessage!.content.length).toBeLessThan(longDescription.length + 1000);
    });
  });
});
