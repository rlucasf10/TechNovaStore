import { Product, IProduct } from '../shared/types/Product';
import { logger } from '../shared/infrastructure/logger';

/**
 * Caso de uso: Limpiar campos de campaña de un producto
 * 
 * Este caso de uso permite al Campaign Manager Service remover
 * los campos relacionados con campañas promocionales de un producto,
 * restaurándolo a su estado normal sin campaña.
 */

export class ClearProductCampaign {
  /**
   * Limpia los campos de campaña de un producto
   * 
   * @param productId - ID del producto a limpiar
   * @returns Producto actualizado o null si no existe
   */
  static async execute(productId: string): Promise<IProduct | null> {
    try {
      // Validar que el producto existe
      const product = await Product.findById(productId);
      
      if (!product) {
        logger.warn(`Product not found for campaign cleanup: ${productId}`);
        return null;
      }

      // Limpiar campos de campaña
      product.in_campaign = false;
      product.campaign_id = undefined;
      product.campaign_price = undefined;
      product.original_price = undefined;
      product.discount_percentage = undefined;

      // Guardar cambios
      await product.save();

      logger.info(`Product campaign fields cleared: ${product.sku}`, {
        productId: product._id,
      });

      return product;
    } catch (error) {
      logger.error('Error clearing product campaign fields', {
        productId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
