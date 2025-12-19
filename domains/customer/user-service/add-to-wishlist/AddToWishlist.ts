/**
 * Caso de Uso: Agregar a Lista de Deseos
 * 
 * Agrega un producto a la wishlist del usuario autenticado
 */

import { Wishlist } from '../shared/models/Wishlist';
import { logger } from '../shared/utils/logger';
import axios from 'axios';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3000';

export interface AddToWishlistRequest {
  userId: number;
  productId: string;
}

export interface AddToWishlistResponse {
  success: boolean;
  data?: {
    id: number;
    productId: string;
    product: any;
    addedAt: Date;
  };
  message?: string;
}

export class AddToWishlist {
  async execute(request: AddToWishlistRequest): Promise<AddToWishlistResponse> {
    try {
      const { userId, productId } = request;

      logger.info(`Adding product ${productId} to wishlist for user ${userId}`);

      // Verificar si el producto ya está en la wishlist
      const existing = await Wishlist.findOne({
        where: {
          user_id: userId,
          product_id: productId,
        },
      });

      if (existing) {
        logger.info(`Product ${productId} already in wishlist`);
        
        // Obtener detalles del producto
        let product: any = null;
        try {
          const response = await axios.get(
            `${PRODUCT_SERVICE_URL}/products/${productId}`,
            { timeout: 5000 }
          );
          product = response.data.data || response.data;
        } catch (err: any) {
          logger.warn(`Error fetching product details: ${err.message || 'Unknown error'}`);
          product = { id: productId, name: 'Producto no disponible' };
        }

        return {
          success: true,
          data: {
            id: existing.id,
            productId: existing.product_id,
            product,
            addedAt: existing.added_at,
          },
          message: 'El producto ya está en tu lista de deseos',
        };
      }

      // Obtener detalles del producto para guardar el SKU
      let productSku = productId; // Fallback
      let product: any = null;
      
      try {
        const response = await axios.get(
          `${PRODUCT_SERVICE_URL}/products/${productId}`,
          { timeout: 5000 }
        );
        product = response.data.data || response.data;
        productSku = product.sku || productId;
      } catch (err: any) {
        logger.warn(`Error fetching product details: ${err.message || 'Unknown error'}`);
        product = { id: productId, name: 'Producto no disponible' };
      }

      // Crear nuevo item en wishlist
      const wishlistItem = await Wishlist.create({
        user_id: userId,
        product_id: productId,
        product_sku: productSku,
        added_at: new Date(),
      });

      logger.info(`Product ${productId} added to wishlist successfully`);

      return {
        success: true,
        data: {
          id: wishlistItem.id,
          productId: wishlistItem.product_id,
          product,
          addedAt: wishlistItem.added_at,
        },
        message: 'Producto agregado a tu lista de deseos',
      };
    } catch (error: any) {
      logger.error(`Error adding to wishlist: ${error.message || 'Unknown error'}`);
      
      return {
        success: false,
        message: error.message || 'Error al agregar a la lista de deseos',
      };
    }
  }
}
