/**
 * Tests para RetrieveProductsRAG
 */

import { RetrieveProductsRAG } from './RetrieveProductsRAG';
import { ProductKnowledgeBase, ProductInfo } from '../shared/knowledge/ProductKnowledgeBase';
import { KeywordExtractor } from '../shared/rag/KeywordExtractor';

describe('RetrieveProductsRAG', () => {
  let retrieveProductsRAG: RetrieveProductsRAG;
  let mockKnowledgeBase: jest.Mocked<ProductKnowledgeBase>;
  let mockKeywordExtractor: jest.Mocked<KeywordExtractor>;

  const mockProduct: ProductInfo = {
    sku: 'TEST-001',
    name: 'Laptop Test',
    category: 'laptop',
    subcategory: 'gaming',
    brand: 'TestBrand',
    description: 'Test laptop description',
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
    mockKnowledgeBase = {
      searchProducts: jest.fn(),
      searchByText: jest.fn()
    } as any;

    mockKeywordExtractor = {
      extractKeywords: jest.fn()
    } as any;

    retrieveProductsRAG = new RetrieveProductsRAG(
      mockKnowledgeBase,
      mockKeywordExtractor
    );
  });

  describe('extractRequestedLimit', () => {
    it('debe extraer el número de productos solicitados', () => {
      expect(retrieveProductsRAG.extractRequestedLimit('recomiendame 4 productos')).toBe(4);
      expect(retrieveProductsRAG.extractRequestedLimit('dame 3 opciones')).toBe(3);
      expect(retrieveProductsRAG.extractRequestedLimit('muestrame 5 alternativas')).toBe(5);
      expect(retrieveProductsRAG.extractRequestedLimit('otros 2 productos')).toBe(2);
      expect(retrieveProductsRAG.extractRequestedLimit('top 10 laptops')).toBe(10);
    });

    it('debe retornar null si no hay número', () => {
      expect(retrieveProductsRAG.extractRequestedLimit('busco laptop')).toBeNull();
      expect(retrieveProductsRAG.extractRequestedLimit('recomiendame algo')).toBeNull();
    });

    it('debe limitar entre 1 y 10', () => {
      expect(retrieveProductsRAG.extractRequestedLimit('dame 0 productos')).toBeNull();
      expect(retrieveProductsRAG.extractRequestedLimit('dame 15 productos')).toBeNull();
    });
  });

  describe('execute', () => {
    it('debe recuperar productos por categoría y marca', async () => {
      // Arrange
      mockKeywordExtractor.extractKeywords.mockReturnValue({
        categories: ['laptop'],
        brands: ['dell'],
        technicalSpecs: {},
        generalKeywords: [],
        normalizedText: 'busco laptop dell'
      });
      mockKnowledgeBase.searchProducts.mockResolvedValue([mockProduct]);

      // Act
      const result = await retrieveProductsRAG.execute('Busco laptop Dell');

      // Assert
      expect(mockKeywordExtractor.extractKeywords).toHaveBeenCalledWith('Busco laptop Dell');
      expect(mockKnowledgeBase.searchProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'laptop',
          brand: 'dell',
          availability: true
        }),
        expect.any(Number)
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockProduct);
    });

    it('debe recuperar productos solo por categoría si no hay marca', async () => {
      // Arrange
      mockKeywordExtractor.extractKeywords.mockReturnValue({
        categories: ['laptop'],
        brands: [],
        technicalSpecs: {},
        generalKeywords: [],
        normalizedText: 'busco laptop'
      });
      mockKnowledgeBase.searchProducts.mockResolvedValue([mockProduct]);

      // Act
      const result = await retrieveProductsRAG.execute('Busco laptop');

      // Assert
      expect(mockKnowledgeBase.searchProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'laptop',
          availability: true
        }),
        expect.any(Number)
      );
      expect(result).toHaveLength(1);
    });

    it('debe usar búsqueda por texto como fallback', async () => {
      // Arrange
      mockKeywordExtractor.extractKeywords.mockReturnValue({
        categories: [],
        brands: [],
        technicalSpecs: {},
        generalKeywords: ['laptop', 'gaming'],
        normalizedText: 'laptop gaming'
      });
      mockKnowledgeBase.searchByText.mockResolvedValue([mockProduct]);

      // Act
      const result = await retrieveProductsRAG.execute('laptop gaming');

      // Assert
      expect(mockKnowledgeBase.searchByText).toHaveBeenCalledWith(
        expect.stringContaining('laptop'),
        expect.any(Number)
      );
      expect(result).toHaveLength(1);
    });

    it('debe eliminar productos duplicados', async () => {
      // Arrange
      const duplicateProduct = { ...mockProduct };
      mockKeywordExtractor.extractKeywords.mockReturnValue({
        categories: ['laptop'],
        brands: [],
        technicalSpecs: {},
        generalKeywords: [],
        normalizedText: 'laptop'
      });
      mockKnowledgeBase.searchProducts.mockResolvedValue([
        mockProduct,
        duplicateProduct,
        mockProduct
      ]);

      // Act
      const result = await retrieveProductsRAG.execute('laptop');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].sku).toBe('TEST-001');
    });

    it('debe limitar resultados al número solicitado por el usuario', async () => {
      // Arrange
      const manyProducts = Array.from({ length: 10 }, (_, i) => ({
        ...mockProduct,
        sku: `TEST-${i}`,
        name: `Product ${i}`
      }));
      mockKeywordExtractor.extractKeywords.mockReturnValue({
        categories: ['laptop'],
        brands: [],
        technicalSpecs: {},
        generalKeywords: [],
        normalizedText: 'dame 3 laptops'
      });
      mockKnowledgeBase.searchProducts.mockResolvedValue(manyProducts);

      // Act - Usuario pide 3 productos
      const result = await retrieveProductsRAG.execute('dame 3 laptops');

      // Assert
      expect(result).toHaveLength(3);
    });

    it('debe usar límite por defecto de 5 si no se especifica', async () => {
      // Arrange
      const manyProducts = Array.from({ length: 10 }, (_, i) => ({
        ...mockProduct,
        sku: `TEST-${i}`,
        name: `Product ${i}`
      }));
      mockKeywordExtractor.extractKeywords.mockReturnValue({
        categories: ['laptop'],
        brands: [],
        technicalSpecs: {},
        generalKeywords: [],
        normalizedText: 'laptop'
      });
      mockKnowledgeBase.searchProducts.mockResolvedValue(manyProducts);

      // Act
      const result = await retrieveProductsRAG.execute('laptop');

      // Assert
      expect(result).toHaveLength(5);
    });

    it('debe excluir productos por SKU cuando se especifica', async () => {
      // Arrange
      const products = [
        { ...mockProduct, sku: 'SKU-1', name: 'Product 1' },
        { ...mockProduct, sku: 'SKU-2', name: 'Product 2' },
        { ...mockProduct, sku: 'SKU-3', name: 'Product 3' },
      ];
      mockKeywordExtractor.extractKeywords.mockReturnValue({
        categories: ['laptop'],
        brands: [],
        technicalSpecs: {},
        generalKeywords: [],
        normalizedText: 'laptop'
      });
      mockKnowledgeBase.searchProducts.mockResolvedValue(products);

      // Act - Excluir SKU-1 y SKU-2
      const result = await retrieveProductsRAG.execute('laptop', {
        excludeSkus: ['SKU-1', 'SKU-2']
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].sku).toBe('SKU-3');
    });

    it('debe ordenar productos con disponibilidad primero', async () => {
      // Arrange
      const availableProduct = { ...mockProduct, sku: 'AVAILABLE', availability: true, price: 1000 };
      const unavailableProduct = { ...mockProduct, sku: 'UNAVAILABLE', availability: false, price: 500 };
      
      mockKeywordExtractor.extractKeywords.mockReturnValue({
        categories: ['laptop'],
        brands: [],
        technicalSpecs: {},
        generalKeywords: [],
        normalizedText: 'laptop'
      });
      mockKnowledgeBase.searchProducts.mockResolvedValue([
        unavailableProduct,
        availableProduct
      ]);

      // Act
      const result = await retrieveProductsRAG.execute('laptop');

      // Assert
      expect(result[0].sku).toBe('AVAILABLE');
      expect(result[1].sku).toBe('UNAVAILABLE');
    });

    it('debe retornar array vacío en caso de error', async () => {
      // Arrange
      mockKeywordExtractor.extractKeywords.mockImplementation(() => {
        throw new Error('Error en extracción');
      });

      // Act
      const result = await retrieveProductsRAG.execute('test');

      // Assert
      expect(result).toEqual([]);
    });

    it('debe manejar múltiples categorías y marcas', async () => {
      // Arrange
      mockKeywordExtractor.extractKeywords.mockReturnValue({
        categories: ['laptop', 'tablet'],
        brands: ['dell', 'hp'],
        technicalSpecs: {},
        generalKeywords: [],
        normalizedText: 'laptop o tablet dell o hp'
      });
      mockKnowledgeBase.searchProducts.mockResolvedValue([mockProduct]);

      // Act
      const result = await retrieveProductsRAG.execute('laptop o tablet Dell o HP');

      // Assert
      expect(mockKnowledgeBase.searchProducts).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
