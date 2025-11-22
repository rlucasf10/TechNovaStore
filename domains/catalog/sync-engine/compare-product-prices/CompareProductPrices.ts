/**
 * Caso de Uso: Comparar Precios de Productos
 * 
 * Compara los precios de un producto específico entre diferentes proveedores.
 * Retorna información detallada de precios, disponibilidad y competidores.
 */

import { PriceComparator } from '../shared/pricing/PriceComparator';
import { PriceComparison } from '../shared/types/pricing';

export class CompareProductPrices {
  constructor(private priceComparator: PriceComparator) {}

  /**
   * Compara precios de un producto entre proveedores
   * @param sku - SKU del producto
   * @param productName - Nombre del producto
   * @returns Resultado de la comparación de precios
   */
  async execute(sku: string, productName: string): Promise<PriceComparison> {
    if (!sku || !productName) {
      throw new Error('SKU and product name are required');
    }

    console.log(`Comparing prices for product: ${productName} (SKU: ${sku})`);

    const result = await this.priceComparator.compareProductPrices(sku, productName);

    console.log(`Price comparison completed. Found ${result.providers?.length || 0} prices`);

    return result;
  }
}
