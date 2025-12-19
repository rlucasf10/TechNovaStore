/**
 * Caso de Uso: Actualizar Precio Dinámico
 * 
 * Actualiza el precio de un producto de forma dinámica basándose en:
 * - Precios de la competencia
 * - Demanda del producto
 * - Nivel de inventario
 * - Reglas de pricing configuradas
 */

import { DynamicPricingEngine } from '../shared/pricing/DynamicPricingEngine';
import { createLogger } from '@technovastore/shared-config';

const logger = createLogger('sync-engine-dynamic-price');

export interface DynamicPriceUpdateResult {
  sku: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  priceChange: number;
  priceChangePercentage: number;
  changed: boolean;
  reason: string;
  appliedAt: Date;
}

export class UpdateDynamicPrice {
  constructor(private dynamicPricingEngine: DynamicPricingEngine) {}

  /**
   * Actualiza el precio dinámico de un producto
   * @param sku - SKU del producto
   * @param productName - Nombre del producto
   * @returns Resultado de la actualización de precio
   */
  async execute(sku: string, productName: string): Promise<DynamicPriceUpdateResult> {
    if (!sku || !productName) {
      throw new Error('SKU and product name are required');
    }

    logger.info('Updating dynamic price for product', { productName, sku });

    const engineResult = await this.dynamicPricingEngine.updateProductPrice(sku, productName);

    // Calcular cambio de precio y porcentaje
    const priceChange = engineResult.newPrice - engineResult.oldPrice;
    const priceChangePercentage = engineResult.oldPrice > 0 
      ? (priceChange / engineResult.oldPrice) * 100 
      : 0;

    const result: DynamicPriceUpdateResult = {
      sku,
      productName,
      oldPrice: engineResult.oldPrice,
      newPrice: engineResult.newPrice,
      priceChange,
      priceChangePercentage,
      changed: engineResult.changed,
      reason: engineResult.reason,
      appliedAt: new Date(),
    };

    if (result.changed) {
      logger.info('Price updated', { 
        oldPrice: result.oldPrice, 
        newPrice: result.newPrice, 
        changePercentage: result.priceChangePercentage.toFixed(2) 
      });
    } else {
      logger.info('Price unchanged', { price: result.newPrice, reason: result.reason });
    }

    return result;
  }
}
