import { Product, IProduct } from '../shared/types/Product';
import { logger } from '../shared/infrastructure/logger';

/**
 * Caso de uso: Actualizar campos de campaña de un producto
 * 
 * Este caso de uso permite al Campaign Manager Service actualizar
 * los campos relacionados con campañas promocionales en un producto.
 */

export interface UpdateProductCampaignInput {
  in_campaign: boolean;
  campaign_id: string;
  campaign_price: number;
  original_price: number;
  discount_percentage: number;
}

export class UpdateProductCampaign {
  /**
   * Actualiza los campos de campaña de un producto
   * 
   * @param productId - ID del producto a actualizar
   * @param campaignData - Datos de la campaña a aplicar
   * @returns Producto actualizado o null si no existe
   */
  static async execute(
    productId: string,
    campaignData: UpdateProductCampaignInput
  ): Promise<IProduct | null> {
    try {
      // Validar que el producto existe
      const product = await Product.findById(productId);
      
      if (!product) {
        logger.warn(`Product not found for campaign update: ${productId}`);
        return null;
      }

      // Validar datos de campaña
      if (campaignData.campaign_price < 0) {
        throw new Error('Campaign price must be non-negative');
      }

      if (campaignData.original_price < 0) {
        throw new Error('Original price must be non-negative');
      }

      if (campaignData.discount_percentage < 0 || campaignData.discount_percentage > 100) {
        throw new Error('Discount percentage must be between 0 and 100');
      }

      // Actualizar campos de campaña
      product.in_campaign = campaignData.in_campaign;
      product.campaign_id = campaignData.campaign_id;
      product.campaign_price = campaignData.campaign_price;
      product.original_price = campaignData.original_price;
      product.discount_percentage = campaignData.discount_percentage;

      // Guardar cambios
      await product.save();

      logger.info(`Product campaign fields updated: ${product.sku}`, {
        productId: product._id,
        campaignId: campaignData.campaign_id,
        discountPercentage: campaignData.discount_percentage,
      });

      return product;
    } catch (error) {
      logger.error('Error updating product campaign fields', {
        productId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
