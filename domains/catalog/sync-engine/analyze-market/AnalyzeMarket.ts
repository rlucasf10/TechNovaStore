/**
 * Caso de Uso: Analizar Mercado
 * 
 * Analiza el mercado para un producto específico, incluyendo tendencias de precios,
 * competencia, y recomendaciones de pricing.
 */

import { PriceComparator } from '../shared/pricing/PriceComparator';
import { MarketAnalysis } from '../shared/types/pricing';

export class AnalyzeMarket {
  constructor(private priceComparator: PriceComparator) {}

  /**
   * Analiza el mercado para un producto
   * @param sku - SKU del producto a analizar
   * @returns Resultado del análisis de mercado
   */
  async execute(sku: string): Promise<MarketAnalysis> {
    if (!sku) {
      throw new Error('SKU is required');
    }

    console.log(`Analyzing market for product SKU: ${sku}`);

    const result = await this.priceComparator.analyzeMarket(sku);

    console.log(`Market analysis completed for SKU: ${sku}`);

    return result;
  }
}

// Re-export para conveniencia
export type { MarketAnalysis };
