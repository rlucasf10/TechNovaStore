/**
 * Tests para AnalyzeMarket
 */

import { AnalyzeMarket, MarketAnalysis } from './AnalyzeMarket';
import { PriceComparator } from '../shared/pricing/PriceComparator';

describe('AnalyzeMarket', () => {
  let analyzeMarket: AnalyzeMarket;
  let mockPriceComparator: jest.Mocked<PriceComparator>;

  beforeEach(() => {
    mockPriceComparator = {
      analyzeMarket: jest.fn(),
    } as any;

    analyzeMarket = new AnalyzeMarket(mockPriceComparator);
  });

  describe('execute', () => {
    const mockResult: MarketAnalysis = {
      sku: 'TEST-001',
      average_market_price: 100,
      lowest_market_price: 90,
      highest_market_price: 110,
      price_volatility: 0.1,
      market_position: 'competitive',
      recommended_price: 95,
      confidence_score: 0.85,
    };

    it('debe analizar el mercado correctamente con SKU válido', async () => {
      mockPriceComparator.analyzeMarket.mockResolvedValue(mockResult);

      const result = await analyzeMarket.execute('TEST-001');

      expect(result).toEqual(mockResult);
      expect(mockPriceComparator.analyzeMarket).toHaveBeenCalledWith('TEST-001');
    });

    it('debe lanzar error si no se proporciona SKU', async () => {
      await expect(analyzeMarket.execute('')).rejects.toThrow('SKU is required');
    });

    it('debe propagar errores del price comparator', async () => {
      const error = new Error('Market analysis failed');
      mockPriceComparator.analyzeMarket.mockRejectedValue(error);

      await expect(analyzeMarket.execute('TEST-001')).rejects.toThrow('Market analysis failed');
    });

    it('debe manejar SKUs con diferentes formatos', async () => {
      mockPriceComparator.analyzeMarket.mockResolvedValue(mockResult);

      await analyzeMarket.execute('SKU-123-ABC-XYZ');

      expect(mockPriceComparator.analyzeMarket).toHaveBeenCalledWith('SKU-123-ABC-XYZ');
    });

    it('debe llamar al comparator exactamente una vez', async () => {
      mockPriceComparator.analyzeMarket.mockResolvedValue(mockResult);

      await analyzeMarket.execute('TEST-001');

      expect(mockPriceComparator.analyzeMarket).toHaveBeenCalledTimes(1);
    });

    it('debe manejar diferentes posiciones de mercado', async () => {
      const positions: Array<'competitive' | 'premium' | 'budget'> = ['competitive', 'premium', 'budget'];

      for (const position of positions) {
        const positionResult: MarketAnalysis = {
          ...mockResult,
          market_position: position,
        };

        mockPriceComparator.analyzeMarket.mockResolvedValue(positionResult);

        const result = await analyzeMarket.execute('TEST-001');

        expect(result.market_position).toBe(position);
      }
    });

    it('debe retornar análisis con todos los campos', async () => {
      mockPriceComparator.analyzeMarket.mockResolvedValue(mockResult);

      const result = await analyzeMarket.execute('TEST-001');

      expect(result.sku).toBe('TEST-001');
      expect(result.average_market_price).toBe(100);
      expect(result.lowest_market_price).toBe(90);
      expect(result.highest_market_price).toBe(110);
      expect(result.price_volatility).toBe(0.1);
      expect(result.market_position).toBe('competitive');
      expect(result.recommended_price).toBe(95);
      expect(result.confidence_score).toBe(0.85);
    });

    it('debe manejar alta volatilidad de precios', async () => {
      const highVolatilityResult: MarketAnalysis = {
        ...mockResult,
        price_volatility: 0.5,
      };

      mockPriceComparator.analyzeMarket.mockResolvedValue(highVolatilityResult);

      const result = await analyzeMarket.execute('TEST-001');

      expect(result.price_volatility).toBeGreaterThan(0.3);
    });

    it('debe manejar baja confianza en el análisis', async () => {
      const lowConfidenceResult: MarketAnalysis = {
        ...mockResult,
        confidence_score: 0.3,
      };

      mockPriceComparator.analyzeMarket.mockResolvedValue(lowConfidenceResult);

      const result = await analyzeMarket.execute('TEST-001');

      expect(result.confidence_score).toBeLessThan(0.5);
    });

    it('debe manejar rango de precios amplio', async () => {
      const wideRangeResult: MarketAnalysis = {
        ...mockResult,
        lowest_market_price: 50,
        highest_market_price: 200,
        average_market_price: 125,
      };

      mockPriceComparator.analyzeMarket.mockResolvedValue(wideRangeResult);

      const result = await analyzeMarket.execute('TEST-001');

      expect(result.highest_market_price - result.lowest_market_price).toBe(150);
    });
  });
});
